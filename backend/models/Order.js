const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // <-- allow guest checkout if needed
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId, // <-- recommended if products are stored in DB
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // price at purchase time
      },
    ],

    // Financial Details
    amount: { type: Number, required: true }, // total sum user pays
    currency: { type: String, default: "UZS" },

    // Payment Details
    paymentProvider: {
      type: String,
      enum: ["payme", "click"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled", "failed", "refunded"],
      default: "pending",
    },

    providerTransactionId: { type: String }, // transaction code from provider
    providerRawResponse: { type: Object }, // useful for debugging
    callbackVerified: { type: Boolean, default: false },

    // System & Analytics
    meta: {
      ip: String,
      userAgent: String,
      notes: String,
    },

    // Delivery / Customer info (future-proof)
    customer: {
      fullName: String,
      phone: String,
      address: String,
    },

    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
