// telegramBot.js
const TelegramBot = require('node-telegram-bot-api');
const bcrypt = require('bcryptjs');
const BotAdmin = require('../models/BotAdmin');
const BotSession = require('../models/BotSession');
const User = require('../models/User');
const Order = require('../models/Order');
const BotChannel = require('../models/BotChannel');

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

// Supported languages and translations
const SUPPORTED_LANGS = ['en', 'ru', 'uz'];

const i18n = {
  en: {
    already_logged_in: 'You are already logged in.',
    enter_username: 'Please enter your *username*:',
    invalid_username: 'Invalid username. Use /login to try again.',
    enter_password: 'Please enter your *password*:',
    invalid_password: 'Invalid password. Use /login to try again.',
    logged_in: (username) => `Logged in as *${username}*.\nYou will now receive client notifications.`,
    login_error: 'Something went wrong. Use /login again.',
    logout_ok: 'Logged out. No more notifications.',
    logout_not_logged: 'You are not logged in.',
    login_required: 'Please /login first.',
    no_users: 'No users yet.',
    recent_clients_title: '<b>Recent Clients</b>',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    registered: 'Registered',
    no_orders: 'No orders yet.',
    latest_orders_title: '<b>Latest Orders</b>',
    order: 'Order',
    user: 'User',
    total: 'Total',
    status: 'Status',
    time: 'Time',
    stats_title: '<b>MedShop Admin Stats</b>',
    users_count: 'Users',
    orders_count: 'Orders',
    setgroup_place: 'Use /setgroup *inside the group* where you want to receive order notifications.',
    setgroup_ok: '✅ This group is now subscribed to order notifications.',
    setgroup_fail: '❌ Could not subscribe this group. Try again later.',
    unsetgroup_place: 'Use /unsetgroup *inside the group* you want to unsubscribe.',
    unsetgroup_ok: '✅ This group will no longer receive order notifications.',
    unsetgroup_not: 'This group was not subscribed.',
    help: `<b>MedShop Admin Bot</b>\n\n<b>Commands</b>\n/login – start login\n/logout – stop notifications\n/clients – last 5 users\n/orders – last 5 orders\n/stats – totals\n/setgroup – subscribe group\n/unsetgroup – unsubscribe group\n/help – this message`,
    lang_prompt: 'Send /lang en, /lang ru or /lang uz to change bot language.',
    lang_set: (lang) => `Language set to ${lang.toUpperCase()}.`,
    lang_invalid: 'Unsupported language. Use en, ru, or uz.',
  },
  ru: {
    already_logged_in: 'Вы уже вошли.',
    enter_username: 'Введите *логин*:',
    invalid_username: 'Неверный логин. Используйте /login чтобы попробовать снова.',
    enter_password: 'Введите *пароль*:',
    invalid_password: 'Неверный пароль. Используйте /login чтобы попробовать снова.',
    logged_in: (username) => `Вы вошли как *${username}*.\nТеперь будете получать уведомления.`,
    login_error: 'Ошибка. Попробуйте /login ещё раз.',
    logout_ok: 'Вы вышли. Уведомления отключены.',
    logout_not_logged: 'Вы не вошли.',
    login_required: 'Пожалуйста, сначала выполните /login.',
    no_users: 'Пока нет пользователей.',
    recent_clients_title: '<b>Последние клиенты</b>',
    name: 'Имя',
    email: 'Почта',
    phone: 'Телефон',
    registered: 'Регистрация',
    no_orders: 'Заказов пока нет.',
    latest_orders_title: '<b>Последние заказы</b>',
    order: 'Заказ',
    user: 'Клиент',
    total: 'Сумма',
    status: 'Статус',
    time: 'Время',
    stats_title: '<b>Статистика MedShop</b>',
    users_count: 'Пользователи',
    orders_count: 'Заказы',
    setgroup_place: 'Используйте /setgroup *внутри группы*, где нужны уведомления.',
    setgroup_ok: '✅ Группа подписана на уведомления.',
    setgroup_fail: '❌ Не удалось подписать группу. Попробуйте позже.',
    unsetgroup_place: 'Используйте /unsetgroup *внутри группы*, которую нужно отписать.',
    unsetgroup_ok: '✅ Группа отписана от уведомлений.',
    unsetgroup_not: 'Эта группа не была подписана.',
    help: `<b>MedShop Admin Bot</b>\n\n<b>Команды</b>\n/login – войти\n/logout – выйти\n/clients – последние 5 пользователей\n/orders – последние 5 заказов\n/stats – итоги\n/setgroup – подписать группу\n/unsetgroup – отписать группу\n/help – помощь`,
    lang_prompt: 'Отправьте /lang en, /lang ru или /lang uz чтобы сменить язык.',
    lang_set: (lang) => `Язык сменён на ${lang.toUpperCase()}.`,
    lang_invalid: 'Неподдерживаемый язык. Доступны en, ru, uz.',
  },
  uz: {
    already_logged_in: 'Siz allaqachon tizimga kirdingiz.',
    enter_username: '*Login* kiriting:',
    invalid_username: 'Login noto\'g\'ri. /login buyrug\'i bilan yana urinib ko\'ring.',
    enter_password: '*Parol* kiriting:',
    invalid_password: 'Parol noto\'g\'ri. /login buyrug\'i bilan yana urinib ko\'ring.',
    logged_in: (username) => `*${username}* sifatida tizimga kirdingiz.\nEndi bildirishnomalarni olasiz.`,
    login_error: 'Xatolik yuz berdi. /login buyrug\'i bilan qayta urinib ko\'ring.',
    logout_ok: 'Chiqdingiz. Bildirishnomalar o\'chirildi.',
    logout_not_logged: 'Siz tizimga kirmagansiz.',
    login_required: 'Iltimos, avval /login buyrug\'ini bajaring.',
    no_users: 'Hozircha foydalanuvchilar yo\'q.',
    recent_clients_title: '<b>So\'nggi mijozlar</b>',
    name: 'Ism',
    email: 'Email',
    phone: 'Telefon',
    registered: 'Ro\'yxatdan o\'tgan',
    no_orders: 'Hozircha buyurtmalar yo\'q.',
    latest_orders_title: '<b>So\'nggi buyurtmalar</b>',
    order: 'Buyurtma',
    user: 'Mijoz',
    total: 'Summasi',
    status: 'Holati',
    time: 'Vaqt',
    stats_title: '<b>MedShop statistikasi</b>',
    users_count: 'Foydalanuvchilar',
    orders_count: 'Buyurtmalar',
    setgroup_place: '/setgroup buyrug\'ini *guruh ichida* yuboring.',
    setgroup_ok: '✅ Guruhga bildirishnomalar ulashdi.',
    setgroup_fail: '❌ Guruhni ulab bo\'lmadi. Keyinroq urinib ko\'ring.',
    unsetgroup_place: '/unsetgroup buyrug\'ini *guruh ichida* yuboring.',
    unsetgroup_ok: '✅ Guruh bildirishnomalardan uzildi.',
    unsetgroup_not: 'Bu guruh oldin ulanmadi.',
    help: `<b>MedShop Admin Bot</b>\n\n<b>Buyruqlar</b>\n/login – kirish\n/logout – chiqish\n/clients – oxirgi 5 foydalanuvchi\n/orders – oxirgi 5 buyurtma\n/stats – umumiy statistika\n/setgroup – guruhni ulash\n/unsetgroup – guruhni uzish\n/help – yordam`,
    lang_prompt: '/lang en, /lang ru yoki /lang uz buyrug\'i bilan tilni o\'zgartiring.',
    lang_set: (lang) => `Til ${lang.toUpperCase()} ga o\'zgartirildi.`,
    lang_invalid: 'Til qo\'llab-quvvatlanmaydi. en, ru yoki uz tanlang.',
  },
};

