/**
 * Migration script to fix the Stock model index
 * This will drop old incorrect indexes and recreate the correct one
 * 
 * Run with: node backend/scripts/FixStockIndex.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Stock = require('../models/Stock');

const URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_care';

async function fixStockIndex() {
  try {
    console.log('📌 Connecting to MongoDB...');
    await mongoose.connect(URI);

    console.log('🔍 Checking existing indexes on Stock collection...');
    const indexes = await Stock.collection.getIndexes();
    console.log('Current indexes:', Object.keys(indexes));

    // Drop problematic indexes
    const indexesToDrop = [
      'productId_1',  // Single field unique index (WRONG)
      'productId_1_color_1_size_1',  // Old non-sparse compound index
    ];

    for (const indexName of indexesToDrop) {
      if (indexes[indexName]) {
        console.log(`⚠️  Dropping incorrect index: ${indexName}`);
        await Stock.collection.dropIndex(indexName);
        console.log(`✅ Index dropped: ${indexName}`);
      }
    }

    // Recreate with correct sparse compound index
    console.log('✨ Creating new sparse compound index...');
    await Stock.collection.createIndex(
      { productId: 1, color: 1, size: 1 },
      { unique: true, sparse: true }
    );

    console.log('✅ New sparse compound index created successfully!');
    console.log('📋 Updated indexes:');
    const newIndexes = await Stock.collection.getIndexes();
    console.log(JSON.stringify(newIndexes, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixStockIndex();
