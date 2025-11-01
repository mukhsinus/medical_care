const TelegramBot = require('node-telegram-bot-api');
const bcrypt = require('bcryptjs');
const BotAdmin = require('../models/BotAdmin');
const BotSession = require('../models/BotSession');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.warn('⚠️ Telegram bot token missing—skipping notifications.');
  module.exports = { sendNotification: () => {} };
} else {
  const bot = new TelegramBot(token, { polling: true }); // Polling for commands

  // Send notifications to all authenticated chatIds
  async function sendNotification(message, options = {}) {
    try {
      const sessions = await BotSession.find({ expiresAt: { $gt: Date.now() } });
      if (sessions.length === 0) {
        console.log('No authenticated admins to notify.');
        return;
      }
      for (const session of sessions) {
        await bot.sendMessage(session.chatId, message, {
          parse_mode: 'HTML',
          ...options,
        });
        console.log(`✅ Sent to chatId ${session.chatId}`);
      }
    } catch (err) {
      console.error('❌ Telegram send error:', err.message);
    }
  }

  // Handle /login command
  bot.onText(/\/login (.+)/, async (msg, match) => {
    const chatId = msg.chat.id.toString();
    const args = match[1]?.split(' ') || [];
    const [username, password] = args;

    if (!username || !password) {
      return bot.sendMessage(chatId, 'Usage: /login <username> <password>');
    }

    try {
      const admin = await BotAdmin.findOne({ username });
      if (!admin) {
        return bot.sendMessage(chatId, 'Invalid username or password.');
      }

      const matched = await bcrypt.compare(password, admin.password);
      if (!matched) {
        return bot.sendMessage(chatId, 'Invalid username or password.');
      }

      // Save session
      await BotSession.findOneAndUpdate(
        { chatId },
        { chatId, adminId: admin._id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 },
        { upsert: true }
      );

      bot.sendMessage(chatId, `✅ Logged in as ${username}. You'll receive client notifications.`);
    } catch (err) {
      console.error('Telegram /login error:', err.message);
      bot.sendMessage(chatId, 'Error during login. Try again.');
    }
  });

  // Handle /logout command
  bot.onText(/\/logout/, async (msg) => {
    const chatId = msg.chat.id.toString();
    try {
      const session = await BotSession.findOneAndDelete({ chatId });
      if (session) {
        bot.sendMessage(chatId, '✅ Logged out. You will no longer receive notifications.');
      } else {
        bot.sendMessage(chatId, 'You are not logged in.');
      }
    } catch (err) {
      console.error('Telegram /logout error:', err.message);
      bot.sendMessage(chatId, 'Error during logout. Try again.');
    }
  });

  // Optional: /clients command to list recent users (limit to 5 for brevity)
  bot.onText(/\/clients/, async (msg) => {
    const chatId = msg.chat.id.toString();
    try {
      const session = await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } });
      if (!session) {
        return bot.sendMessage(chatId, 'Please log in first with /login <username> <password>');
      }

      const User = require('../models/User');
      const users = await User.find().sort({ createdAt: -1 }).limit(5).select('name email phone createdAt');
      
      let message = '<b>Recent Clients</b>\n\n';
      for (const user of users) {
        message += `
👤 <b>Name:</b> ${user.name}
📧 <b>Email:</b> ${user.email}
📱 <b>Phone:</b> ${user.phone || 'N/A'}
🕒 <b>Registered:</b> ${new Date(user.createdAt).toISOString()}
\n`;
      }
      bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('Telegram /clients error:', err.message);
      bot.sendMessage(chatId, 'Error fetching clients. Try again.');
    }
  });

bot.onText(/\/orders/, async (msg) => {
  const chatId = msg.chat.id.toString();
  const session = await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } });
  if (!session) return bot.sendMessage(chatId, 'Please /login first');

  try {
    const Order = require('../models/Order');
    const orders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    if (orders.length === 0) {
      return bot.sendMessage(chatId, 'No orders yet.');
    }

    let message = '<b>Latest Orders</b>\n\n';
    orders.forEach(o => {
      message += `
Order #<code>${o._id}</code>
User: ${o.userId?.name || 'N/A'} (${o.userId?.email || ''})
Total: $${o.total.toFixed(2)}
Status: <b>${o.status}</b>
Time: ${new Date(o.createdAt).toLocaleString()}
------
`;
    });
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (err) {
    bot.sendMessage(chatId, 'Error fetching orders.');
  }
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id.toString();
  const session = await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } });
  if (!session) return bot.sendMessage(chatId, 'Please /login first');

  try {
    const User = require('../models/User');
    const Order = require('../models/Order');
    const [userCount, orderCount] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments()
    ]);

    const message = `
<b>MedShop Admin Stats</b>

Users: <b>${userCount}</b>
Orders: <b>${orderCount}</b>
Time: ${new Date().toLocaleString()}
    `;
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (err) {
    bot.sendMessage(chatId, 'Error fetching stats.');
  }
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id.toString();
  const help = `
<b>MedShop Admin Bot</b>

Use /login <username> <password> to start
Available commands:
/clients – latest users
/orders – latest orders
/stats – total counts
/logout – stop notifications
/help – this message
  `;
  bot.sendMessage(chatId, help, { parse_mode: 'HTML' });
});

// Set bot commands
bot.setMyCommands([
  { command: '/login', description: 'Login to receive notifications' },
  { command: '/logout', description: 'Stop receiving notifications' },
  { command: '/clients', description: 'Show 5 latest registered users' },
  { command: '/orders', description: 'Show 5 latest orders' },
  { command: '/stats', description: 'Show total users & orders' },
  { command: '/help', description: 'Show this help' },
]);



  module.exports = { sendNotification };
}