const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    productId: String,
    name: String,
    price: Number,
    img: String,
    qty: { type: Number, default: 1 }
});

const CartSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    items: [CartItemSchema],
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', CartSchema);
