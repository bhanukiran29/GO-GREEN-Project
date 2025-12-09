# Quick Start Guide - Backend Verification

## Prerequisites
✅ MongoDB is running on mongodb://127.0.0.1:27017
✅ You mentioned you already ran npm command and connected to MongoDB

## Step 1: Verify Server is Running

Open a terminal and run:
```bash
cd server
node server.js
```

You should see:
```
MongoDB Connected
Server running on port 5002
```

**Keep this terminal open!** The server needs to stay running.

## Step 2: Run Backend Tests

Open a **NEW** terminal window and run:
```bash
cd c:\Users\Bhanu Kiran\OneDrive\Desktop\FWDProject
node test_complete_flow.js
```

## Expected Output

You should see output like this:

```
🚀 Starting Complete Backend Verification Tests...

============================================================
  1. SERVER CONNECTION TEST
============================================================
✅ Server is reachable

============================================================
  2. USER SIGNUP TEST
============================================================
✅ Signup successful for test1234567890@example.com

============================================================
  3. USER LOGIN TEST
============================================================
✅ Login successful! UserId: 67567a1b2c3d4e5f6a7b8c9d
📘 Session Token: 67567a1b2c3d4e5f6a...

... (continues for all 14 tests)

============================================================
  TEST SUMMARY
============================================================
📘 Total Tests: 14
✅ Passed: 14
✅ Failed: 0
✅ Success Rate: 100.0%
```

## Troubleshooting

### If you see "Server is not running!"
- Make sure you started the server in Step 1
- Check if port 5002 is already in use
- Verify MongoDB is running

### If you see "MongoDB connection error"
- Start MongoDB service
- Check MongoDB is running on port 27017

### If tests fail
- Check the error messages in the output
- Verify all npm packages are installed: `npm install`
- Check server logs for errors

## What the Tests Verify

The test script automatically verifies:
1. ✅ Server connectivity
2. ✅ User signup and login
3. ✅ Profile updates
4. ✅ Location preferences
5. ✅ Cart operations (add, update, remove, clear)
6. ✅ Order placement and retrieval
7. ✅ Address management
8. ✅ Data persistence in MongoDB

## After Testing

Once all tests pass, your backend is fully verified and ready to use!

You can then:
- Test the full application in the browser
- Create real user accounts
- Add items to cart
- Place orders
- Everything will be saved to MongoDB
