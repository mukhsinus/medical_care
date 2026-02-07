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
    choose_lang: '🌍 Choose language',
    hello: (name, id, role) =>
      `👋 Hello, ${name}\n\n👤 Name: ${name}\n🆔 ID: ${id}\n⚡️ Status: ${role || 'GUEST'}`,
    help: '📖 Available commands',
  },
  ru: {
    choose_lang: '🌍 Выберите язык',
    hello: (name, id, role) =>
      `👋 Привет, ${name}\n\n👤 Имя: ${name}\n🆔 ID: ${id}\n⚡️ Статус: ${role || 'ГОСТЬ'}`,
    help: '📖 Доступные команды',
  },
  uz: {
    choose_lang: '🌍 Tilni tanlang',
    hello: (name, id, role) =>
      `👋 Salom, ${name}\n\n👤 Ism: ${name}\n🆔 ID: ${id}\n⚡️ Holat: ${role || 'MEHMON'}`,
    help: '📖 Mavjud buyruqlar',
  },
};

/* =========================
   HELPERS
========================= */
async function getRole(msg) {
  const tgId = msg.from?.id?.toString();
  if (!tgId) return null;
  if (OWNER_IDS.has(tgId)) return 'owner';
  const admin = await BotAdmin.findOne({ telegramId: tgId, isActive: true });
  return admin ? 'admin' : null;
}

async function requireRole(msg, roles) {
  const role = await getRole(msg);
  return role && roles.includes(role);
}

function isPrivate(msg) {
  return msg.chat.type === 'private';
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
    const chatId = msg.chat.id;

    await bot.sendMessage(
      chatId,
      T.en.choose_lang,
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
    const chatId = q.message.chat.id;
    if (!q.data.startsWith('lang_')) return;

    const lang = q.data.replace('lang_', '');
    if (!LANGS.includes(lang)) return;

    userLang.set(chatId, lang);

    const name = q.from.first_name || q.from.username || 'User';
    const role = await getRole({ from: q.from });

    await bot.editMessageText(
      T[lang].hello(name, q.from.id, role ? role.toUpperCase() : null),
      { chat_id: chatId, message_id: q.message.message_id }
    );
  });

  /* =========================
     /help
  ========================= */
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const lang = userLang.get(chatId) || 'en';
    const role = await getRole(msg);

    let text = `<b>${T[lang].help}</b>\n\n`;

    if (role === 'owner') {
      text +=
`👑 OWNER
/addadmin TG_ID
/removeadmin TG_ID

`;
    }

    if (role === 'admin' || role === 'owner') {
      text +=
`🛠 ADMIN
/clients
/orders
/stats
/setgroup
/unsetgroup
/logout
`;
    }

    if (!role) {
      text += `ℹ️ No admin access`;
    }

    bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  });

  /* =========================
     LOGIN / LOGOUT (PRIVATE ONLY)
  ========================= */
  bot.onText(/\/login/, async (msg) => {
    if (!isPrivate(msg)) return;
    bot.sendMessage(msg.chat.id, '✅ You are logged in');
  });

  bot.onText(/\/logout/, async (msg) => {
    if (!isPrivate(msg)) return;
    await BotSession.deleteOne({ chatId: msg.chat.id.toString() });
    bot.sendMessage(msg.chat.id, '👋 Logged out');
  });

  /* =========================
     CLIENTS
  ========================= */
  bot.onText(/\/clients/, async (msg) => {
    if (!(await requireRole(msg, ['admin', 'owner']))) return;

    const users = await User.find().sort({ createdAt: -1 });
    let text = `👥 Clients (${users.length})\n\n`;

    users.forEach(u => {
      text += `👤 ${u.name}\n📞 ${u.phone || '-'}\n📧 ${u.email || '-'}\n\n`;
    });

    bot.sendMessage(msg.chat.id, text);
  });

  /* =========================
     ORDERS (PAGINATION BY USER)
  ========================= */
  async function sendOrdersPage(chatId, page = 0) {
    const users = await User.find().sort({ createdAt: -1 });
    if (!users.length) {
      return bot.sendMessage(chatId, 'No orders yet');
    }

    if (page < 0) page = 0;
    if (page >= users.length) page = users.length - 1;

    const user = users[page];
    const orders = await Order.find({ userId: user._id });

    let text = `🧾 Orders for ${user.name}\n\n`;

    orders.forEach(o => {
      o.items?.forEach(i => {
        text +=
`• ${i.name} × ${i.quantity}
📅 ${o.createdAt.toLocaleDateString()}
📦 ${o.status || 'unknown'}

`;
      });
    });

    await bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [[
          { text: '⬅️ Prev', callback_data: `orders_${page - 1}` },
          { text: '➡️ Next', callback_data: `orders_${page + 1}` },
        ]],
      },
    });
  }

  bot.onText(/\/orders/, async (msg) => {
    if (!(await requireRole(msg, ['admin', 'owner']))) return;
    await sendOrdersPage(msg.chat.id, 0);
  });

  bot.on('callback_query', async (q) => {
    if (!q.data.startsWith('orders_')) return;
    const page = parseInt(q.data.replace('orders_', ''), 10);
    await sendOrdersPage(q.message.chat.id, page);
  });

  console.log('✅ Bot fully started');
})();