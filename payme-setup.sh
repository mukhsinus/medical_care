#!/usr/bin/env bash

# 🚀 PAYME Integration - Quick Setup Script
# 
# Usage: bash payme-setup.sh
# This script shows you what to do next

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║  🎉 PAYME INTEGRATION - QUICK SETUP                  ║"
echo "║                                                       ║"
echo "║  Ваша система Payme полностью готова!               ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

echo "📋 ДАЛЬНЕЙШИЕ ДЕЙСТВИЯ:"
echo ""

echo "1️⃣  ПОЛУЧИТЬ ИКПУ КОД (Merchant ID)"
echo "   Перейти на: https://merchant.paycom.uz"
echo "   Найти: ваш Merchant ID (16 цифр)"
echo "   Пример: 507144111111111"
echo ""

echo "2️⃣  ОБНОВИТЬ .env файл"
echo "   Открыть: .env"
echo "   Добавить:"
echo "   PAYME_MERCHANT_ID=ваш_16_значный_код"
echo "   PAYME_KEY=ваш_api_key"
echo "   PAYME_TEST_MODE=false"
echo ""

echo "3️⃣  УСТАНОВИТЬ CALLBACK URL"
echo "   В Payme cabinet установить:"
echo "   https://your-domain.com/api/payments/payme/callback"
echo ""

echo "4️⃣  ПРОТЕСТИРОВАТЬ"
echo "   Команда:"
echo "   npm run dev"
echo "   node test-payme.js"
echo ""

echo "5️⃣  ИНТЕГРИРОВАТЬ FRONTEND"
echo "   Читать: FRONTEND_PAYME_INTEGRATION.md"
echo "   Использовать: src/examples/PaymentIntegrationExample.tsx"
echo ""

echo "📚 ДОКУМЕНТАЦИЯ:"
echo ""
echo "   🚀 Начните с: START_HERE.md"
echo "   📖 Полная инструкция: PAYME_QUICK_START.md"
echo "   💻 Для фронтенда: FRONTEND_PAYME_INTEGRATION.md"
echo "   🗺️  Выбрать путь: DOCUMENTATION_ROADMAP.md"
echo ""

echo "🧪 ТЕСТИРОВАНИЕ:"
echo ""
echo "   node test-payme.js"
echo ""
echo "   Тестовые карты:"
echo "   Visa: 4111 1111 1111 1111"
echo "   MasterCard: 5105 1051 0510 5100"
echo "   Month: 12 Year: 25 CVV: 000"
echo ""

echo "✅ КОГДА ГОТОВО:"
echo ""
echo "   1. PAYME_TEST_MODE=false"
echo "   2. Реальный ИКПУ код"
echo "   3. Реальный API Key"
echo "   4. HTTPS + SSL"
echo "   5. npm run build && deploy"
echo ""

echo "📞 ПОМОЩЬ:"
echo ""
echo "   Payme Support: merchant@paycom.uz"
echo "   Docs: https://paycom.uz/ru/developers/"
echo "   Cabinet: https://merchant.paycom.uz"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "✨ Готово! Начните с файла START_HERE.md"
echo "═══════════════════════════════════════════════════════"
