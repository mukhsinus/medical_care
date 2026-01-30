#!/bin/bash

# Скрипт для тестирования Payme интеграции
# Используйте этот скрипт для проверки callbacks

BASE_URL="http://localhost:8090"
API_KEY="0300BF8B4D537FD49D1F1E13B5215E58"  # тестовый ключ
ORDER_ID="507f1f77bcf86cd799439011"
AMOUNT=5000000  # 50000 УЗС в тийинах

echo "🧪 Тестирование Payme интеграции"
echo "================================\n"

# Конвертируем API ключ в Base64 для Authorization header
AUTH_HEADER=$(echo -n ":${API_KEY}" | base64)

# 1️⃣ CheckPerformTransaction
echo "1️⃣ Отправляю CheckPerformTransaction..."
curl -X POST "${BASE_URL}/api/payments/payme/callback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic ${AUTH_HEADER}" \
  -d '{
    "jsonrpc": "2.0",
    "method": "CheckPerformTransaction",
    "params": {
      "account": {
        "orderId": "'${ORDER_ID}'"
      },
      "amount": '${AMOUNT}'
    },
    "id": 1
  }' | jq .

echo "\n"

# 2️⃣ PerformTransaction
echo "2️⃣ Отправляю PerformTransaction..."
TRANSACTION_ID=$(date +%s)
curl -X POST "${BASE_URL}/api/payments/payme/callback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic ${AUTH_HEADER}" \
  -d '{
    "jsonrpc": "2.0",
    "method": "PerformTransaction",
    "params": {
      "account": {
        "orderId": "'${ORDER_ID}'"
      },
      "amount": '${AMOUNT}',
      "id": '${TRANSACTION_ID}',
      "time": '$(date +%s)'
    },
    "id": 2
  }' | jq .

echo "\n"

# 3️⃣ CancelTransaction (опционально)
echo "3️⃣ Отправляю CancelTransaction..."
curl -X POST "${BASE_URL}/api/payments/payme/callback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic ${AUTH_HEADER}" \
  -d '{
    "jsonrpc": "2.0",
    "method": "CancelTransaction",
    "params": {
      "id": '${TRANSACTION_ID}'
    },
    "id": 3
  }' | jq .

echo "\n✅ Тест завершен!"
echo "Проверьте логи сервера для деталей"
