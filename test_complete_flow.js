/* ===========================
   Complete Backend Verification Test
   Tests all API endpoints and MongoDB connections
   =========================== */

const API_URL = "http://localhost:5002/api";

// Test utilities
function log(message, type = 'info') {
    const prefix = {
        'info': '📘',
        'success': '✅',
        'error': '❌',
        'test': '🧪'
    }[type] || 'ℹ️';
    console.log(`${prefix} ${message}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    console.log(`  ${title}`);
    console.log('='.repeat(60));
}

// Test data
const testUser = {
    name: "Test User",
    email: `test${Date.now()}@example.com`,
    phone: "1234567890",
    password: "testpass123"
};

let userId = null;
let sessionToken = null;

// Test functions
async function testServerConnection() {
    logSection('1. SERVER CONNECTION TEST');
    try {
        const response = await fetch('http://localhost:5002/api/auth/user/test');
        log('Server is reachable', 'success');
        return true;
    } catch (err) {
        log('Server is not running! Please start with: node server/server.js', 'error');
        return false;
    }
}

async function testSignup() {
    logSection('2. USER SIGNUP TEST');
    try {
        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const data = await res.json();

        if (res.ok) {
            log(`Signup successful for ${testUser.email}`, 'success');
            return true;
        } else {
            log(`Signup failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Signup error: ${err.message}`, 'error');
        return false;
    }
}

async function testLogin() {
    logSection('3. USER LOGIN TEST');
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        const data = await res.json();

        if (res.ok) {
            userId = data.userId;
            sessionToken = data.sessionToken;
            log(`Login successful! UserId: ${userId}`, 'success');
            log(`Session Token: ${sessionToken.substring(0, 20)}...`, 'info');
            return true;
        } else {
            log(`Login failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Login error: ${err.message}`, 'error');
        return false;
    }
}

async function testGetUser() {
    logSection('4. GET USER DATA TEST');
    try {
        const res = await fetch(`${API_URL}/auth/user/${userId}`);
        const data = await res.json();

        if (res.ok) {
            log(`User data retrieved: ${data.name} (${data.email})`, 'success');
            return true;
        } else {
            log(`Get user failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Get user error: ${err.message}`, 'error');
        return false;
    }
}

async function testUpdateProfile() {
    logSection('5. UPDATE PROFILE TEST');
    try {
        const res = await fetch(`${API_URL}/auth/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                _id: userId,
                name: "Updated Test User",
                email: testUser.email,
                phone: "9876543210"
            })
        });
        const data = await res.json();

        if (res.ok) {
            log(`Profile updated successfully`, 'success');
            return true;
        } else {
            log(`Update failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Update error: ${err.message}`, 'error');
        return false;
    }
}

async function testLocationPreference() {
    logSection('6. LOCATION PREFERENCE TEST');
    try {
        const res = await fetch(`${API_URL}/preferences/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                location: "Hyderabad"
            })
        });
        const data = await res.json();

        if (res.ok) {
            log(`Location preference saved: Hyderabad`, 'success');
            return true;
        } else {
            log(`Location update failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Location error: ${err.message}`, 'error');
        return false;
    }
}

async function testAddToCart() {
    logSection('7. ADD TO CART TEST');
    try {
        const testProduct = {
            userId: userId,
            productId: "test_product_1",
            name: "Test Plant",
            price: 299,
            img: "i101.jpg"
        };

        const res = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testProduct)
        });
        const data = await res.json();

        if (res.ok) {
            log(`Product added to cart: ${testProduct.name}`, 'success');
            return true;
        } else {
            log(`Add to cart failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Add to cart error: ${err.message}`, 'error');
        return false;
    }
}

async function testGetCart() {
    logSection('8. GET CART TEST');
    try {
        const res = await fetch(`${API_URL}/cart/${userId}`);
        const data = await res.json();

        if (res.ok) {
            log(`Cart retrieved with ${data.items.length} items`, 'success');
            data.items.forEach(item => {
                log(`  - ${item.name} (Qty: ${item.qty}, Price: ₹${item.price})`, 'info');
            });
            return true;
        } else {
            log(`Get cart failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Get cart error: ${err.message}`, 'error');
        return false;
    }
}

async function testUpdateCartQty() {
    logSection('9. UPDATE CART QUANTITY TEST');
    try {
        const res = await fetch(`${API_URL}/cart/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                productId: "test_product_1",
                qty: 3
            })
        });
        const data = await res.json();

        if (res.ok) {
            log(`Cart quantity updated to 3`, 'success');
            return true;
        } else {
            log(`Update quantity failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Update quantity error: ${err.message}`, 'error');
        return false;
    }
}

