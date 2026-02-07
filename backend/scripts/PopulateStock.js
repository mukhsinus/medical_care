/**
 * Script to populate stock for all catalog items
 * Adds 100 units for each unique product (base variant without color/size)
 * 
 * Usage: node scripts/PopulateStock.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Stock = require('../models/Stock');

// Load catalog data
let allItems = [];
try {
  const catalogData = require('../data/paymeCatalog');
  allItems = catalogData.allItems || [];
  console.log(`✅ Loaded ${allItems.length} items from catalog`);
} catch (err) {
  console.error('❌ Failed to load catalog:', err.message);
  process.exit(1);
}

async function populateStock() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_care';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    // For each catalog item, create base stock entry
    for (const item of allItems) {
      try {
        // Check if base stock already exists
        const existing = await Stock.findOne({
          productId: item.id,
          color: null,
          size: null,
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create base stock entry with 100 units
        const stock = await Stock.create({
          productId: item.id,
          productName: item.nameKey || `Item ${item.id}`,
          quantity: 100,
          minStockLevel: 10,
          isAvailable: true,
          color: null,
          size: null,
          createdBy: null, // Script-created, no user
          notes: 'Initial population - 100 units per item',
        });

        created++;
        console.log(`✅ Created stock for: ${item.nameKey} (ID: ${item.id}) - 100 units`);
      } catch (err) {
        console.error(`❌ Error creating stock for item ${item.id}:`, err.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Created: ${created} stock entries`);
    console.log(`⏭️  Skipped: ${skipped} (already exist)`);
    console.log(`📦 Total catalog items: ${allItems.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Stock population complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

populateStock();
