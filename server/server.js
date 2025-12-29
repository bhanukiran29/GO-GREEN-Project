// mongodb+srv://srideviddcs25_db_user:Sridevi072006@goreencluster.nw6mq2s.mongodb.net/?retryWrites=true&w=majority&appName=GoreenCluster
//mongodb+srv://bhanukirancs24_db_user:BhanuKiran29@cluster01.1dk3rzc.mongodb.net/?appName=Cluster01
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the root directory (one level up from server folder)
app.use(express.static(path.join(__dirname, '../')));

// MongoDB Connection
mongoose.connect('mongodb+srv://bhanukirancs24_db_user:BhanuKiran29@cluster01.1dk3rzc.mongodb.net/?appName=Cluster01', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Models
const User = require('./models/User');
const Order = require('./models/Order');
const Cart = require('./models/Cart');

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

        // Generate session token
        const sessionToken = user._id + '_' + Date.now() + '_' + Math.random().toString(36);
        user.sessionToken = sessionToken;
        await user.save();

        console.log("Login success:", user._id);
        res.json({
            message: "Login successful",
            sessionToken,
            userId: user._id.toString(),
            userName: user.name,
            userEmail: user.email
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2.5 Update Profile
// Correct update route: /api/auth/update-profile/:id
app.put('/api/auth/update-profile/:id', async (req, res) => {
    console.log("Update profile:", req.params.id, req.body);

    try {
        const userId = req.params.id;
        const { name, email, phone, password } = req.body;

        const updateData = { name, email, phone };
        if (password && password.trim() !== "") {
            updateData.password = password.trim();
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select("-password -sessionToken");


        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (err) {
        console.error("Update-profile error:", err);
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

// 5. Get Cart
app.get('/api/cart/:userId', async (req, res) => {
    console.log("Get cart for user:", req.params.userId);
    try {
        let cart = await Cart.findOne({ userId: req.params.userId });
        if (!cart) {
            cart = { userId: req.params.userId, items: [] };
        }
        res.json(cart);
    } catch (err) {
        console.error("Get cart error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 6. Add to Cart
app.post('/api/cart/add', async (req, res) => {
    console.log("Add to cart:", req.body);
    try {
        const { userId, productId, name, price, img } = req.body;
        if (!userId) return res.status(400).json({ message: "User ID required" });

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const existingItem = cart.items.find(item => item.name === name);

        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.items.push({ productId, name, price, img, qty: 1 });
        }

        cart.updatedAt = Date.now();
        await cart.save();

        console.log("Cart updated for user:", userId);
        res.json({ message: "Item added to cart", cart });
    } catch (err) {
        console.error("Add to cart error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 7. Update Cart Item Quantity
app.put('/api/cart/update', async (req, res) => {
    console.log("Update cart item:", req.body);
    try {
        const { userId, productId, qty } = req.body;
        if (!userId) return res.status(400).json({ message: "User ID required" });

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const item = cart.items.find(i => i.productId === productId);
        if (!item) return res.status(404).json({ message: "Item not found in cart" });

        item.qty = Math.max(1, qty);
        cart.updatedAt = Date.now();
        await cart.save();

        res.json({ message: "Cart updated", cart });
    } catch (err) {
        console.error("Update cart error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 8. Remove from Cart
app.delete('/api/cart/remove', async (req, res) => {
    console.log("Remove from cart:", req.body);
    try {
        const { userId, productId } = req.body;
        if (!userId) return res.status(400).json({ message: "User ID required" });

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.items = cart.items.filter(i => i.productId !== productId);
        cart.updatedAt = Date.now();
        await cart.save();

        res.json({ message: "Item removed from cart", cart });
    } catch (err) {
        console.error("Remove from cart error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 9. Clear Cart (after checkout)
app.delete('/api/cart/clear/:userId', async (req, res) => {
    console.log("Clear cart for user:", req.params.userId);
    try {
        const cart = await Cart.findOne({ userId: req.params.userId });
        if (cart) {
            cart.items = [];
            cart.updatedAt = Date.now();
            await cart.save();
        }
        res.json({ message: "Cart cleared" });
    } catch (err) {
        console.error("Clear cart error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 10. Get User Data (for session validation)
app.get('/api/auth/user/:userId', async (req, res) => {
    console.log("Get user data:", req.params.userId);
    try {
        const user = await User.findById(req.params.userId).select('-password -sessionToken');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        console.error("Get user error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 11. Get User Addresses
app.get('/api/addresses/:userId', async (req, res) => {
    console.log("Get addresses for user:", req.params.userId);
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user.addresses || []);
    } catch (err) {
        console.error("Get addresses error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 12. Add Address
app.post('/api/addresses', async (req, res) => {
    console.log("Add address:", req.body);
    try {
        const { userId, address } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // If this is set as default, unset others
        if (address.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push(address);
        await user.save();
        console.log("Address added for user:", userId);
        res.json({ message: "Address added", addresses: user.addresses });
    } catch (err) {
        console.error("Add address error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 13. Update Location Preference
app.put('/api/preferences/location', async (req, res) => {
    console.log("Update location:", req.body);
    try {
        const { userId, location } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.selectedLocation = location;
        await user.save();
        console.log("Location updated for user:", userId, "to", location);
        res.json({ message: "Location updated", location });
    } catch (err) {
        console.error("Update location error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 14. Create Checkout Session
app.post('/api/checkout/session', async (req, res) => {
    console.log("Create checkout session:", req.body);
    try {
        const { userId, items } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.checkoutSession = { items, createdAt: Date.now() };
        await user.save();
        console.log("Checkout session created for user:", userId);
        res.json({ message: "Checkout session created" });
    } catch (err) {
        console.error("Create checkout session error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 15. Get Checkout Session
app.get('/api/checkout/session/:userId', async (req, res) => {
    console.log("Get checkout session for user:", req.params.userId);
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user.checkoutSession || { items: [] });
    } catch (err) {
        console.error("Get checkout session error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 16. Clear Checkout Session
app.delete('/api/checkout/session/:userId', async (req, res) => {
    console.log("Clear checkout session for user:", req.params.userId);
    try {
        const user = await User.findById(req.params.userId);
        if (user) {
            user.checkoutSession = { items: [], createdAt: null };
            await user.save();
        }
        res.json({ message: "Checkout session cleared" });
    } catch (err) {
        console.error("Clear checkout session error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ⭐ FULL BACKEND CHECKOUT ⭐
// This replaces localStorage-based checkout.
app.post('/api/checkout', async (req, res) => {
    console.log("Checkout request:", req.body);

    try {
        const { userId, address } = req.body;
        if (!userId) return res.status(400).json({ message: "User ID is required" });

        // 1. Get user cart
        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // 2. Calculate total
        const total = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

        // 3. Create Order
        const newOrder = new Order({
            userId,
            items: cart.items,
            total,
            date: new Date()
        });

        await newOrder.save();

        // 4. Save address to User document
        if (address) {
            const user = await User.findById(userId);

            if (user) {
                user.addresses.push(address);
                await user.save();
            }
        }

        // 5. Remove only purchased items from cart
        if (address?.productIds && Array.isArray(address.productIds)) {
            // Remove only items that were purchased
            cart.items = cart.items.filter(item =>
                !address.productIds.includes(item.productId)
            );
        } else {
            console.log("Warning: No productIds received, cart not modified.");
        }

        await cart.save();

        res.json({
            message: "Checkout successful",
            orderId: newOrder._id
        });

    } catch (err) {
        console.error("Checkout error:", err);
        res.status(500).json({ error: err.message });
    }
});




// Serve index.html for any unknown routes (Frontend catch-all)
app.get('*', (req, res) => {
    // Check if the request is for an API route
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    // Otherwise serve the frontend
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Get all orders of a user
app.get('/api/orders/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const orders = await ordersCollection.find({ userId }).toArray();
        if (!orders.length) {
            return res.json([]);
        }
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// delete order 
const { ObjectId } = require('mongodb'); // ensure this exists on top

// DELETE Order API
// DELETE order
app.delete('/api/orders/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        await Order.findByIdAndDelete(orderId);
        res.json({ message: "Order deleted successfully" });
    } catch (err) {
        console.error("Delete order error:", err);
        res.status(500).json({ error: "Failed to delete order" });
    }
});
