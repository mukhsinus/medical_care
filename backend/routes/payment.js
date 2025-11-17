const express = require('express');
const router = express.Router();
const {
  createOrderAndInitPayment,
  paymeCallback,
  clickCallback,
} = require('../controllers/paymentController');

// frontend calls this to start payment
router.post('/create', createOrderAndInitPayment);

// Payme will call this URL (configure in Payme cabinet later)
router.post('/payme/callback', paymeCallback);

// Click will call this URL (configure in Click merchant cabinet later)
router.post('/click/callback', clickCallback);

module.exports = router;
