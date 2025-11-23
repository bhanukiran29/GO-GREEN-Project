const API_URL = "http://localhost:5002/api";

async function testCartAPI() {
    console.log("=== Starting Cart API Test ===\n");

    // 1. Create a test user
    const email = "carttest_" + Date.now() + "@example.com";
    const password = "password123";
    const name = "Cart Test User";
    const phone = "9876543210";

    console.log("1. Creating test user account...");
    try {
        const signupRes = await fetch(`${API_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, phone, password })
        });
        const signupData = await signupRes.json();
        console.log("   ✓ Signup Response:", signupData.message);
    } catch (e) {
        console.error("   ✗ Signup failed:", e.message);
        return;
    }

    // 2. Login
    console.log("\n2. Logging in...");
    let userId;
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
            userId = loginData.user._id;
            console.log("   ✓ Login successful! User ID:", userId);
        } else {
            console.error("   ✗ Login failed:", loginData.message);
            return;
        }
    } catch (e) {
        console.error("   ✗ Login error:", e.message);
        return;
    }

    // 3. Get empty cart
    console.log("\n3. Fetching initial cart (should be empty)...");
    try {
        const cartRes = await fetch(`${API_URL}/cart/${userId}`);
        const cart = await cartRes.json();
        console.log("   ✓ Cart items:", cart.items ? cart.items.length : 0);
    } catch (e) {
        console.error("   ✗ Get cart error:", e.message);
    }

    // 4. Add items to cart
    console.log("\n4. Adding items to cart...");
    const items = [
        { name: "Aloe Vera Plant", price: 299, img: "i1.jpg" },
        { name: "Snake Plant", price: 399, img: "i2.jpg" },
        { name: "Money Plant", price: 199, img: "i3.jpg" }
    ];

    for (const item of items) {
        try {
            const addRes = await fetch(`${API_URL}/cart/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    productId: "p" + Date.now() + Math.random(),
                    ...item
                })
            });
            const addData = await addRes.json();
            console.log(`   ✓ Added ${item.name} - ${addData.message}`);
        } catch (e) {
            console.error(`   ✗ Failed to add ${item.name}:`, e.message);
        }
    }

    // 5. Get cart with items
    console.log("\n5. Fetching cart after adding items...");
    let cartItems;
    try {
        const cartRes = await fetch(`${API_URL}/cart/${userId}`);
        const cart = await cartRes.json();
        cartItems = cart.items || [];
        console.log(`   ✓ Cart now has ${cartItems.length} items`);
        cartItems.forEach(item => {
            console.log(`      - ${item.name}: ₹${item.price} x ${item.qty}`);
        });
    } catch (e) {
        console.error("   ✗ Get cart error:", e.message);
    }

    // 6. Update quantity
    if (cartItems && cartItems.length > 0) {
        console.log("\n6. Updating quantity of first item...");
        try {
            const updateRes = await fetch(`${API_URL}/cart/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    productId: cartItems[0].productId,
                    qty: 3
                })
            });
            const updateData = await updateRes.json();
            console.log(`   ✓ ${updateData.message}`);
        } catch (e) {
            console.error("   ✗ Update quantity error:", e.message);
        }
    }

    // 7. Remove an item
    if (cartItems && cartItems.length > 1) {
        console.log("\n7. Removing second item from cart...");
        try {
            const removeRes = await fetch(`${API_URL}/cart/remove`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    productId: cartItems[1].productId
                })
            });
            const removeData = await removeRes.json();
            console.log(`   ✓ ${removeData.message}`);
        } catch (e) {
            console.error("   ✗ Remove item error:", e.message);
        }
    }

    // 8. Get updated cart
    console.log("\n8. Fetching cart after updates...");
    try {
        const cartRes = await fetch(`${API_URL}/cart/${userId}`);
        const cart = await cartRes.json();
        const items = cart.items || [];
        console.log(`   ✓ Cart now has ${items.length} items`);
        let total = 0;
        items.forEach(item => {
            const subtotal = item.price * item.qty;
            total += subtotal;
            console.log(`      - ${item.name}: ₹${item.price} x ${item.qty} = ₹${subtotal}`);
        });
        console.log(`   ✓ Total: ₹${total}`);
    } catch (e) {
        console.error("   ✗ Get cart error:", e.message);
    }

    // 9. Place order
    console.log("\n9. Placing order...");
    try {
        const cartRes = await fetch(`${API_URL}/cart/${userId}`);
        const cart = await cartRes.json();
        const items = cart.items || [];
        const total = items.reduce((sum, i) => sum + (i.price * i.qty), 0);

        const orderRes = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, items, total })
        });
        const orderData = await orderRes.json();
        console.log(`   ✓ ${orderData.message}`);
    } catch (e) {
        console.error("   ✗ Place order error:", e.message);
    }

    // 10. Clear cart
    console.log("\n10. Clearing cart after checkout...");
    try {
        const clearRes = await fetch(`${API_URL}/cart/clear/${userId}`, {
            method: "DELETE"
        });
        const clearData = await clearRes.json();
        console.log(`   ✓ ${clearData.message}`);
    } catch (e) {
        console.error("   ✗ Clear cart error:", e.message);
    }

    // 11. Verify cart is empty
    console.log("\n11. Verifying cart is empty...");
    try {
        const cartRes = await fetch(`${API_URL}/cart/${userId}`);
        const cart = await cartRes.json();
        const items = cart.items || [];
        console.log(`   ✓ Cart has ${items.length} items (should be 0)`);
    } catch (e) {
        console.error("   ✗ Get cart error:", e.message);
    }

    // 12. Verify order was saved
    console.log("\n12. Fetching orders to verify...");
    try {
        const ordersRes = await fetch(`${API_URL}/orders/${userId}`);
        const orders = await ordersRes.json();
        console.log(`   ✓ User has ${orders.length} order(s)`);
        if (orders.length > 0) {
            const lastOrder = orders[0];
            console.log(`      - Order ID: ${lastOrder._id}`);
            console.log(`      - Items: ${lastOrder.items.length}`);
            console.log(`      - Total: ₹${lastOrder.total}`);
        }
    } catch (e) {
        console.error("   ✗ Get orders error:", e.message);
    }

    console.log("\n=== Cart API Test Complete ===");
}

// Run the test
testCartAPI().catch(err => console.error("Test failed:", err));
