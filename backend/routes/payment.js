// routes/payment.js
const express = require('express');
const router = express.Router();

const {
  createOrderAndInitPayment,
  paymeCallback,
  clickCallback,
} = require('../controllers/paymentController');

const authMiddleware = require('../middleware/auth');

// frontend calls this to start payment (user must be logged in)
router.post('/create', authMiddleware, createOrderAndInitPayment);

// Payme will call this URL (configure in Payme cabinet later)
router.post('/payme/callback', paymeCallback);

// Click will call this URL (configure in Click merchant cabinet later)
router.post('/click/callback', clickCallback);

module.exports = router;
