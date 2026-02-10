// bot.js
require("dotenv").config();

const mongoose = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");

const BotAdmin = require("./models/BotAdmin");
const User = require("./models/User");
const Order = require("./models/Order");
const BotChannel = require("./models/BotChannel");

/* ================= OWNER IDS ================= */
const OWNER_IDS = new Set(["1157064", "5532256714", "370255715"]);

/* ================= ENV ================= */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;

if (!TOKEN || !MONGO_URI) {
  console.error("❌ Missing env vars");
  process.exit(1);
}

/* ================= BOT ================= */
const bot = new TelegramBot(TOKEN, { polling: true });
module.exports = bot;

/* ================= I18N ================= */
const LANGS = ["en", "ru", "uz"];
const userLang = new Map();

const T = {
  en: {
    choose: "🌍 Choose language",
    hello: (n, id, r) =>
      `👋 Hello, ${n}

👤 Name: ${n}
🆔 ID: ${id}
⚡️ Status: ${r || 'User'}

ℹ️ Use /help to learn more`,
  },
  ru: {
    choose: "🌍 Выберите язык",
    hello: (n, id, r) =>
      `👋 Привет, ${n}

👤 Имя: ${n}
🆔 ID: ${id}
⚡️ Статус: ${r || 'Пользователь'}

ℹ️ Используйте /help`,
  },
  uz: {
    choose: "🌍 Tilni tanlang",
    hello: (n, id, r) =>
      `👋 Salom, ${n}

👤 Ism: ${n}
🆔 ID: ${id}
⚡️ Holat: ${r || "Foydalanuvchi"}

ℹ️ /help buyrug‘idan foydalaning`,
  },
};

/* ================= HELPERS ================= */
function isPrivate(msg) {
  return msg.chat.type === "private";
}

async function getRole(msg) {
  const id = msg.from?.id?.toString();
  if (!id) return null;
  if (OWNER_IDS.has(id)) return "OWNER";
  const admin = await BotAdmin.findOne({ telegramId: id, isActive: true });
  return admin ? "ADMIN" : null;
}

async function requireRole(msg, roles) {
  const r = await getRole(msg);
  return roles.includes(r);
}

/* ================= DB ================= */
(async () => {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Mongo connected");
  await bot.deleteWebHook({ drop_pending_updates: true }).catch(() => {});

  /* ================= START ================= */
  bot.onText(/\/start/, async (msg) => {
    bot.sendMessage(msg.chat.id, T.en.choose, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🇬🇧 English", callback_data: "lang_en" }],
          [{ text: "🇷🇺 Русский", callback_data: "lang_ru" }],
          [{ text: "🇺🇿 O‘zbek", callback_data: "lang_uz" }],
        ],
      },
    });
  });

  bot.on("callback_query", async (q) => {
    if (!q.data.startsWith("lang_")) return;
    const lang = q.data.replace("lang_", "");
    userLang.set(q.message.chat.id, lang);

    const name = q.from.first_name || q.from.username || "User";
    const role = await getRole({ from: q.from });

    bot.editMessageText(T[lang].hello(name, q.from.id, role), {
      chat_id: q.message.chat.id,
      message_id: q.message.message_id,
    });
  });

  /* ================= HELP ================= */
  bot.onText(/\/help/, async (msg) => {
    const role = await getRole(msg);

    let text = `📖 Commands

COMMON:
/help
/login (private)
/logout (private)
`;

    if (role === "ADMIN" || role === "OWNER") {
      text += `
ADMIN:
/clients
/orders
/status
`;
    }

    if (role === "OWNER") {
      text += `
OWNER:
/addadmin TG_ID
/removeadmin TG_ID
`;
    }

    bot.sendMessage(msg.chat.id, text);
  });

  /* ================= STATUS ================= */
  bot.onText(/\/status/, async (msg) => {
    if (!(await requireRole(msg, ["ADMIN", "OWNER"]))) return;

    try {
      // Get today's start time (00:00:00)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Query stats
      const clients = await User.countDocuments();
      const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const orders30 = await Order.countDocuments({
        createdAt: { $gte: last30 },
      });
      const clientsWithOrders = await Order.distinct("userId");
      const newToday = await Order.countDocuments({
        createdAt: { $gte: todayStart },
      });

      const text = `📊 Status

👥 Total clients: ${clients}
🛍️ Clients with orders: ${clientsWithOrders.length}

📅 Orders (last 30 days): ${orders30}
🆕 New orders today: ${newToday}

👤 Your role: ${await getRole(msg)}`;

      bot.sendMessage(msg.chat.id, text);
    } catch (err) {
      console.error('Status command error:', err);
      bot.sendMessage(msg.chat.id, '❌ Error fetching status');
    }
  });

  /* ================= CLIENTS PAGINATION ================= */
  async function sendClients(chatId, page = 0) {
    const limit = 10;
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit);

    let text = `👥 Clients (page ${page + 1})\n\n`;
    const kb = [];

    users.forEach((u) => {
      text += `👤 ${u.name} (${u.phone || "-"})\n`;
      kb.push([{ text: u.name, callback_data: `client_${u._id}` }]);
    });

    kb.push([
      { text: "⬅️", callback_data: `clients_${page - 1}` },
      { text: "➡️", callback_data: `clients_${page + 1}` },
    ]);

    bot.sendMessage(chatId, text, { reply_markup: { inline_keyboard: kb } });
  }

  bot.onText(/\/clients/, async (msg) => {
    if (!(await requireRole(msg, ["ADMIN", "OWNER"]))) return;
    sendClients(msg.chat.id, 0);
  });

  /* ================= ORDERS BY CLIENT ================= */
  async function sendOrdersByUser(chatId, userId, page = 0, all = false) {
    const limit = 5;
    const q = { userId };

    if (!all) {
      q.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const orders = await Order.find(q)
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit);

    if (!orders.length) {
      return bot.sendMessage(chatId, "No orders");
    }

    let text = `🧾 Orders\n\n`;

    orders.forEach((o) => {
      o.items?.forEach((i) => {
        text += `• ${i.name} × ${i.quantity}
📅 ${o.createdAt.toLocaleDateString()}
📦 ${o.status || "unknown"}

`;
      });
    });

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⬅️",
              callback_data: `orders_${userId}_${page - 1}_${all ? 1 : 0}`,
            },
            {
              text: "➡️",
              callback_data: `orders_${userId}_${page + 1}_${all ? 1 : 0}`,
            },
          ],
        ],
      },
    });
  }

  bot.onText(/\/orders/, async (msg) => {
    if (!(await requireRole(msg, ["ADMIN", "OWNER"]))) return;
    const u = await User.findOne().sort({ createdAt: -1 });
    if (!u) return;
    sendOrdersByUser(msg.chat.id, u._id, 0, false);
  });

  /* ================= CALLBACKS ================= */
  bot.on("callback_query", async (q) => {
    if (q.data.startsWith("clients_")) {
      sendClients(q.message.chat.id, parseInt(q.data.split("_")[1]));
    }

    if (q.data.startsWith("client_")) {
      sendOrdersByUser(q.message.chat.id, q.data.split("_")[1], 0, true);
    }

    if (q.data.startsWith("orders_")) {
      const [, uid, page, all] = q.data.split("_");
      sendOrdersByUser(q.message.chat.id, uid, parseInt(page), all === "1");
    }
  });

  console.log("✅ Bot fully started");
})();
