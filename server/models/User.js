const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    name: String,
    phone: String,
    address: String,
    city: String,
    pincode: String,
    isDefault: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    phone: String,
    password: { type: String, required: true },
    selectedLocation: { type: String, default: 'Select Location' },
    addresses: [AddressSchema],
    sessionToken: String,
    checkoutSession: {
        items: Array,
        createdAt: Date
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
