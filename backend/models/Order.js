const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // <-- allow guest checkout if needed
    },
    isGuest: {
      type: Boolean,
      default: false,
    },

    items: [
      {
        productId: {
          type: String,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        description: { type: String },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // price at purchase time (in UZS)
        size: { type: String }, // Optional: for IKPU mapping
        ikpuCode: { type: String }, // ИКПУ code (for Paycom fiscalization)
        package_code: { type: String }, // Package code (for Paycom fiscalization)
        vat_percent: { type: Number, default: 12 }, // VAT percent (for Paycom)
      },
    ],

    // Financial Details
    amount: { type: Number, required: true }, // total sum user pays (in UZS)
    currency: { type: String, default: "UZS" },

    // Payment Details
    paymentProvider: {
      type: String,
      enum: ["payme", "click", "uzum"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled", "failed", "refunded"],
      default: "pending",
    },

    // Paycom-specific
    providerTransactionId: { type: String }, // Payme transaction ID
    providerRawResponse: { type: Object }, // raw callback for debugging
    callbackVerified: { type: Boolean, default: false },

    // Metadata
    meta: {
      ip: String,
      userAgent: String,
      notes: String,
      paycomCreatedAt: Date, // When Payme created transaction
      paycomPerformedAt: Date, // When Payme performed transaction
      paycomCancelledAt: Date, // When Payme cancelled transaction
      cancellationReason: { type: String, default: null }
    },

    // Customer info
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
