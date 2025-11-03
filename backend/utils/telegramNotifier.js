// telegramBot.js
const TelegramBot = require('node-telegram-bot-api');
const bcrypt = require('bcryptjs');
const BotAdmin = require('../models/BotAdmin');
const BotSession = require('../models/BotSession');
const User = require('../models/User');
const Order = require('../models/Order');

const loginStates = new Map();

const LOGIN_STATES = {
  WAITING_USERNAME: 'WAITING_USERNAME',
  WAITING_PASSWORD: 'WAITING_PASSWORD',
};

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.warn('Telegram bot token missing—skipping notifications.');
  module.exports = { sendNotification: () => {} };
  process.exit(0);
}

console.log('Initializing Telegram bot...');
const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', (err) => console.error('Polling error:', err.message));

bot.getMe()
  .then((info) => console.log(`Bot connected as @${info.username}`))
  .catch((err) => console.error('Bot connection error:', err.message));

/* --------------------------------------------------------------
   NOTIFICATION (public function)
   -------------------------------------------------------------- */
async function sendNotification(message, options = {}) {
  try {
    const sessions = await BotSession.find({ expiresAt: { $gt: Date.now() } });
    if (!sessions.length) {
      console.log('No active admin sessions.');
      return;
    }
    for (const s of sessions) {
      await bot.sendMessage(s.chatId, message, { parse_mode: 'HTML', ...options });
      console.log(`Sent to ${s.chatId}`);
    }
  } catch (err) {
    console.error('Telegram send error:', err.message);
  }
}

/* --------------------------------------------------------------
   /login
   -------------------------------------------------------------- */
bot.onText(/\/login/, async (msg) => {
  const chatId = msg.chat.id.toString();

  // Already logged in?
  const existing = await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } });
  if (existing) return bot.sendMessage(chatId, 'You are already logged in.');

  loginStates.set(chatId, { state: LOGIN_STATES.WAITING_USERNAME });
  bot.sendMessage(chatId, 'Please enter your *username*:', { parse_mode: 'Markdown' });
});

/* --------------------------------------------------------------
   MESSAGE HANDLER (login flow)
   -------------------------------------------------------------- */
bot.on('message', async (msg) => {
  const chatId = msg.chat.id.toString();
  const text = msg.text?.trim();

  // Skip commands
  if (!text || text.startsWith('/')) return;

  const state = loginStates.get(chatId);
  if (!state) return; // not in login flow

  try {
    switch (state.state) {
      case LOGIN_STATES.WAITING_USERNAME: {
        console.log('Login attempt with username:', text);
        const admin = await BotAdmin.findOne({ username: text });
        console.log('Found admin:', admin ? 'yes' : 'no');
        if (!admin) {
          loginStates.delete(chatId);
          return bot.sendMessage(chatId, 'Invalid username. Use /login to try again.');
        }

        loginStates.set(chatId, {
          state: LOGIN_STATES.WAITING_PASSWORD,
          username: text,
          adminId: admin._id,
        });
        return bot.sendMessage(chatId, 'Please enter your *password*:', { parse_mode: 'Markdown' });
      }

      case LOGIN_STATES.WAITING_PASSWORD: {
        console.log('Password attempt for username:', state.username);
        console.log('Password length:', text.length, 'Password chars:', text.split('').map(c => c.charCodeAt(0)));
        const admin = await BotAdmin.findOne({ username: state.username });
        console.log('Found admin for password check:', admin ? 'yes' : 'no');
        if (admin) {
          console.log('Stored hash:', admin.password);
          console.log('Attempting to compare:', text, 'with stored hash');
        }
        const match = await bcrypt.compare(text, admin.password);
        console.log('Password match:', match ? 'yes' : 'no');
        if (!match) {
          loginStates.delete(chatId);
          return bot.sendMessage(chatId, 'Invalid password. Use /login to try again.');
        }

        // Create / refresh session (7 days)
        await BotSession.findOneAndUpdate(
          { chatId },
          {
            chatId,
            adminId: state.adminId,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          },
          { upsert: true, new: true }
        );

        loginStates.delete(chatId);
        return bot.sendMessage(
          chatId,
          `Logged in as *${state.username}*.\nYou will now receive client notifications.`,
          { parse_mode: 'Markdown' }
        );
      }
    }
  } catch (err) {
    console.error('Login error:', err);
    loginStates.delete(chatId);
    bot.sendMessage(chatId, 'Something went wrong. Use /login again.');
  }
});

