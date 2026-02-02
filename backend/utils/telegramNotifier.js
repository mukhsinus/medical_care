const bcrypt = require('bcryptjs');
const BotAdmin = require('../models/BotAdmin');
const BotSession = require('../models/BotSession');
const User = require('../models/User');
const Order = require('../models/Order');
const BotChannel = require('../models/BotChannel');

// Runtime bot instance will be injected from bot.js
let botInstance = null;

const bcrypt = require('bcryptjs');
const BotAdmin = require('../models/BotAdmin');
const BotSession = require('../models/BotSession');
const User = require('../models/User');
const Order = require('../models/Order');
const BotChannel = require('../models/BotChannel');

// Runtime bot instance will be injected from bot.js
let botInstance = null;

// login state map used by bot message handlers
const loginStates = new Map();

const LOGIN_STATES = {
  WAITING_USERNAME: 'WAITING_USERNAME',
  WAITING_PASSWORD: 'WAITING_PASSWORD',
};

const SUPPORTED_LANGS = ['en', 'ru', 'uz'];

const i18n = {
  en: {
    already_logged_in: 'You are already logged in.',
    enter_username: 'Please enter your *username*:',
    invalid_username: 'Invalid username. Use /login to try again.',
    enter_password: 'Please enter your *password*:',
    invalid_password: 'Invalid password. Use /login to try again.',
    logged_in: (username) => `Logged in as *${username}*.
You will now receive client notifications.`,
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
    logged_in: (username) => `Вы вошли как *${username}*.
Теперь будете получать уведомления.`,
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
    stats_title: '<b>MedShop статистика</b>',
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

async function sendNotification(message, options = {}) {
  if (!botInstance) {
    console.warn('Telegram bot not initialized — skipping notification.');
    return;
  }

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
      await botInstance.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        ...options,
      });
      console.log(`Sent to ${chatId}`);
    }
  } catch (err) {
    console.error('Telegram send error:', err.message);
  }
}

function setBot(b) {
  botInstance = b;
}

module.exports = {
  sendNotification,
  setBot,
  getLang,
  ensureSession,
  loginStates,
  LOGIN_STATES,
  SUPPORTED_LANGS,
  t: (lang, key, ...args) => {
    const value = i18n[lang]?.[key] ?? i18n.en[key];
    if (typeof value === 'function') return value(...args);
    return value || key;
  },
};

function setBot(b) {
  botInstance = b;
}

module.exports = {
  sendNotification,
  setBot,
  getLang,
  ensureSession,
  loginStates,
  LOGIN_STATES,
  SUPPORTED_LANGS,
  t: (lang, key, ...args) => {
    const value = i18n[lang]?.[key] ?? i18n.en[key];
    if (typeof value === 'function') return value(...args);
    return value || key;
  },
};