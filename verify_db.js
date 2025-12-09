const mongoose = require('mongoose');
const User = require('./server/models/User');
const Order = require('./server/models/Order');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/gogreen', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('✅ Connected to MongoDB');

    try {
        // 1. Check Users
        const userCount = await User.countDocuments();
        console.log(`\n📊 Total Users in DB: ${userCount}`);

        if (userCount > 0) {
            const lastUser = await User.findOne().sort({ _id: -1 });
            console.log("   Last Registered User:");
            console.log(`   - Name: ${lastUser.name}`);
            console.log(`   - Email: ${lastUser.email}`);
            console.log(`   - ID: ${lastUser._id}`);
        } else {
            console.log("   ⚠️ No users found in database.");
        }

        // 2. Check Orders
        const orderCount = await Order.countDocuments();
        console.log(`\n📊 Total Orders in DB: ${orderCount}`);

        if (orderCount > 0) {
            const lastOrder = await Order.findOne().sort({ date: -1 });
            console.log("   Last Placed Order:");
            console.log(`   - Order ID: ${lastOrder._id}`);
            console.log(`   - User ID: ${lastOrder.userId}`);
            console.log(`   - Total: ₹${lastOrder.total}`);
            console.log(`   - Items: ${lastOrder.items.length}`);
        } else {
            console.log("   ℹ️ No orders found in database yet.");
        }

        console.log("\n✅ Data persistence check complete.");

    } catch (err) {
        console.error("❌ Error querying database:", err);
    } finally {
        mongoose.connection.close();
    }
}).catch(err => {
    console.error("❌ Could not connect to MongoDB:", err);
});
