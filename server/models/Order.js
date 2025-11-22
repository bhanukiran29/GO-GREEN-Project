const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: String,
    items: Array,
    total: Number,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
