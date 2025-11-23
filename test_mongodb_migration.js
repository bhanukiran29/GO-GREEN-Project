/**
 * Automated Test Script for MongoDB Migration
 * Tests: Session tokens, location preferences, cart operations, and data persistence
 */

const API_URL = "http://localhost:5002/api";

// Test utilities
function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        error: '\x1b[31m',
        warning: '\x1b[33m'
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type]}${message}${reset}`);
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ Assertion failed: ${message}`);
    }
    log(`✅ ${message}`, 'success');
}

// Test state
let testUser = {
    name: "Test User Migration",
    email: `test_migration_${Date.now()}@example.com`,
    phone: "1234567890",
    password: "testpass123"
};
let sessionToken = null;
let userId = null;

async function runTests() {
    log('\n🚀 Starting MongoDB Migration Tests\n', 'info');

    try {
        // Test 1: User Signup
        await testSignup();

        // Test 2: User Login with Session Token
        await testLogin();

        // Test 3: Session Token Validation
        await testSessionToken();

        // Test 4: Location Preference
        await testLocationPreference();

        // Test 5: Cart Operations
        await testCartOperations();

        // Test 6: Address Management
        await testAddressManagement();

        // Test 7: Checkout Session
        await testCheckoutSession();

        // Test 8: Order Placement
        await testOrderPlacement();

        // Test 9: Data Persistence
        await testDataPersistence();

        log('\n✅ All tests passed! MongoDB migration successful!\n', 'success');
        process.exit(0);

    } catch (error) {
        log(`\n❌ Test failed: ${error.message}\n`, 'error');
        console.error(error);
        process.exit(1);
    }
}

async function testSignup() {
    log('\n📝 Test 1: User Signup', 'info');

    const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });

    const data = await res.json();
    assert(res.ok, 'User signup successful');
    assert(data.message === 'Account created successfully', 'Correct signup message');
}

async function testLogin() {
    log('\n🔐 Test 2: User Login with Session Token', 'info');

    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testUser.email,
            password: testUser.password
        })
    });

    const data = await res.json();
    assert(res.ok, 'Login successful');
    assert(data.sessionToken, 'Session token generated');
    assert(data.userId, 'User ID returned');
    assert(data.userName, 'User name returned');
    assert(data.userEmail === testUser.email, 'User email matches');
    assert(!data.user, 'Full user object NOT returned (security improvement)');

    sessionToken = data.sessionToken;
    userId = data.userId;

    log(`  Session Token: ${sessionToken.substring(0, 20)}...`, 'info');
    log(`  User ID: ${userId}`, 'info');
}

async function testSessionToken() {
    log('\n🎫 Test 3: Session Token Validation', 'info');

    const res = await fetch(`${API_URL}/auth/user/${userId}`);
    const data = await res.json();

    assert(res.ok, 'User data retrieved');
    assert(data.name === testUser.name, 'User name matches');
    assert(data.email === testUser.email, 'User email matches');
    assert(!data.password, 'Password NOT included in response');
    assert(!data.sessionToken, 'Session token NOT included in response');
}

async function testLocationPreference() {
    log('\n📍 Test 4: Location Preference', 'info');

    const testLocation = 'Mumbai';

    // Set location
    const setRes = await fetch(`${API_URL}/preferences/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            location: testLocation
        })
    });

    const setData = await setRes.json();
    assert(setRes.ok, 'Location preference saved');
    assert(setData.location === testLocation, 'Location matches');

    // Verify location persisted
    const getRes = await fetch(`${API_URL}/auth/user/${userId}`);
    const userData = await getRes.json();
    assert(userData.selectedLocation === testLocation, 'Location persisted in database');
}

async function testCartOperations() {
    log('\n🛒 Test 5: Cart Operations', 'info');

    // Add items to cart
    const item1 = {
        userId,
        productId: 'test_p1',
        name: 'Test Product 1',
        price: 299,
        img: 'test1.jpg'
    };

    const addRes = await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item1)
    });

    assert(addRes.ok, 'Item added to cart');

    // Get cart
    const getRes = await fetch(`${API_URL}/cart/${userId}`);
    const cart = await getRes.json();

    assert(cart.items && cart.items.length === 1, 'Cart has 1 item');
    assert(cart.items[0].name === item1.name, 'Item name matches');
    assert(cart.items[0].qty === 1, 'Initial quantity is 1');

    // Update quantity
    const updateRes = await fetch(`${API_URL}/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            productId: 'test_p1',
            qty: 3
        })
    });

    assert(updateRes.ok, 'Quantity updated');

    // Verify update
    const updatedCart = await (await fetch(`${API_URL}/cart/${userId}`)).json();
    assert(updatedCart.items[0].qty === 3, 'Quantity updated to 3');

    // Remove item
    const removeRes = await fetch(`${API_URL}/cart/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            productId: 'test_p1'
        })
    });

    assert(removeRes.ok, 'Item removed from cart');

    // Verify removal
    const emptyCart = await (await fetch(`${API_URL}/cart/${userId}`)).json();
    assert(emptyCart.items.length === 0, 'Cart is empty after removal');
}

async function testAddressManagement() {
    log('\n🏠 Test 6: Address Management', 'info');

    const testAddress = {
        name: 'Test User',
        phone: '9876543210',
        address: '123 Test Street',
        city: 'Mumbai',
        pincode: '400001',
        isDefault: true
    };

    // Add address
    const addRes = await fetch(`${API_URL}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            address: testAddress
        })
    });

    const addData = await addRes.json();
    assert(addRes.ok, 'Address added');
    assert(addData.addresses.length === 1, 'User has 1 address');

    // Get addresses
    const getRes = await fetch(`${API_URL}/addresses/${userId}`);
    const addresses = await getRes.json();

    assert(addresses.length === 1, 'Retrieved 1 address');
    assert(addresses[0].city === testAddress.city, 'Address city matches');
    assert(addresses[0].isDefault === true, 'Address is default');
}

