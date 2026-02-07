require('dotenv').config();

const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');

const BotAdmin = require('./models/BotAdmin');
const BotSession = require('./models/BotSession');
const User = require('./models/User');
const Order = require('./models/Order');
const BotChannel = require('./models/BotChannel');

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
async function requireSession(chatId) {
  return BotSession.findOne({
    chatId,
    expiresAt: { $gt: Date.now() },
  });
}

async function requireRole(chatId, roles = []) {
  const session = await requireSession(chatId);
  if (!session) return null;
  const admin = await BotAdmin.findById(session.adminId);
  if (!admin || !admin.isActive) return null;
  if (roles.length && !roles.includes(admin.role)) return null;
  return admin;
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

  const notifier = require('./utils/telegramNotifier');
  const { loginStates, LOGIN_STATES } = notifier;

  /* =========================
     AUTH
  ========================= */

  bot.onText(/\/login/, async (msg) => {
    const chatId = msg.chat.id.toString();
    const lang = await notifier.getLang(chatId);

    const existing = await requireSession(chatId);
    if (existing) {
      return bot.sendMessage(chatId, notifier.t(lang, 'already_logged_in'));
    }

    loginStates.set(chatId, {
      state: LOGIN_STATES.WAITING_USERNAME,
      lang,
    });

    bot.sendMessage(chatId, notifier.t(lang, 'enter_username'));
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id.toString();
    const text = msg.text?.trim();
    if (!text || text.startsWith('/')) return;

    const state = loginStates.get(chatId);
    if (!state) return;

    if (state.state === LOGIN_STATES.WAITING_USERNAME) {
      const admin = await BotAdmin.findOne({ username: text });
      if (!admin || !admin.isActive) {
        loginStates.delete(chatId);
        return bot.sendMessage(chatId, notifier.t(state.lang, 'invalid_username'));
      }

      loginStates.set(chatId, {
        state: LOGIN_STATES.WAITING_PASSWORD,
        username: admin.username,
        adminId: admin._id,
        lang: state.lang,
      });

      return bot.sendMessage(chatId, notifier.t(state.lang, 'enter_password'));
    }

    if (state.state === LOGIN_STATES.WAITING_PASSWORD) {
      const admin = await BotAdmin.findById(state.adminId);
      if (!admin || !(await admin.comparePassword(text))) {
        loginStates.delete(chatId);
        return bot.sendMessage(chatId, notifier.t(state.lang, 'invalid_password'));
      }

      await admin.markLogin();
      await notifier.ensureSession(chatId, admin._id, state.lang);
      loginStates.delete(chatId);

      return bot.sendMessage(
        chatId,
        notifier.t(state.lang, 'logged_in', admin.username)
      );
    }
  });

  bot.onText(/\/logout/, async (msg) => {
    const chatId = msg.chat.id.toString();
    await BotSession.findOneAndDelete({ chatId });
    bot.sendMessage(chatId, 'Logged out');
  });

  /* =========================
     ADMIN COMMANDS
  ========================= */

  bot.onText(/\/clients/, async (msg) => {
    const chatId = msg.chat.id.toString();
    const admin = await requireRole(chatId, ['admin', 'owner']);
    if (!admin) return;

    const users = await User.find().sort({ createdAt: -1 }).limit(5);
    let t = 'Clients:\n\n';
    users.forEach((u) => (t += `${u.name} | ${u.email}\n`));
    bot.sendMessage(chatId, t);
  });

  bot.onText(/\/orders/, async (msg) => {
    const chatId = msg.chat.id.toString();
    const admin = await requireRole(chatId, ['admin', 'owner']);
    if (!admin) return;

    const orders = await Order.find().limit(5);
    let t = 'Orders:\n\n';
    orders.forEach((o) => (t += `${o._id} | ${o.status}\n`));
    bot.sendMessage(chatId, t);
  });

  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id.toString();
    const admin = await requireRole(chatId, ['admin', 'owner']);
    if (!admin) return;

    const users = await User.countDocuments();
    const orders = await Order.countDocuments();
    bot.sendMessage(chatId, `Users: ${users}\nOrders: ${orders}`);
  });

  /* =========================
     OWNER ONLY
  ========================= */

  bot.onText(/\/addadmin (\w+) (\w+) (\w+)/, async (msg, match) => {
    const chatId = msg.chat.id.toString();
    const owner = await requireRole(chatId, ['owner']);
    if (!owner) return bot.sendMessage(chatId, 'Access denied');

    const [, username, password, role] = match;
    if (!['owner', 'admin', 'viewer'].includes(role)) {
      return bot.sendMessage(chatId, 'Invalid role');
    }

    try {
      await BotAdmin.create({ username, password, role });
      bot.sendMessage(chatId, `✅ Admin ${username} created with role ${role}`);
    } catch (e) {
      bot.sendMessage(chatId, '❌ Failed to create admin');
    }
  });

  /* =========================
     GROUP SUBSCRIPTIONS
  ========================= */

  bot.onText(/\/setgroup/, async (msg) => {
    if (!['group', 'supergroup'].includes(msg.chat.type)) return;

    await BotChannel.findOneAndUpdate(
      { chatId: msg.chat.id.toString() },
      { chatId: msg.chat.id.toString(), title: msg.chat.title },
      { upsert: true }
    );

    bot.sendMessage(msg.chat.id, 'Group subscribed');
  });

  bot.onText(/\/unsetgroup/, async (msg) => {
    await BotChannel.findOneAndDelete({ chatId: msg.chat.id.toString() });
    bot.sendMessage(msg.chat.id, 'Group unsubscribed');
  });

  /* =========================
     COMMANDS LIST
  ========================= */

  await bot.setMyCommands([
    { command: '/login', description: 'Login' },
    { command: '/logout', description: 'Logout' },
    { command: '/clients', description: 'Clients (admin)' },
    { command: '/orders', description: 'Orders (admin)' },
    { command: '/stats', description: 'Stats (admin)' },
    { command: '/addadmin', description: 'Add admin (owner)' },
    { command: '/setgroup', description: 'Subscribe group' },
    { command: '/unsetgroup', description: 'Unsubscribe group' },
  ]);

  console.log('✅ Bot fully started');
})();