const t = (lang, key, ...args) => {
  const value = i18n[lang]?.[key] ?? i18n.en[key];
  if (typeof value === 'function') return value(...args);
  return value || key;
};

async function getLang(chatId) {
  const ls = loginStates.get(chatId);
  if (ls?.lang && SUPPORTED_LANGS.includes(ls.lang)) return ls.lang;
  const session = await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } });
  return session?.lang || 'en';
}

async function ensureSession(chatId, adminId, langHint) {
  const existing = await BotSession.findOne({ chatId });
  const lang = langHint || existing?.lang || 'en';
  return BotSession.findOneAndUpdate(
    { chatId },
    {
      chatId,
      adminId,
      lang,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    { upsert: true, new: true }
  );
}

/* --------------------------------------------------------------
   NOTIFICATION (public function)
   -------------------------------------------------------------- */
/* --------------------------------------------------------------
   NOTIFICATION (public function)
   -------------------------------------------------------------- */
async function sendNotification(message, options = {}) {
  try {
    const now = Date.now();

    const [sessions, channels] = await Promise.all([
      BotSession.find({ expiresAt: { $gt: now } }),
      BotChannel.find(),
    ]);

    // unique chat IDs (private admins + groups)
    const targetIds = new Set([
      ...sessions.map((s) => s.chatId),
      ...channels.map((c) => c.chatId),
    ]);

    if (!targetIds.size) {
      console.log('No active admin sessions or subscribed groups.');
      return;
    }

    for (const chatId of targetIds) {
      await bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        ...options,
      });
      console.log(`Sent to ${chatId}`);
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
  const lang = await getLang(chatId);

  // Already logged in?
  const existing = await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } });
  if (existing) return bot.sendMessage(chatId, t(lang, 'already_logged_in'));

  loginStates.set(chatId, { state: LOGIN_STATES.WAITING_USERNAME, lang });
  bot.sendMessage(chatId, t(lang, 'enter_username'), { parse_mode: 'Markdown' });
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
        const lang = await getLang(chatId);
        console.log('Login attempt with username:', text);
        const admin = await BotAdmin.findOne({ username: text });
        console.log('Found admin:', admin ? 'yes' : 'no');
        if (!admin) {
          loginStates.delete(chatId);
          return bot.sendMessage(chatId, t(lang, 'invalid_username'));
        }

        loginStates.set(chatId, {
          state: LOGIN_STATES.WAITING_PASSWORD,
          username: text,
          adminId: admin._id,
          lang,
        });
        return bot.sendMessage(chatId, t(lang, 'enter_password'), { parse_mode: 'Markdown' });
      }

      case LOGIN_STATES.WAITING_PASSWORD: {
        const lang = await getLang(chatId);
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
          return bot.sendMessage(chatId, t(lang, 'invalid_password'));
        }

        // Create / refresh session (7 days)
        await ensureSession(chatId, state.adminId, lang);

        loginStates.delete(chatId);
        return bot.sendMessage(
          chatId,
          t(lang, 'logged_in', state.username),
          { parse_mode: 'Markdown' }
        );
      }
    }
  } catch (err) {
    console.error('Login error:', err);
    loginStates.delete(chatId);
    const lang = await getLang(chatId);
    bot.sendMessage(chatId, t(lang, 'login_error'));
  }
});