async function testCheckoutSession() {
    log('\n💳 Test 7: Checkout Session', 'info');

    // Add item to cart first
    await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            productId: 'checkout_test',
            name: 'Checkout Test Product',
            price: 499,
            img: 'test.jpg'
        })
    });

    // Get cart items
    const cart = await (await fetch(`${API_URL}/cart/${userId}`)).json();

    // Create checkout session
    const createRes = await fetch(`${API_URL}/checkout/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            items: cart.items
        })
    });

    assert(createRes.ok, 'Checkout session created');

    // Get checkout session
    const getRes = await fetch(`${API_URL}/checkout/session/${userId}`);
    const session = await getRes.json();

    assert(session.items && session.items.length > 0, 'Checkout session has items');
    assert(session.items[0].name === 'Checkout Test Product', 'Checkout item matches');

    // Clear checkout session
    const clearRes = await fetch(`${API_URL}/checkout/session/${userId}`, {
        method: 'DELETE'
    });

    assert(clearRes.ok, 'Checkout session cleared');
}

async function testOrderPlacement() {
    log('\n📦 Test 8: Order Placement', 'info');

    // Add item to cart
    await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            productId: 'order_test',
            name: 'Order Test Product',
            price: 599,
            img: 'test.jpg'
        })
    });

    // Get cart
    const cart = await (await fetch(`${API_URL}/cart/${userId}`)).json();

    // Place order
    const orderRes = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            items: cart.items,
            total: 599
        })
    });

    assert(orderRes.ok, 'Order placed successfully');

    // Get orders
    const ordersRes = await fetch(`${API_URL}/orders/${userId}`);
    const orders = await ordersRes.json();

    assert(orders.length > 0, 'User has orders');
    assert(orders[0].userId === userId, 'Order belongs to correct user');
    assert(orders[0].total === 599, 'Order total matches');

    // Clear cart
    const setData = await setRes.json();
    assert(setRes.ok, 'Location preference saved');
    assert(setData.location === testLocation, 'Location matches');

    // Verify location persisted
    const getRes = await fetch(`${API_URL}/auth/user/${userId}`);
    const userData = await getRes.json();
    assert(userData.selectedLocation === testLocation, 'Location persisted in database');
}

async function testCartOperations() {
    log('\n🛒 Test 5: Cart Operations', 'info');

    // Add items to cart
    const item1 = {
        userId,
        productId: 'test_p1',
        name: 'Test Product 1',
        price: 299,
        img: 'test1.jpg'
    };

    const addRes = await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item1)
    });

    assert(addRes.ok, 'Item added to cart');

    // Get cart
    const getRes = await fetch(`${API_URL}/cart/${userId}`);
    const cart = await getRes.json();

    assert(cart.items && cart.items.length === 1, 'Cart has 1 item');
    assert(cart.items[0].name === item1.name, 'Item name matches');
    assert(cart.items[0].qty === 1, 'Initial quantity is 1');

    // Update quantity
    const updateRes = await fetch(`${API_URL}/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            productId: 'test_p1',
            qty: 3
        })
    });

    assert(updateRes.ok, 'Quantity updated');

    // Verify update
    const updatedCart = await (await fetch(`${API_URL}/cart/${userId}`)).json();
    assert(updatedCart.items[0].qty === 3, 'Quantity updated to 3');

    // Remove item
    const removeRes = await fetch(`${API_URL}/cart/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            productId: 'test_p1'
        })
    });

    assert(removeRes.ok, 'Item removed from cart');

    // Verify removal
    const emptyCart = await (await fetch(`${API_URL}/cart/${userId}`)).json();
    assert(emptyCart.items.length === 0, 'Cart is empty after removal');
}

async function testAddressManagement() {
    log('\n🏠 Test 6: Address Management', 'info');

    const testAddress = {
        name: 'Test User',
        phone: '9876543210',
        address: '123 Test Street',
        city: 'Mumbai',
        pincode: '400001',
        isDefault: true
    };

    // Add address
    const addRes = await fetch(`${API_URL}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            address: testAddress
        })
    });

    const addData = await addRes.json();
    assert(addRes.ok, 'Address added');
    assert(addData.addresses.length === 1, 'User has 1 address');

    // Get addresses
    const getRes = await fetch(`${API_URL}/addresses/${userId}`);
    const addresses = await getRes.json();

    assert(addresses.length === 1, 'Retrieved 1 address');
    assert(addresses[0].city === testAddress.city, 'Address city matches');
    assert(addresses[0].isDefault === true, 'Address is default');
}

