#!/usr/bin/env tsx

/**
 * Test Payment Verification
 * 
 * This script tests the payment verification endpoint to debug issues
 */

import fetch from 'node-fetch';

const VERCEL_URL = 'https://definition-detective-app.vercel.app';
const TEST_REFERENCE = 'DD_TEST_' + Date.now();

async function testVerification() {
  console.log('🧪 Testing Payment Verification\n');
  
  // Test 1: Check if verification endpoint exists
  console.log('1️⃣ Testing verification endpoint...');
  try {
    const response = await fetch(`${VERCEL_URL}/api/paystack/verify?reference=${TEST_REFERENCE}`, {
      headers: {
        'x-user-id': 'test-user-123',
      },
    });
    
    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 400 || response.status === 500) {
      console.log('   ✅ Endpoint exists and responding');
    }
  } catch (error: any) {
    console.log('   ❌ Error:', error.message);
  }
  
  console.log('\n');
  
  // Test 2: Check webhook endpoint
  console.log('2️⃣ Testing webhook endpoint...');
  try {
    const response = await fetch(`${VERCEL_URL}/api/pay`);
    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(data, null, 2));
    console.log('   ✅ Webhook endpoint exists');
  } catch (error: any) {
    console.log('   ❌ Error:', error.message);
  }
  
  console.log('\n');
  
  // Test 3: Check Firebase initialization
  console.log('3️⃣ Checking Firebase initialization...');
  console.log('   Note: Check Vercel logs for Firebase initialization messages');
  console.log('   Expected: "✅ Firebase Admin initialized successfully"');
  console.log('   Bad: "⚠️ Missing Firebase credentials"');
  
  console.log('\n');
  
  // Test 4: Instructions for real payment test
  console.log('4️⃣ To test with real payment:\n');
  console.log('   1. Go to: https://definition-detective-app.vercel.app/store');
  console.log('   2. Click "Buy 10 Hints"');
  console.log('   3. Use test card: 4084084084084081');
  console.log('   4. CVV: 408, Expiry: 12/25, PIN: 0000, OTP: 123456');
  console.log('   5. Watch browser console for errors');
  console.log('   6. Check Vercel logs: vercel logs <deployment-url>');
  
  console.log('\n');
  
  // Test 5: Common issues checklist
  console.log('5️⃣ Common Issues Checklist:\n');
  console.log('   [ ] PAYSTACK_SECRET_KEY set in Vercel?');
  console.log('   [ ] FIREBASE_CLIENT_EMAIL set in Vercel?');
  console.log('   [ ] FIREBASE_PRIVATE_KEY set in Vercel?');
  console.log('   [ ] App redeployed after adding credentials?');
  console.log('   [ ] User is logged in before payment?');
  console.log('   [ ] Paystack webhook configured?');
  
  console.log('\n');
  console.log('✅ Test complete!');
  console.log('\nNext steps:');
  console.log('1. Make a real payment');
  console.log('2. Check browser console for errors');
  console.log('3. Check Vercel logs for detailed error messages');
}

testVerification().catch(console.error);