/* --------------------------------------------------------------
   /logout
   -------------------------------------------------------------- */
bot.onText(/\/logout/, async (msg) => {
  const chatId = msg.chat.id.toString();
  const lang = await getLang(chatId);
  const deleted = await BotSession.findOneAndDelete({ chatId });
  bot.sendMessage(chatId, deleted ? t(lang, 'logout_ok') : t(lang, 'logout_not_logged'));
});

/* --------------------------------------------------------------
   /lang <code>
   -------------------------------------------------------------- */
bot.onText(/^\/lang\s*(\w+)?/, async (msg, match) => {
  const chatId = msg.chat.id.toString();
  const requested = (match?.[1] || '').toLowerCase();
  if (!requested) {
    const lang = await getLang(chatId);
    return bot.sendMessage(chatId, t(lang, 'lang_prompt'));
  }

  if (!SUPPORTED_LANGS.includes(requested)) {
    const lang = await getLang(chatId);
    return bot.sendMessage(chatId, t(lang, 'lang_invalid'));
  }

  const session = await BotSession.findOneAndUpdate(
    { chatId },
    { lang: requested },
    { new: true }
  );

  // If no session exists (not logged in), store preference temporarily
  if (!session) {
    loginStates.set(chatId, { state: LOGIN_STATES.WAITING_USERNAME, lang: requested });
  }

  const lang = await getLang(chatId);
  return bot.sendMessage(chatId, t(lang, 'lang_set', requested));
});

/* --------------------------------------------------------------
   /clients
   -------------------------------------------------------------- */
bot.onText(/\/clients/, async (msg) => {
  const chatId = msg.chat.id.toString();
  const lang = await getLang(chatId);
  if (!(await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } }))) {
    return bot.sendMessage(chatId, t(lang, 'login_required'));
  }

  const users = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email phone createdAt');

  if (!users.length) return bot.sendMessage(chatId, t(lang, 'no_users'));

  let txt = `${t(lang, 'recent_clients_title')}\n\n`;
  users.forEach((u) => {
    txt += `
${t(lang, 'name')}: <b>${u.name}</b>
${t(lang, 'email')}: <b>${u.email}</b>
${t(lang, 'phone')}: <b>${u.phone || 'N/A'}</b>
${t(lang, 'registered')}: <b>${new Date(u.createdAt).toLocaleString()}</b>
\n`;
  });
  bot.sendMessage(chatId, txt, { parse_mode: 'HTML' });
});

