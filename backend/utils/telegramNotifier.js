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


const axios = require('axios');
const API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;


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
    setgroup_place: 'Use /setgroup inside the group.',
    setgroup_ok: '✅ Group subscribed.',
    setgroup_fail: '❌ Failed to subscribe group.',
    unsetgroup_place: 'Use /unsetgroup inside the group.',
    unsetgroup_ok: '✅ Group unsubscribed.',
    unsetgroup_not: 'Group was not subscribed.',
    help: `<b>MedShop Admin Bot</b>\n\n/login\n/logout\n/clients\n/orders\n/stats\n/setgroup\n/unsetgroup\n/lang\n/help`,
    lang_prompt: 'Send /lang en, ru or uz.',
    lang_set: (lang) => `Language set to ${lang.toUpperCase()}.`,
    lang_invalid: 'Unsupported language.',
  },
  ru: {
    already_logged_in: 'Вы уже вошли.',
    enter_username: 'Введите *логин*:',
    invalid_username: 'Неверный логин.',
    enter_password: 'Введите *пароль*:',
    invalid_password: 'Неверный пароль.',
    logged_in: (username) => `Вы вошли как *${username}*.`,
    login_error: 'Ошибка входа.',
    logout_ok: 'Вы вышли.',
    logout_not_logged: 'Вы не вошли.',
    login_required: 'Сначала /login.',
    no_users: 'Нет пользователей.',
    recent_clients_title: '<b>Последние клиенты</b>',
    name: 'Имя',
    email: 'Почта',
    phone: 'Телефон',
    registered: 'Регистрация',
    no_orders: 'Нет заказов.',
    latest_orders_title: '<b>Последние заказы</b>',
    order: 'Заказ',
    user: 'Клиент',
    total: 'Сумма',
    status: 'Статус',
    time: 'Время',
    stats_title: '<b>Статистика</b>',
    users_count: 'Пользователи',
    orders_count: 'Заказы',
    setgroup_place: 'Используйте /setgroup в группе.',
    setgroup_ok: 'Группа подписана.',
    setgroup_fail: 'Ошибка подписки.',
    unsetgroup_place: 'Используйте /unsetgroup в группе.',
    unsetgroup_ok: 'Группа отписана.',
    unsetgroup_not: 'Группа не была подписана.',
    help: `<b>MedShop Admin Bot</b>\n\n/login\n/logout\n/clients\n/orders\n/stats\n/setgroup\n/unsetgroup\n/lang\n/help`,
    lang_prompt: 'Используйте /lang en|ru|uz.',
    lang_set: (lang) => `Язык: ${lang.toUpperCase()}`,
    lang_invalid: 'Неподдерживаемый язык.',
  },
  uz: {
    already_logged_in: 'Siz allaqachon kirdingiz.',
    enter_username: 'Login kiriting:',
    invalid_username: 'Noto‘g‘ri login.',
    enter_password: 'Parol kiriting:',
    invalid_password: 'Noto‘g‘ri parol.',
    logged_in: (username) => `${username} sifatida kirdingiz.`,
    login_error: 'Xatolik.',
    logout_ok: 'Chiqdingiz.',
    logout_not_logged: 'Kirmagansiz.',
    login_required: 'Avval /login.',
    no_users: 'Foydalanuvchi yo‘q.',
    recent_clients_title: '<b>So‘nggi mijozlar</b>',
    name: 'Ism',
    email: 'Email',
    phone: 'Telefon',
    registered: 'Ro‘yxat',
    no_orders: 'Buyurtma yo‘q.',
    latest_orders_title: '<b>So‘nggi buyurtmalar</b>',
    order: 'Buyurtma',
    user: 'Mijoz',
    total: 'Summa',
    status: 'Holat',
    time: 'Vaqt',
    stats_title: '<b>Statistika</b>',
    users_count: 'Foydalanuvchilar',
    orders_count: 'Buyurtmalar',
    setgroup_place: '/setgroup guruh ichida.',
    setgroup_ok: 'Guruh ulandi.',
    setgroup_fail: 'Ulanmadi.',
    unsetgroup_place: '/unsetgroup guruh ichida.',
    unsetgroup_ok: 'Guruh uzildi.',
    unsetgroup_not: 'Guruh ulanmagan.',
    help: `<b>MedShop Admin Bot</b>\n\n/login\n/logout\n/clients\n/orders\n/stats\n/setgroup\n/unsetgroup\n/lang\n/help`,
    lang_prompt: '/lang en|ru|uz',
    lang_set: (lang) => `Til: ${lang.toUpperCase()}`,
    lang_invalid: 'Til noto‘g‘ri.',
  },
};

async function getLang(chatId) {
  const ls = loginStates.get(chatId);
  if (ls?.lang && SUPPORTED_LANGS.includes(ls.lang)) return ls.lang;
  const session = await BotSession.findOne({ chatId, expiresAt: { $gt: Date.now() } });
  return session?.lang || 'en';
}

async function ensureSession(chatId, adminId, langHint) {
  const lang = langHint || 'en';
  return BotSession.findOneAndUpdate(
    { chatId },
    { chatId, adminId, lang, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    { upsert: true, new: true }
  );
}

async function sendNotification(message, options = {}) {
  const now = Date.now();

  const [sessions, channels] = await Promise.all([
    BotSession.find({ expiresAt: { $gt: now } }),
    BotChannel.find(),
  ]);

  const targets = new Set([
    ...sessions.map(s => s.chatId),
    ...channels.map(c => c.chatId),
  ]);

  for (const chatId of targets) {
    await axios.post(`${API}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      ...options,
    });
  }
}



function t(lang, key, ...args) {
  const value = i18n[lang]?.[key] ?? i18n.en[key];
  return typeof value === 'function' ? value(...args) : value || key;
}