/* --------------------------------------------------------------
   /logout
   -------------------------------------------------------------- */
bot.onText(/\/logout/, async (msg) => {
  const chatId = msg.chat.id.toString();
  const deleted = await BotSession.findOneAndDelete({ chatId });
  bot.sendMessage(chatId, deleted ? 'Logged out. No more notifications.' : 'You are not logged in.');
});

/* --------------------------------------------------------------
   /clients
   -------------------------------------------------------------- */
bot.onText(/\/clients/, async (msg) => {
  const chatId = msg.chat.id.toString();
  if (!(await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } }))) {
    return bot.sendMessage(chatId, 'Please /login first.');
  }

  const users = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email phone createdAt');

  if (!users.length) return bot.sendMessage(chatId, 'No users yet.');

  let txt = '<b>Recent Clients</b>\n\n';
  users.forEach((u) => {
    txt += `
Name: <b>${u.name}</b>
Email: <b>${u.email}</b>
Phone: <b>${u.phone || 'N/A'}</b>
Registered: <b>${new Date(u.createdAt).toLocaleString()}</b>
\n`;
  });
  bot.sendMessage(chatId, txt, { parse_mode: 'HTML' });
});

/* --------------------------------------------------------------
   /orders
   -------------------------------------------------------------- */
bot.onText(/\/orders/, async (msg) => {
  const chatId = msg.chat.id.toString();
  if (!(await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } }))) {
    return bot.sendMessage(chatId, 'Please /login first.');
  }

  const orders = await Order.find()
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  if (!orders.length) return bot.sendMessage(chatId, 'No orders yet.');

  let txt = '<b>Latest Orders</b>\n\n';
  orders.forEach((o) => {
    txt += `
Order #<code>${o._id}</code>
User: <b>${o.userId?.name || 'N/A'}</b> (${o.userId?.email || ''})
Total: <b>$${o.total.toFixed(2)}</b>
Status: <b>${o.status}</b>
Time: <b>${new Date(o.createdAt).toLocaleString()}</b>
------
`;
  });
  bot.sendMessage(chatId, txt, { parse_mode: 'HTML' });
});

/* --------------------------------------------------------------
   /stats
   -------------------------------------------------------------- */
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id.toString();
  if (!(await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } }))) {
    return bot.sendMessage(chatId, 'Please /login first.');
  }

  const [userCount, orderCount] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
  ]);

  const txt = `
<b>MedShop Admin Stats</b>

Users: <b>${userCount}</b>
Orders: <b>${orderCount}</b>
Time: <b>${new Date().toLocaleString()}</b>
`;
  bot.sendMessage(chatId, txt, { parse_mode: 'HTML' });
});

/* --------------------------------------------------------------
   /help
   -------------------------------------------------------------- */
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id.toString();
  const help = `
<b>MedShop Admin Bot</b>

<b>Commands</b>
/login – start login
/logout – stop notifications
/clients – last 5 users
/orders – last 5 orders
/stats – totals
/help – this message
`;
  bot.sendMessage(chatId, help, { parse_mode: 'HTML' });
});

/* --------------------------------------------------------------
   Bot command menu
   -------------------------------------------------------------- */
bot.setMyCommands([
  { command: '/login', description: 'Login to receive notifications' },
  { command: '/logout', description: 'Stop receiving notifications' },
  { command: '/clients', description: 'Show 5 latest users' },
  { command: '/orders', description: 'Show 5 latest orders' },
  { command: '/stats', description: 'Show totals' },
  { command: '/help', description: 'Show help' },
]);

module.exports = { sendNotification };