/* --------------------------------------------------------------
   /orders
   -------------------------------------------------------------- */
bot.onText(/\/orders/, async (msg) => {
  const chatId = msg.chat.id.toString();
  const lang = await getLang(chatId);
  if (!(await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } }))) {
    return bot.sendMessage(chatId, t(lang, 'login_required'));
  }

  const orders = await Order.find()
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  if (!orders.length) return bot.sendMessage(chatId, t(lang, 'no_orders'));

  let txt = `${t(lang, 'latest_orders_title')}\n\n`;
  orders.forEach((o) => {
    txt += `
${t(lang, 'order')} #<code>${o._id}</code>
${t(lang, 'user')}: <b>${o.userId?.name || 'N/A'}</b> (${o.userId?.email || ''})
${t(lang, 'total')}: <b>$${o.total.toFixed(2)}</b>
${t(lang, 'status')}: <b>${o.status}</b>
${t(lang, 'time')}: <b>${new Date(o.createdAt).toLocaleString()}</b>
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
  const lang = await getLang(chatId);
  if (!(await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } }))) {
    return bot.sendMessage(chatId, t(lang, 'login_required'));
  }

  const [userCount, orderCount] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
  ]);

  const txt = `
${t(lang, 'stats_title')}

${t(lang, 'users_count')}: <b>${userCount}</b>
${t(lang, 'orders_count')}: <b>${orderCount}</b>
${t(lang, 'time')}: <b>${new Date().toLocaleString()}</b>
`;
  bot.sendMessage(chatId, txt, { parse_mode: 'HTML' });
});

/* --------------------------------------------------------------
   /setgroup  — subscribe a group for notifications
   -------------------------------------------------------------- */
bot.onText(/\/setgroup/, async (msg) => {
  const chatId = msg.chat.id.toString();
  const chatType = msg.chat.type;
  const lang = await getLang(chatId);

  // This must be run INSIDE the group
  if (chatType !== 'group' && chatType !== 'supergroup') {
    return bot.sendMessage(
      chatId,
      t(lang, 'setgroup_place'),
      { parse_mode: 'Markdown' }
    );
  }

  try {
    await BotChannel.findOneAndUpdate(
      { chatId },
      {
        chatId,
        type: chatType,
        title: msg.chat.title || '',
      },
      { upsert: true, new: true }
    );

    bot.sendMessage(
      chatId,
      t(lang, 'setgroup_ok'),
    );
    console.log('Group subscribed for notifications:', chatId, msg.chat.title);
  } catch (err) {
    console.error('Error saving group subscription:', err);
    bot.sendMessage(chatId, t(lang, 'setgroup_fail'));
  }
});
/* --------------------------------------------------------------
   /unsetgroup — unsubscribe group from notifications
   -------------------------------------------------------------- */
bot.onText(/\/unsetgroup/, async (msg) => {
  const chatId = msg.chat.id.toString();
  const chatType = msg.chat.type;
  const lang = await getLang(chatId);

  if (chatType !== 'group' && chatType !== 'supergroup') {
    return bot.sendMessage(
      chatId,
      t(lang, 'unsetgroup_place'),
      { parse_mode: 'Markdown' }
    );
  }

  const deleted = await BotChannel.findOneAndDelete({ chatId });
  bot.sendMessage(
    chatId,
    deleted
      ? t(lang, 'unsetgroup_ok')
      : t(lang, 'unsetgroup_not')
  );
});


/* --------------------------------------------------------------
   /help
   -------------------------------------------------------------- */
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id.toString();
  getLang(chatId).then((lang) => {
    bot.sendMessage(chatId, t(lang, 'help'), { parse_mode: 'HTML' });
  });
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
  { command: '/setgroup', description: 'Subscribe this group to notifications' }, 
  { command: '/unsetgroup', description: 'Unsubscribe this group from notifications' },
   { command: '/lang', description: 'Change bot language (en/ru/uz)' },
  { command: '/help', description: 'Show help' },
]);

module.exports = { sendNotification };