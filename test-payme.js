#!/usr/bin/env node

/**
 * Тестирование Payme интеграции
 * Использование: node test-payme.js [orderId] [amount]
 */

const https = require('http');
const BASE_URL = 'http://localhost:8090';
const API_KEY = '0300BF8B4D537FD49D1F1E13B5215E58'; // тестовый ключ

const ORDER_ID = process.argv[2] || '507f1f77bcf86cd799439011';
const AMOUNT = parseInt(process.argv[3] || '5000000', 10); // в тийинах

console.log('🧪 Тестирование Payme интеграции');
console.log('================================\n');
console.log(`Order ID: ${ORDER_ID}`);
console.log(`Amount: ${AMOUNT / 100} УЗС\n`);

// Генерируем Authorization header
const auth = Buffer.from(`:${API_KEY}`).toString('base64');

function sendRequest(method, params, requestId) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: requestId,
    });

    const options = {
      hostname: 'localhost',
      port: 8090,
      path: '/api/payments/payme/callback',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function test() {
  try {
    // 1️⃣ CheckPerformTransaction
    console.log('1️⃣ Отправляю CheckPerformTransaction...\n');
    const checkResult = await sendRequest(
      'CheckPerformTransaction',
      {
        account: { orderId: ORDER_ID },
        amount: AMOUNT,
      },
      1
    );
    console.log('Результат:', JSON.stringify(checkResult, null, 2));

    if (checkResult.error) {
      console.error('\n❌ Ошибка при проверке:', checkResult.error);
      console.log('\nВозможные причины:');
      console.log('- Заказ не найден в БД');
      console.log('- Неверная сумма');
      console.log('- Заказ уже оплачен');
      return;
    }

    console.log('\n✅ Проверка пройдена\n');

    // 2️⃣ PerformTransaction
    console.log('2️⃣ Отправляю PerformTransaction...\n');
    const transactionId = Date.now();
    const performResult = await sendRequest(
      'PerformTransaction',
      {
        account: { orderId: ORDER_ID },
        amount: AMOUNT,
        id: transactionId,
        time: Math.floor(Date.now() / 1000),
      },
      2
    );
    console.log('Результат:', JSON.stringify(performResult, null, 2));

    if (performResult.error) {
      console.error('\n❌ Ошибка при платеже:', performResult.error);
      return;
    }

    console.log('\n✅ Платеж выполнен\n');

    // 3️⃣ CancelTransaction (опционально)
    console.log('3️⃣ Отправляю CancelTransaction (отмена платежа)...\n');
    const cancelResult = await sendRequest(
      'CancelTransaction',
      {
        id: transactionId,
      },
      3
    );
    console.log('Результат:', JSON.stringify(cancelResult, null, 2));

    if (!cancelResult.error) {
      console.log('\n✅ Платеж отменен\n');
    }

    console.log('✅ Все тесты завершены!');
    console.log('\nПроверьте:');
    console.log('1. Логи сервера');
    console.log('2. БД - статус заказа должен быть "paid"');
    console.log('3. Telegram - должно быть уведомление');
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    console.error('\nПроверьте:');
    console.error('- Запущен ли backend на http://localhost:8090');
    console.error('- Существует ли заказ с ID:', ORDER_ID);
  }
}

test();
