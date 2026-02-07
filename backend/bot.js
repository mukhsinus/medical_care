require('dotenv').config();

const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');

const BotAdmin = require('./models/BotAdmin');
const BotSession = require('./models/BotSession');
const User = require('./models/User');
const Order = require('./models/Order');
const BotChannel = require('./models/BotChannel');

/* =========================
   OWNER IDS
========================= */
const OWNER_IDS = new Set([
  '1157064',
  '5532256714',
  '370255715',
]);

/* =========================
   ENV
========================= */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;

if (!TOKEN || !MONGO_URI) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

/* =========================
   BOT INIT
========================= */
const bot = new TelegramBot(TOKEN, { polling: true });
module.exports = bot;

/* =========================
   GRACEFUL SHUTDOWN
========================= */
process.on('SIGTERM', async () => {
  try { await mongoose.connection.close(); } catch (_) {}
  process.exit(0);
});

/* =========================
   I18N
========================= */
const LANGS = ['en', 'ru', 'uz'];
const userLang = new Map();

const T = {
  en: {
    choose: '🌍 Choose language',
    hello: (name, id, role) =>
`👋 Hello, ${name}

👤 Name: ${name}
🆔 ID: ${id}
⚡️ Status: ${role}

ℹ️ Use /help to learn more`,
  },
  ru: {
    choose: '🌍 Выберите язык',
    hello: (name, id, role) =>
`👋 Привет, ${name}

👤 Имя: ${name}
🆔 ID: ${id}
⚡️ Статус: ${role}

ℹ️ Используйте /help`,
  },
  uz: {
    choose: '🌍 Tilni tanlang',
    hello: (name, id, role) =>
`👋 Salom, ${name}

👤 Ism: ${name}
🆔 ID: ${id}
⚡️ Holat: ${role}

ℹ️ /help buyrug‘idan foydalaning`,
  },
};

/* =========================
   HELPERS
========================= */
function isPrivate(msg) {
  return msg.chat.type === 'private';
}

async function getRole(msg) {
  const tgId = msg.from?.id?.toString();
  if (!tgId) return 'GUEST';
  if (OWNER_IDS.has(tgId)) return 'OWNER';

  const admin = await BotAdmin.findOne({ telegramId: tgId, isActive: true });
  return admin ? 'ADMIN' : 'GUEST';
}

async function requireRole(msg, roles) {
  const role = await getRole(msg);
  return roles.includes(role);
}

/* =========================
   ASYNC INIT
========================= */
(async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Bot connected to MongoDB');

  await bot.deleteWebHook({ drop_pending_updates: true }).catch(() => {});
  console.log('🤖 Bot started');

  /* =========================
     /start + language
  ========================= */
  bot.onText(/\/start/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      T.en.choose,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🇬🇧 English', callback_data: 'lang_en' }],
            [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }],
            [{ text: '🇺🇿 O‘zbek', callback_data: 'lang_uz' }],
          ],
        },
      }
    );
  });

  bot.on('callback_query', async (q) => {
    if (!q.data.startsWith('lang_')) return;

    const lang = q.data.replace('lang_', '');
    if (!LANGS.includes(lang)) return;

    const chatId = q.message.chat.id;
    userLang.set(chatId, lang);

    const name = q.from.first_name || q.from.username || 'User';
    const role = await getRole({ from: q.from });

    await bot.editMessageText(
      T[lang].hello(name, q.from.id, role),
      { chat_id: chatId, message_id: q.message.message_id }
    );
  });

  /* =========================
     /help (SAFE TEXT)
  ========================= */
  bot.onText(/\/help/, async (msg) => {
    const role = await getRole(msg);

    let text = `📖 Commands\n\n`;

    if (role === 'OWNER') {
      text +=
`OWNER:
/addadmin TG_ID
/removeadmin TG_ID

`;
    }

    if (role === 'ADMIN' || role === 'OWNER') {
      text +=
`ADMIN:
/clients
/orders
/status
/setgroup
/unsetgroup

`;
    }

    text +=
`COMMON:
/help
/login (private)
/logout (private)`;

    bot.sendMessage(msg.chat.id, text);
  });

  /* =========================
     LOGIN / LOGOUT (PRIVATE ONLY)
  ========================= */
  bot.onText(/\/login/, async (msg) => {
    if (!isPrivate(msg)) return;
    bot.sendMessage(msg.chat.id, '✅ Logged in');
  });

  bot.onText(/\/logout/, async (msg) => {
    if (!isPrivate(msg)) return;
    await BotSession.deleteOne({ chatId: msg.chat.id.toString() });
    bot.sendMessage(msg.chat.id, '👋 Logged out');
  });

  /* =========================
     STATUS (GROUP + PRIVATE)
  ========================= */
  bot.onText(/\/status/, async (msg) => {
    if (!(await requireRole(msg, ['ADMIN', 'OWNER']))) return;

    const users = await User.countDocuments();
    const orders = await Order.countDocuments();
    const role = await getRole(msg);

    bot.sendMessage(
      msg.chat.id,
`📊 Status

👤 Role: ${role}
👥 Clients: ${users}
🧾 Orders: ${orders}`
    );
  });

  /* =========================
     CLIENTS
  ========================= */
  bot.onText(/\/clients/, async (msg) => {
    if (!(await requireRole(msg, ['ADMIN', 'OWNER']))) return;

    const users = await User.find().sort({ createdAt: -1 });
    let text = `👥 Clients (${users.length})\n\n`;

    users.forEach(u => {
      text += `👤 ${u.name}\n📞 ${u.phone || '-'}\n\n`;
    });

    bot.sendMessage(msg.chat.id, text);
  });

  /* =========================
     ORDERS (PAGINATED)
  ========================= */
  async function sendOrdersPage(chatId, page) {
    const users = await User.find().sort({ createdAt: -1 });
    if (!users.length) return bot.sendMessage(chatId, 'No orders');

    if (page < 0) page = 0;
    if (page >= users.length) page = users.length - 1;

    const user = users[page];
    const orders = await Order.find({ userId: user._id });

    let text = `🧾 Orders — ${user.name}\n\n`;

    orders.forEach(o => {
      o.items?.forEach(i => {
        text += `• ${i.name} × ${i.quantity}\n📅 ${o.createdAt.toLocaleDateString()}\n📦 ${o.status}\n\n`;
      });
    });

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [[
          { text: '⬅️', callback_data: `orders_${page - 1}` },
          { text: '➡️', callback_data: `orders_${page + 1}` },
        ]],
      },
    });
  }

  bot.onText(/\/orders/, async (msg) => {
    if (!(await requireRole(msg, ['ADMIN', 'OWNER']))) return;
    sendOrdersPage(msg.chat.id, 0);
  });

  bot.on('callback_query', async (q) => {
    if (!q.data.startsWith('orders_')) return;
    const page = parseInt(q.data.replace('orders_', ''), 10);
    sendOrdersPage(q.message.chat.id, page);
  });

  console.log('✅ Bot fully started');
})();