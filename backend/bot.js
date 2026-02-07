require('dotenv').config();

const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');

const BotAdmin = require('./models/BotAdmin');
const BotSession = require('./models/BotSession');
const User = require('./models/User');
const Order = require('./models/Order');
const BotChannel = require('./models/BotChannel');

/* =========================
   OWNER IDS (HARDCODED)
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
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(0);
});

/* =========================
   HELPERS
========================= */
async function getRole(msg) {
  const tgId = msg.from?.id?.toString();
  if (!tgId) return null;

  if (OWNER_IDS.has(tgId)) return 'owner';

  const admin = await BotAdmin.findOne({ telegramId: tgId, isActive: true });
  if (admin) return 'admin';

  return null;
}

async function requireRole(msg, roles = []) {
  const role = await getRole(msg);
  if (!role) return false;
  return roles.includes(role);
}

/* =========================
   ASYNC INIT
========================= */
(async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Bot connected to MongoDB');

  try {
    await bot.deleteWebHook({ drop_pending_updates: true });
  } catch (_) {}

  bot.getMe().then((i) =>
    console.log(`🤖 Bot connected as @${i.username}`)
  );

  /* =========================
     /start
  ========================= */
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || msg.from.username || 'User';
    const tgId = msg.from.id.toString();

    const role = await getRole(msg);

    const text = `
👋 Hello, ${name}

👤 Name: ${name}
🆔 ID: ${tgId}
⚡️ Status: ${role ? role.toUpperCase() : 'GUEST'}

ℹ️ Use /help to see available commands
    `.trim();

    bot.sendMessage(chatId, text);
  });

  /* =========================
     /help
  ========================= */
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const role = await getRole(msg);

    let text = `📖 <b>Available commands</b>\n\n`;

    if (role === 'owner') {
      text += `
👑 <b>Owner</b>
/addadmin <tg_id> — Add admin
/removeadmin <tg_id> — Remove admin
`;
    }

    if (role === 'admin' || role === 'owner') {
      text += `
🛠 <b>Admin</b>
/clients — View all clients
/orders — View all orders
/stats — Project statistics
/setgroup — Subscribe group
/unsetgroup — Unsubscribe group
/logout — Logout
`;
    }

    if (!role) {
      text += `
ℹ️ You have no access to admin commands.
`;
    }

    bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  });

  /* =========================
     OWNER COMMANDS
  ========================= */

  // /addadmin <telegramId>
  bot.onText(/\/addadmin (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!(await requireRole(msg, ['owner']))) {
      return bot.sendMessage(chatId, '❌ Access denied');
    }

    const telegramId = match[1];

    const exists = await BotAdmin.findOne({ telegramId });
    if (exists) {
      return bot.sendMessage(chatId, '⚠️ Admin already exists');
    }

    await BotAdmin.create({
      telegramId,
      role: 'admin',
      isActive: true,
    });

    bot.sendMessage(chatId, `✅ Admin added: ${telegramId}`);
  });

  // /removeadmin <telegramId>
  bot.onText(/\/removeadmin (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!(await requireRole(msg, ['owner']))) {
      return bot.sendMessage(chatId, '❌ Access denied');
    }

    const telegramId = match[1];
    await BotAdmin.deleteOne({ telegramId });
    await BotSession.deleteMany({ adminTelegramId: telegramId });

    bot.sendMessage(chatId, `🗑 Admin removed: ${telegramId}`);
  });

  /* =========================
     ADMIN COMMANDS
  ========================= */

  bot.onText(/\/clients/, async (msg) => {
    if (!(await requireRole(msg, ['admin', 'owner']))) return;

    const users = await User.find().sort({ createdAt: -1 });
    let text = `👥 <b>Clients (${users.length})</b>\n\n`;

    users.forEach(u => {
      text += `👤 ${u.name}\n📞 ${u.phone || '-'}\n📧 ${u.email || '-'}\n🆔 ${u._id}\n\n`;
    });

    bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
  });

  bot.onText(/\/orders/, async (msg) => {
    if (!(await requireRole(msg, ['admin', 'owner']))) return;

    const orders = await Order.find().sort({ createdAt: -1 });
    let text = `🧾 <b>Orders (${orders.length})</b>\n\n`;

    orders.forEach(o => {
      text += `
🆔 ${o._id}
👤 User: ${o.userId}
💰 Total: ${o.total || 0}
📦 Status: ${o.status || 'unknown'}

`;
    });

    bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
  });

  bot.onText(/\/stats/, async (msg) => {
    if (!(await requireRole(msg, ['admin', 'owner']))) return;

    const users = await User.countDocuments();
    const orders = await Order.countDocuments();

    bot.sendMessage(
      msg.chat.id,
      `📊 Stats\n\n👥 Users: ${users}\n🧾 Orders: ${orders}`
    );
  });

  /* =========================
     GROUP SUBSCRIPTIONS
  ========================= */

  bot.onText(/\/setgroup/, async (msg) => {
    if (!(await requireRole(msg, ['admin', 'owner']))) return;
    if (!['group', 'supergroup'].includes(msg.chat.type)) return;

    await BotChannel.findOneAndUpdate(
      { chatId: msg.chat.id.toString() },
      {
        chatId: msg.chat.id.toString(),
        title: msg.chat.title,
        type: msg.chat.type,
      },
      { upsert: true }
    );

    bot.sendMessage(msg.chat.id, '✅ Group subscribed');
  });

  bot.onText(/\/unsetgroup/, async (msg) => {
    if (!(await requireRole(msg, ['admin', 'owner']))) return;

    await BotChannel.deleteOne({ chatId: msg.chat.id.toString() });
    bot.sendMessage(msg.chat.id, '❌ Group unsubscribed');
  });

  /* =========================
     /logout
  ========================= */
  bot.onText(/\/logout/, async (msg) => {
    await BotSession.deleteOne({ chatId: msg.chat.id.toString() });
    bot.sendMessage(msg.chat.id, '👋 Logged out');
  });

  console.log('✅ Bot fully started');
})();