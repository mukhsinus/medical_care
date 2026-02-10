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
    help: `📖 Commands

COMMON:
/help
/login (private)
/logout (private)`,
    helpAdmin: `
ADMIN:
/clients
/orders
/status`,
    helpOwner: `
OWNER:
/addadmin TG_ID
/removeadmin TG_ID`,
    status: `📊 Status`,
    totalClients: `👥 Total clients:`,
    paidOrders30: `💳 Paid orders (last 30 days):`,
    paidOrdersToday: `🆕 Paid orders today:`,
    yourRole: `👤 Your role:`,
    clientsPage: `👥 Clients (page`,
    noOrders: "No orders",
    ordersTitle: "🧾 Orders",
    noAccess: "❌ Access denied",
    errorStatus: "❌ Error fetching status",
  },
  ru: {
    choose: "🌍 Выберите язык",
    hello: (n, id, r) =>
      `👋 Привет, ${n}

👤 Имя: ${n}
🆔 ID: ${id}
⚡️ Статус: ${r || 'Пользователь'}

ℹ️ Используйте /help`,
    help: `📖 Команды

ОБЩИЕ:
/help
/login (приватный)
/logout (приватный)`,
    helpAdmin: `
АДМИНИСТРАТОР:
/clients
/orders
/status`,
    helpOwner: `
ВЛАДЕЛЕЦ:
/addadmin TG_ID
/removeadmin TG_ID`,
    status: `📊 Статус`,
    totalClients: `👥 Всего клиентов:`,
    paidOrders30: `💳 Оплаченные заказы (последние 30 дней):`,
    paidOrdersToday: `🆕 Оплаченные заказы сегодня:`,
    yourRole: `👤 Ваша роль:`,
    clientsPage: `👥 Клиенты (страница`,
    noOrders: "Нет заказов",
    ordersTitle: "🧾 Заказы",
    noAccess: "❌ Доступ запрещен",
    errorStatus: "❌ Ошибка при получении статуса",
  },
  uz: {
    choose: "🌍 Tilni tanlang",
    hello: (n, id, r) =>
      `👋 Salom, ${n}

👤 Ism: ${n}
🆔 ID: ${id}
⚡️ Holat: ${r || "Foydalanuvchi"}

ℹ️ /help buyrug‘idan foydalaning`,    help: `📖 Buyruqlar

UMUMIY:
/help
/login (xususiy)
/logout (xususiy)`,
    helpAdmin: `
ADMIN:
/clients
/orders
/status`,
    helpOwner: `
EGASI:
/addadmin TG_ID
/removeadmin TG_ID`,
    status: `📊 Holat`,
    totalClients: `👥 Jami mijozlar:`,
    paidOrders30: `💳 To'langan buyurtmalar (oxirgi 30 kun):`,
    paidOrdersToday: `🆕 Bugun to'langan buyurtmalar:`,
    yourRole: `👤 Sizning rolni:`,
    clientsPage: `👥 Mijozlar (sahifa`,
    noOrders: "Buyurtmalar yo'q",
    ordersTitle: "🧾 Buyurtmalar",
    noAccess: "❌ Kirishga ruxsat yo'q",
    errorStatus: "❌ Holat olishda xatolik",  },
};

/* ================= HELPERS ================= */
function isPrivate(msg) {
  return msg.chat.type === "private";
}

