require('dotenv').config();

const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const bcrypt = require('bcryptjs');

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
   1. CREATE BOT ONCE
========================= */
const bot = new TelegramBot(TOKEN, { polling: true });
module.exports = bot;

/* =========================
   2. GRACEFUL SHUTDOWN
========================= */
process.on('SIGTERM', async () => {
  console.log('[BOT] SIGTERM received');
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(0);
});

/* =========================
   3. ASYNC INIT
========================= */
(async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Bot connected to MongoDB');

  try {
    await bot.deleteWebHook({ drop_pending_updates: true });
  } catch (e) {
    console.warn('[BOT] deleteWebhook failed (ok):', e?.message);
  }

  bot.on('polling_error', (err) =>
    console.error('[BOT] Polling error:', err.message)
  );

  bot.getMe().then((i) =>
    console.log(`🤖 Bot connected as @${i.username}`)
  );

  /* =========================
     HANDLERS
  ========================= */

  bot.onText(/\/login/, async (msg) => {
    const notifier = require('./utils/telegramNotifier');
    const { loginStates, LOGIN_STATES } = notifier;

    const chatId = msg.chat.id.toString();
    const lang = await notifier.getLang(chatId);

    const existing = await BotSession.findOne({
      chatId,
      expiresAt: { $gt: Date.now() },
    });

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
    const notifier = require('./utils/telegramNotifier');
    const { loginStates, LOGIN_STATES } = notifier;

    const chatId = msg.chat.id.toString();
    const text = msg.text?.trim();

    if (!text || text.startsWith('/')) return;

    const state = loginStates.get(chatId);
    if (!state) return;

    if (state.state === LOGIN_STATES.WAITING_USERNAME) {
      const admin = await BotAdmin.findOne({ username: text });

      if (!admin) {
        loginStates.delete(chatId);
        return bot.sendMessage(
          chatId,
          notifier.t(state.lang, 'invalid_username')
        );
      }

      loginStates.set(chatId, {
        state: LOGIN_STATES.WAITING_PASSWORD,
        username: text,
        adminId: admin._id,
        lang: state.lang,
      });

      return bot.sendMessage(
        chatId,
        notifier.t(state.lang, 'enter_password')
      );
    }

    if (state.state === LOGIN_STATES.WAITING_PASSWORD) {
      const admin = await BotAdmin.findOne({ username: state.username });
      const ok = await bcrypt.compare(text, admin.password);

      if (!ok) {
        loginStates.delete(chatId);
        return bot.sendMessage(
          chatId,
          notifier.t(state.lang, 'invalid_password')
        );
      }

      await notifier.ensureSession(chatId, state.adminId, state.lang);
      loginStates.delete(chatId);

      return bot.sendMessage(
        chatId,
        notifier.t(state.lang, 'logged_in', state.username)
      );
    }
  });

  bot.onText(/\/logout/, async (msg) => {
    const chatId = msg.chat.id.toString();
    await BotSession.findOneAndDelete({ chatId });
    bot.sendMessage(chatId, 'Logged out');
  });

  bot.onText(/^\/lang\s*(\w+)?/, async (msg, match) => {
    const notifier = require('./utils/telegramNotifier');
    const { SUPPORTED_LANGS } = notifier;

    const chatId = msg.chat.id.toString();
    const code = (match?.[1] || '').toLowerCase();

    if (!SUPPORTED_LANGS.includes(code)) return;

    await BotSession.findOneAndUpdate({ chatId }, { lang: code });
    bot.sendMessage(chatId, `Language set to ${code}`);
  });

  bot.onText(/\/clients/, async (msg) => {
    const chatId = msg.chat.id.toString();
    if (!(await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } })))
      return;

    const users = await User.find().sort({ createdAt: -1 }).limit(5);
    let t = 'Clients:\n\n';
    users.forEach((u) => (t += `${u.name} | ${u.email}\n`));
    bot.sendMessage(chatId, t);
  });

  bot.onText(/\/orders/, async (msg) => {
    const chatId = msg.chat.id.toString();
    if (!(await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } })))
      return;

    const orders = await Order.find().limit(5);
    let t = 'Orders:\n\n';
    orders.forEach((o) => (t += `${o._id} | ${o.status}\n`));
    bot.sendMessage(chatId, t);
  });

  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id.toString();
    const users = await User.countDocuments();
    const orders = await Order.countDocuments();
    bot.sendMessage(chatId, `Users: ${users}\nOrders: ${orders}`);
  });

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
    await BotChannel.findOneAndDelete({
      chatId: msg.chat.id.toString(),
    });
    bot.sendMessage(msg.chat.id, 'Group unsubscribed');
  });

  bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Help');
  });

  await bot.setMyCommands([
    { command: '/login', description: 'Login' },
    { command: '/logout', description: 'Logout' },
    { command: '/clients', description: 'Clients' },
    { command: '/orders', description: 'Orders' },
    { command: '/stats', description: 'Stats' },
    { command: '/setgroup', description: 'Subscribe group' },
    { command: '/unsetgroup', description: 'Unsubscribe group' },
    { command: '/lang', description: 'Language' },
    { command: '/help', description: 'Help' },
  ]);

  console.log('✅ Bot fully started');
})();