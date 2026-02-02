#!/usr/bin/env node

/**
 * Generate a secure random string for JWT_SECRET
 * Run with: node backend/scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('hex');
console.log('\n🔐 Generated JWT_SECRET:\n');
console.log(secret);
console.log('\n📋 Add this to your Railway environment variables:\n');
console.log('JWT_SECRET=' + secret);
console.log('\n✅ Keep this secret safe!\n');