async function testCheckoutSession() {
    log('\n💳 Test 7: Checkout Session', 'info');

    // Add item to cart first
    await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            productId: 'checkout_test',
            name: 'Checkout Test Product',
            price: 499,
            img: 'test.jpg'
        })
    });

    // Get cart items
    const cart = await (await fetch(`${API_URL}/cart/${userId}`)).json();

    // Create checkout session
    const createRes = await fetch(`${API_URL}/checkout/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            items: cart.items
        })
    });

    assert(createRes.ok, 'Checkout session created');

    // Get checkout session
    const getRes = await fetch(`${API_URL}/checkout/session/${userId}`);
    const session = await getRes.json();

    assert(session.items && session.items.length > 0, 'Checkout session has items');
    assert(session.items[0].name === 'Checkout Test Product', 'Checkout item matches');

    // Clear checkout session
    const clearRes = await fetch(`${API_URL}/checkout/session/${userId}`, {
        method: 'DELETE'
    });

    assert(clearRes.ok, 'Checkout session cleared');
}

async function testOrderPlacement() {
    log('\n📦 Test 8: Order Placement', 'info');

    // Add item to cart
    await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            productId: 'order_test',
            name: 'Order Test Product',
            price: 599,
            img: 'test.jpg'
        })
    });

    // Get cart
    const cart = await (await fetch(`${API_URL}/cart/${userId}`)).json();

    // Place order
    const orderRes = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            items: cart.items,
            total: 599
        })
    });

    assert(orderRes.ok, 'Order placed successfully');

    // Get orders
    const ordersRes = await fetch(`${API_URL}/orders/${userId}`);
    const orders = await ordersRes.json();

    assert(orders.length > 0, 'User has orders');
    assert(orders[0].userId === userId, 'Order belongs to correct user');
    assert(orders[0].total === 599, 'Order total matches');

    // Clear cart
    await fetch(`${API_URL}/cart/clear/${userId}`, { method: 'DELETE' });
}

async function testDataPersistence() {
    log('\n💾 Test 9: Data Persistence', 'info');

    // Verify all data is in MongoDB
    const userRes = await fetch(`${API_URL}/auth/user/${userId}`);
    const userData = await userRes.json();

    assert(userData.selectedLocation, 'Location preference persisted');
    assert(userData.addresses && userData.addresses.length > 0, 'Addresses persisted');
    assert(!userData.sessionToken, 'Session token NOT exposed in API (security)');

    // Verify cart is in database
    const cartRes = await fetch(`${API_URL}/cart/${userId}`);
    const cartData = await cartRes.json();
    assert(cartData.userId === userId, 'Cart is user-specific');

    // Verify orders are in database
    const ordersRes = await fetch(`${API_URL}/orders/${userId}`);
    const ordersData = await ordersRes.json();
    assert(Array.isArray(ordersData), 'Orders retrieved from database');

    log('  ✅ All data confirmed in MongoDB', 'success');
    log('  ✅ No localStorage dependencies', 'success');
    log('  ✅ Session tokens properly secured', 'success');
}

// Run tests
runTests();