function getLang(chatId) {
  return userLang.get(chatId) || "en";
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
    const lang = getLang(msg.chat.id);
    const role = await getRole(msg);

    let text = T[lang].help;

    if (role === "ADMIN" || role === "OWNER") {
      text += T[lang].helpAdmin;
    }

    if (role === "OWNER") {
      text += T[lang].helpOwner;
    }

    bot.sendMessage(msg.chat.id, text);
  });

  /* ================= STATUS ================= */
  bot.onText(/\/status/, async (msg) => {
    if (!(await requireRole(msg, ["ADMIN", "OWNER"]))) {
      const lang = getLang(msg.chat.id);
      bot.sendMessage(msg.chat.id, T[lang].noAccess);
      return;
    }

    try {
      const lang = getLang(msg.chat.id);
      // Get today's start time (00:00:00)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Query stats
      const clients = await User.countDocuments();
      const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Count only paid orders (paymentStatus = "completed")
      const paidOrders30 = await Order.countDocuments({
        paymentStatus: "completed",
        createdAt: { $gte: last30 },
      });
      const paidToday = await Order.countDocuments({
        paymentStatus: "completed",
        createdAt: { $gte: todayStart },
      });

      const roleStr = await getRole(msg);
      const text = `${T[lang].status}

${T[lang].totalClients} ${clients}

${T[lang].paidOrders30} ${paidOrders30}
${T[lang].paidOrdersToday} ${paidToday}

${T[lang].yourRole} ${roleStr}`;

      bot.sendMessage(msg.chat.id, text);
    } catch (err) {
      console.error('Status command error:', err);
      const lang = getLang(msg.chat.id);
      bot.sendMessage(msg.chat.id, T[lang].errorStatus);
    }
  });

  /* ================= CLIENTS PAGINATION ================= */
  async function sendClients(chatId, page = 0) {
    const lang = getLang(chatId);
    const limit = 10;
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit);

    let text = `${T[lang].clientsPage} ${page + 1})\n\n`;
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
    if (!(await requireRole(msg, ["ADMIN", "OWNER"]))) {
      const lang = getLang(msg.chat.id);
      bot.sendMessage(msg.chat.id, T[lang].noAccess);
      return;
    }
    sendClients(msg.chat.id, 0);
  });

  /* ================= ORDERS BY CLIENT ================= */
  async function sendOrdersByUser(chatId, userId, page = 0) {
    const lang = getLang(chatId);
    const limit = 5;
    if (page < 0) page = 0;

    const user = await User.findById(userId);
    if (!user) {
      return bot.sendMessage(chatId, T[lang].noOrders);
    }

    let orders = await Order.find({ userId: user._id, paymentStatus: "completed" })
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit);

    if (!orders.length && user.phone) {
      orders = await Order.find({ "customer.phone": user.phone, paymentStatus: "completed" })
        .sort({ createdAt: -1 })
        .skip(page * limit)
        .limit(limit);
    }

    if (!orders.length) {
      return bot.sendMessage(chatId, T[lang].noOrders);
    }

    let text = `${T[lang].ordersTitle}\n\n`;

    orders.forEach((o, idx) => {
      const orderNumber = page * limit + idx + 1;
      const itemsText = (o.items || [])
        .map((i) => `• ${i.name} × ${i.quantity}`)
        .join("\n");
      const totalStr = Number(o.amount || 0).toLocaleString("uz-UZ");
      const statusStr = o.paymentStatus || o.status || "unknown";
      text += `🧾 Order ${orderNumber}\n${itemsText}\n💰 Total: ${totalStr} UZS\n📅 ${o.createdAt.toLocaleDateString()}\n📦 ${statusStr}\n\n`;
    });

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⬅️",
              callback_data: `orders_${userId}_${page - 1}`,
            },
            {
              text: "➡️",
              callback_data: `orders_${userId}_${page + 1}`,
            },
          ],
        ],
      },
    });
  }

  async function sendPaidOrders(chatId, page = 0) {
    const lang = getLang(chatId);
    const limit = 5;
    if (page < 0) page = 0;

    const orders = await Order.find({ paymentStatus: "completed" })
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit);

    if (!orders.length) {
      return bot.sendMessage(chatId, T[lang].noOrders);
    }

    let text = `${T[lang].ordersTitle}\n\n`;

    orders.forEach((o, idx) => {
      const orderNumber = page * limit + idx + 1;
      const itemsText = (o.items || [])
        .map((i) => `• ${i.name} × ${i.quantity}`)
        .join("\n");
      const totalStr = Number(o.amount || 0).toLocaleString("uz-UZ");
      const statusStr = o.paymentStatus || o.status || "unknown";
      text += `🧾 Order ${orderNumber}\n${itemsText}\n💰 Total: ${totalStr} UZS\n📅 ${o.createdAt.toLocaleDateString()}\n📦 ${statusStr}\n\n`;
    });

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "⬅️", callback_data: `ordersall_${page - 1}` },
            { text: "➡️", callback_data: `ordersall_${page + 1}` },
          ],
        ],
      },
    });
  }

  bot.onText(/\/orders/, async (msg) => {
    if (!(await requireRole(msg, ["ADMIN", "OWNER"]))) {
      const lang = getLang(msg.chat.id);
      bot.sendMessage(msg.chat.id, T[lang].noAccess);
      return;
    }
    sendPaidOrders(msg.chat.id, 0);
  });

  /* ================= CALLBACKS ================= */
  bot.on("callback_query", async (q) => {
    if (q.data.startsWith("clients_")) {
      sendClients(q.message.chat.id, parseInt(q.data.split("_")[1]));
    }

    if (q.data.startsWith("client_")) {
      sendOrdersByUser(q.message.chat.id, q.data.split("_")[1], 0);
    }

    if (q.data.startsWith("orders_")) {
      const [, uid, page] = q.data.split("_");
      sendOrdersByUser(q.message.chat.id, uid, parseInt(page));
    }

    if (q.data.startsWith("ordersall_")) {
      const [, page] = q.data.split("_");
      sendPaidOrders(q.message.chat.id, parseInt(page));
    }
  });

  /* ================= SETGROUP ================= */
  bot.onText(/\/setgroup/, async (msg) => {
    if (!(await requireRole(msg, ["ADMIN", "OWNER"]))) {
      const lang = getLang(msg.chat.id);
      bot.sendMessage(msg.chat.id, T[lang].noAccess);
      return;
    }

    const lang = getLang(msg.chat.id);
    
    // Check if this is a group chat
    if (msg.chat.type === 'private') {
      const i18nKey = lang === 'ru' ? 'Используйте /setgroup в группе.' : lang === 'uz' ? '/setgroup guruh ichida.' : 'Use /setgroup inside the group.';
      bot.sendMessage(msg.chat.id, i18nKey);
      return;
    }

    try {
      // Save or update the group in BotChannel
      await BotChannel.findOneAndUpdate(
        { chatId: String(msg.chat.id) },
        {
          chatId: String(msg.chat.id),
          type: msg.chat.type,
          title: msg.chat.title || msg.chat.username || 'Group',
        },
        { upsert: true, new: true }
      );

      const successMsg = lang === 'ru' ? '✅ Группа подписана.' : lang === 'uz' ? '✅ Guruh obuna qilindi.' : '✅ Group subscribed.';
      bot.sendMessage(msg.chat.id, successMsg);
      console.log(`✅ Group subscribed: ${msg.chat.id} (${msg.chat.title})`);
    } catch (err) {
      console.error('Error setting group:', err);
      const failMsg = lang === 'ru' ? '❌ Ошибка подписки.' : lang === 'uz' ? '❌ Obuna xatosi.' : '❌ Failed to subscribe group.';
      bot.sendMessage(msg.chat.id, failMsg);
    }
  });

  /* ================= UNSETGROUP ================= */
  bot.onText(/\/unsetgroup/, async (msg) => {
    if (!(await requireRole(msg, ["ADMIN", "OWNER"]))) {
      const lang = getLang(msg.chat.id);
      bot.sendMessage(msg.chat.id, T[lang].noAccess);
      return;
    }

    const lang = getLang(msg.chat.id);
    
    // Check if this is a group chat
    if (msg.chat.type === 'private') {
      const i18nKey = lang === 'ru' ? 'Используйте /unsetgroup в группе.' : lang === 'uz' ? '/unsetgroup guruh ichida.' : 'Use /unsetgroup inside the group.';
      bot.sendMessage(msg.chat.id, i18nKey);
      return;
    }

    try {
      const result = await BotChannel.findOneAndDelete({ chatId: String(msg.chat.id) });

      if (result) {
        const successMsg = lang === 'ru' ? '✅ Группа отписана.' : lang === 'uz' ? '✅ Guruh obunadan chiqdi.' : '✅ Group unsubscribed.';
        bot.sendMessage(msg.chat.id, successMsg);
        console.log(`✅ Group unsubscribed: ${msg.chat.id}`);
      } else {
        const notMsg = lang === 'ru' ? 'Группа не была подписана.' : lang === 'uz' ? 'Guruh obuna qilinmagan edi.' : 'Group was not subscribed.';
        bot.sendMessage(msg.chat.id, notMsg);
      }
    } catch (err) {
      console.error('Error unsetting group:', err);
      const failMsg = lang === 'ru' ? '❌ Ошибка.' : lang === 'uz' ? '❌ Xato.' : '❌ Error.';
      bot.sendMessage(msg.chat.id, failMsg);
    }
  });

  /* ================= MY_CHAT_MEMBER (Auto-register/remove groups) ================= */
  bot.on('my_chat_member', async (update) => {
    const { chat, new_chat_member } = update;
    const botMember = new_chat_member;

    console.log(`[MY_CHAT_MEMBER] Bot status changed in ${chat.title || chat.id}:`, botMember.status);

    if (chat.type === 'private') return; // Ignore private chats

    // Bot was added to a group
    if (botMember.status === 'member' || botMember.status === 'administrator') {
      try {
        await BotChannel.findOneAndUpdate(
          { chatId: String(chat.id) },
          {
            chatId: String(chat.id),
            type: chat.type,
            title: chat.title || chat.username || 'Group',
          },
          { upsert: true, new: true }
        );
        console.log(`✅ Bot added to group: ${chat.id} (${chat.title})`);
        
        // Send a welcome message
        const welcomeMsg = `👋 *MedShop Admin Bot* has joined!\n\nUse /help to see available commands.`;
        bot.sendMessage(chat.id, welcomeMsg, { parse_mode: 'Markdown' }).catch(() => {});
      } catch (err) {
        console.error('Error registering group:', err);
      }
    }

    // Bot was removed from a group
    if (botMember.status === 'left' || botMember.status === 'kicked') {
      try {
        await BotChannel.findOneAndDelete({ chatId: String(chat.id) });
        console.log(`✅ Bot removed from group: ${chat.id}`);
      } catch (err) {
        console.error('Error deregistering group:', err);
      }
    }
  });

  console.log("✅ Bot fully started");
})();
