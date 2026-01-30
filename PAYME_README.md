# 💳 Integrasi Payme (Sistem Pembayaran Uzbekistan)

## 🎯 Ringkasan Cepat

Anda telah mengintegrasikan **Payme** - sistem pembayaran Uzbekistan. Berikut yang perlu Anda ketahui:

### Apa itu ИКПУ Kode?

**ИКПУ** = **Merchant ID** = 16-digit unique identifier akun Anda di Payme

Contoh: `507144111111111`

---

## 📋 File Dokumentasi

| File | Deskripsi |
|------|-----------|
| [PAYME_INTEGRATION.md](./PAYME_INTEGRATION.md) | 📖 Dokumentasi lengkap |
| [PAYME_QUICK_START.md](./PAYME_QUICK_START.md) | 🚀 Panduan cepat 5 menit |
| [PAYME_CHECKLIST.md](./PAYME_CHECKLIST.md) | ✅ Checklist setup |
| [PAYME_IKPU_USAGE.md](./PAYME_IKPU_USAGE.md) | 💾 Cara menggunakan ИКПУ kode |

---

## ⚡ Setup dalam 3 Langkah

### 1️⃣ Dapatkan ИКПУ Kode

```
Pergi ke: https://merchant.paycom.uz
Daftar/Login
Lihat: Merchant ID (ИКПУ Code) - 16 digit
```

### 2️⃣ Atur File `.env`

```env
PAYME_MERCHANT_ID=anda_16_digit_kod
PAYME_KEY=anda_api_key
PAYME_TEST_MODE=false
```

### 3️⃣ Atur Callback URL di Payme Cabinet

```
https://your-domain.com/api/payments/payme/callback
```

**Selesai!** 🎉

---

## 🔄 Alur Pembayaran

```
User memilih Payme
    ↓
Backend buat order (pending)
    ↓
Frontend redirect ke Payme gateway
    ↓
User input card di Payme
    ↓
Payme kirim callback CheckPerformTransaction
    ↓
Backend verifikasi order
    ↓
Payme kirim callback PerformTransaction
    ↓
Backend update order (paid)
    ↓
Telegram notification kirim ke admin
    ↓
Transaksi selesai ✅
```

---

## 📁 File Konfigurasi

### `.env` - Variables

```env
# ИКПУ Code dari Payme
PAYME_MERCHANT_ID=507144111111111

# API Key dari Payme
PAYME_KEY=0300BF8B4D537FD49D1F1E13B5215E58

# Mode test atau production
PAYME_TEST_MODE=false
```

### Backend Routes

[backend/routes/payment.js](../backend/routes/payment.js)
```javascript
router.post('/payme/callback', paymeCallback);
```

### Backend Controller

[backend/controllers/paymentController.js](../backend/controllers/paymentController.js)
- `createOrderAndInitPayment()` - buat order
- `paymeCallback()` - terima callback dari Payme

---

## 🧪 Testing

### Method 1: Node.js Script

```bash
node test-payme.js
```

### Method 2: Manual dengan curl

```bash
curl -X POST http://localhost:8090/api/payments/payme/callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic Y...=" \
  -d '{"jsonrpc":"2.0","method":"CheckPerformTransaction",...}'
```

### Kartu Test

| Type | Nomor |
|------|-------|
| Visa | 4111 1111 1111 1111 |
| MasterCard | 5105 1051 0510 5100 |
| Bulan | 12 |
| Tahun | 25 |
| CVV | 000 |

---

## 🚨 Troubleshooting

| Error | Solusi |
|-------|--------|
| `Authorization failed` | Periksa PAYME_KEY di .env |
| `Order not found` | Pastikan order ada di database |
| `Amount mismatch` | Backend otomatis convert (x100) |
| `Callback tidak datang` | Atur URL callback di Payme cabinet |

---

## 📞 Support Payme

- 📧 merchant@paycom.uz
- 📱 +998 71 200-0-200
- 🌐 https://paycom.uz/ru/developers/

---

## ✅ Pre-Production Checklist

Sebelum go live:

- [ ] ИКПУ kode diinput di .env
- [ ] API Key real diinput
- [ ] PAYME_TEST_MODE = false
- [ ] Callback URL tersetting di Payme
- [ ] SSL/HTTPS aktif
- [ ] Lakukan test payment real
- [ ] Verifikasi order di database
- [ ] Cek Telegram notification

---

## 📚 Dokumentasi Lengkap

Start dengan:
1. [PAYME_QUICK_START.md](./PAYME_QUICK_START.md) - 5 menit
2. [PAYME_CHECKLIST.md](./PAYME_CHECKLIST.md) - Langkah by langkah
3. [PAYME_INTEGRATION.md](./PAYME_INTEGRATION.md) - Detail teknis
4. [PAYME_IKPU_USAGE.md](./PAYME_IKPU_USAGE.md) - Implementasi

---

## 🎓 Istilah Penting

| Istilah | Arti |
|---------|------|
| **ИКПУ** | Kode merchant (16 digit) |
| **API Key** | Kunci untuk autentikasi |
| **Callback** | Request dari Payme ke server Anda |
| **Tiyins** | Unit terkecil (1 UZS = 100 tiyins) |
| **Merchant ID** | Sama dengan ИКПУ |

---

## 🎉 Selesai!

Integrasi Payme Anda siap digunakan!

Pertanyaan? Lihat dokumentasi lengkap atau hubungi Payme support.

**Happy payments! 💳**
