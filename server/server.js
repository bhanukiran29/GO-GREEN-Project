const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5002;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/gogreen', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Models
const User = require('./models/User');
const Order = require('./models/Order');

// Routes

// 1. Signup
app.post('/api/auth/signup', async (req, res) => {
    console.log("Signup attempt:", req.body);
    try {
        let { name, email, phone, password } = req.body;
        email = email.trim();
        password = password.trim(); // Sanitize

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("Signup failed: User exists", email);
            return res.status(400).json({ message: "User already exists" });
        }

        const newUser = new User({ name, email, phone, password });
        await newUser.save();
        console.log("Signup success:", email);
        res.json({ message: "Account created successfully" });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
    console.log("Login attempt:", req.body);
    try {
        let { email, password } = req.body;
        email = email.trim();
        password = password.trim();

        const user = await User.findOne({ email, password });
        if (!user) {
            console.log("Login failed: Invalid credentials for", email);
            return res.status(400).json({ message: "Invalid credentials" });
        }

        console.log("Login success:", user._id);
        res.json({ message: "Login successful", user });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2.5 Update Profile
app.put('/api/auth/update', async (req, res) => {
    console.log("Update profile attempt:", req.body);
    try {
        const { _id, name, email, phone, password } = req.body;
        const updateData = { name, email, phone };
        if (password && password.trim() !== "") updateData.password = password.trim();

        const user = await User.findByIdAndUpdate(_id, updateData, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });

        console.log("Profile updated:", user._id);
        res.json({ message: "Profile updated successfully", user });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Place Order
app.post('/api/orders', async (req, res) => {
    console.log("Place order attempt:", req.body);
    try {
        const { userId, items, total } = req.body;
        if (!userId) return res.status(400).json({ message: "User ID required" });

        const newOrder = new Order({ userId, items, total });
        await newOrder.save();
        console.log("Order placed for user:", userId);
        res.json({ message: "Order placed successfully" });
    } catch (err) {
        console.error("Order error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 4. Get Orders
app.get('/api/orders/:userId', async (req, res) => {
    console.log("Get orders for user:", req.params.userId);
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ date: -1 });
        console.log(`Found ${orders.length} orders`);
        res.json(orders);
    } catch (err) {
        console.error("Get orders error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