async function testPlaceOrder() {
    logSection('10. PLACE ORDER TEST');
    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                items: [
                    { name: "Test Plant", price: 299, qty: 3, img: "i101.jpg" }
                ],
                total: 897
            })
        });
        const data = await res.json();

        if (res.ok) {
            log(`Order placed successfully! Total: ₹897`, 'success');
            return true;
        } else {
            log(`Place order failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Place order error: ${err.message}`, 'error');
        return false;
    }
}

async function testGetOrders() {
    logSection('11. GET ORDERS TEST');
    try {
        const res = await fetch(`${API_URL}/orders/${userId}`);
        const data = await res.json();

        if (res.ok) {
            log(`Retrieved ${data.length} orders`, 'success');
            data.forEach((order, idx) => {
                log(`  Order ${idx + 1}: ${order.items.length} items, Total: ₹${order.total}`, 'info');
            });
            return true;
        } else {
            log(`Get orders failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Get orders error: ${err.message}`, 'error');
        return false;
    }
}

async function testAddAddress() {
    logSection('12. ADD ADDRESS TEST');
    try {
        const res = await fetch(`${API_URL}/addresses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                address: {
                    street: "123 Test Street",
                    city: "Hyderabad",
                    state: "Telangana",
                    zip: "500001",
                    isDefault: true
                }
            })
        });
        const data = await res.json();

        if (res.ok) {
            log(`Address added successfully`, 'success');
            return true;
        } else {
            log(`Add address failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Add address error: ${err.message}`, 'error');
        return false;
    }
}

async function testGetAddresses() {
    logSection('13. GET ADDRESSES TEST');
    try {
        const res = await fetch(`${API_URL}/addresses/${userId}`);
        const data = await res.json();

        if (res.ok) {
            log(`Retrieved ${data.length} addresses`, 'success');
            data.forEach((addr, idx) => {
                log(`  Address ${idx + 1}: ${addr.street}, ${addr.city}`, 'info');
            });
            return true;
        } else {
            log(`Get addresses failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Get addresses error: ${err.message}`, 'error');
        return false;
    }
}

async function testClearCart() {
    logSection('14. CLEAR CART TEST');
    try {
        const res = await fetch(`${API_URL}/cart/clear/${userId}`, {
            method: 'DELETE'
        });
        const data = await res.json();

        if (res.ok) {
            log(`Cart cleared successfully`, 'success');
            return true;
        } else {
            log(`Clear cart failed: ${data.message}`, 'error');
            return false;
        }
    } catch (err) {
        log(`Clear cart error: ${err.message}`, 'error');
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('\n🚀 Starting Complete Backend Verification Tests...\n');

    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };

    const tests = [
        { name: 'Server Connection', fn: testServerConnection },
        { name: 'User Signup', fn: testSignup },
        { name: 'User Login', fn: testLogin },
        { name: 'Get User Data', fn: testGetUser },
        { name: 'Update Profile', fn: testUpdateProfile },
        { name: 'Location Preference', fn: testLocationPreference },
        { name: 'Add to Cart', fn: testAddToCart },
        { name: 'Get Cart', fn: testGetCart },
        { name: 'Update Cart Quantity', fn: testUpdateCartQty },
        { name: 'Place Order', fn: testPlaceOrder },
        { name: 'Get Orders', fn: testGetOrders },
        { name: 'Add Address', fn: testAddAddress },
        { name: 'Get Addresses', fn: testGetAddresses },
        { name: 'Clear Cart', fn: testClearCart }
    ];

    for (const test of tests) {
        results.total++;
        const passed = await test.fn();
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
            // If server connection fails, stop testing
            if (test.name === 'Server Connection') {
                break;
            }
        }
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Print summary
    logSection('TEST SUMMARY');
    log(`Total Tests: ${results.total}`, 'info');
    log(`Passed: ${results.passed}`, 'success');
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success');

    const percentage = ((results.passed / results.total) * 100).toFixed(1);
    log(`Success Rate: ${percentage}%`, percentage === '100.0' ? 'success' : 'info');

    console.log('\n' + '='.repeat(60) + '\n');
}

// Run tests
runAllTests().catch(err => {
    console.error('Fatal error:', err);
});
