// routes/mock.js - Mock payment gateway pages for testing
const express = require('express');
const router = express.Router();
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8090';

// Mock Payme gateway page
router.get('/payme-gateway', (req, res) => {
  const { orderId } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mock Payme Gateway</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
        button { padding: 10px 20px; margin: 10px 5px; cursor: pointer; font-size: 16px; }
        .success { background: #4CAF50; color: white; border: none; }
        .cancel { background: #f44336; color: white; border: none; }
      </style>
    </head>
    <body>
      <h1>Mock Payme Payment Gateway</h1>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>This is a test payment page. Click a button to simulate payment.</p>
      <button class="success" onclick="handlePayment('success')">✓ Pay Successfully</button>
      <button class="cancel" onclick="handlePayment('cancel')">✗ Cancel Payment</button>
      
      <script>
        async function handlePayment(action) {
          if (action === 'success') {
            try {
              await fetch('${BACKEND_URL}/api/payments/payme/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  order_id: '${orderId}',
                  transaction_id: 'PAYME_' + Date.now(),
                  status: 'success'
                })
              });
              alert('Payment successful!');
              window.location.href = '/';
            } catch (e) {
              alert('Error processing payment: ' + e.message);
            }
          } else {
            alert('Payment cancelled');
            window.location.href = '/';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Mock Click gateway page
router.get('/click-gateway', (req, res) => {
  const { orderId } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mock Click Gateway</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
        button { padding: 10px 20px; margin: 10px 5px; cursor: pointer; font-size: 16px; }
        .success { background: #4CAF50; color: white; border: none; }
        .cancel { background: #f44336; color: white; border: none; }
      </style>
    </head>
    <body>
      <h1>Mock Click Payment Gateway</h1>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>This is a test payment page. Click a button to simulate payment.</p>
      <button class="success" onclick="handlePayment('success')">✓ Pay Successfully</button>
      <button class="cancel" onclick="handlePayment('cancel')">✗ Cancel Payment</button>
      
      <script>
        async function handlePayment(action) {
          if (action === 'success') {
            try {
              // First prepare (action=0)
              await fetch('${BACKEND_URL}/api/payments/click/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  merchant_trans_id: '${orderId}',
                  click_trans_id: 'CLICK_' + Date.now(),
                  action: 0
                })
              });
              
              // Then complete (action=1)
              await fetch('${BACKEND_URL}/api/payments/click/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  merchant_trans_id: '${orderId}',
                  click_trans_id: 'CLICK_' + Date.now(),
                  action: 1
                })
              });
              
              alert('Payment successful!');
              window.location.href = '/';
            } catch (e) {
              alert('Error processing payment: ' + e.message);
            }
          } else {
            alert('Payment cancelled');
            window.location.href = '/';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Mock Uzum Bank gateway page
router.get('/uzum-gateway', (req, res) => {
  const { orderId } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mock Uzum Bank Gateway</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
        button { padding: 10px 20px; margin: 10px 5px; cursor: pointer; font-size: 16px; }
        .success { background: #7C3AED; color: white; border: none; }
        .cancel { background: #f44336; color: white; border: none; }
      </style>
    </head>
    <body>
      <h1>Mock Uzum Bank Payment Gateway</h1>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>This is a test payment page. Click a button to simulate payment.</p>
      <button class="success" onclick="handlePayment('success')">✓ Pay Successfully</button>
      <button class="cancel" onclick="handlePayment('cancel')">✗ Cancel Payment</button>
      
      <script>
        async function handlePayment(action) {
          if (action === 'success') {
            try {
              await fetch('${BACKEND_URL}/api/payments/uzum/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: '${orderId}',
                  transactionId: 'UZUM_' + Date.now(),
                  status: 'success'
                })
              });
              alert('Payment successful!');
              window.location.href = '/';
            } catch (e) {
              alert('Error processing payment: ' + e.message);
            }
          } else {
            alert('Payment cancelled');
            window.location.href = '/';
          }
        }
      </script>
    </body>
    </html>
  `);
});

module.exports = router;
