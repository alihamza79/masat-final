// Test script to verify authentication fix
// Run this in the browser console on the production site

console.log('🔍 Testing Authentication Fix...');

// Test 1: Check if cookies are being set correctly
function checkCookies() {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  console.log('📋 Current cookies:', cookies);
  
  const hasSessionToken = cookies['next-auth.session-token'];
  const hasCallbackUrl = cookies['next-auth.callback-url'];
  const hasCsrfToken = cookies['next-auth.csrf-token'];
  
  console.log('🍪 Cookie check:');
  console.log('  - Session token:', hasSessionToken ? '✅ Present' : '❌ Missing');
  console.log('  - Callback URL:', hasCallbackUrl ? '✅ Present' : '❌ Missing');
  console.log('  - CSRF token:', hasCsrfToken ? '✅ Present' : '❌ Missing');
  
  return { hasSessionToken, hasCallbackUrl, hasCsrfToken };
}

// Test 2: Check session endpoint
async function checkSession() {
  try {
    const response = await fetch('/api/debug/auth-session');
    const data = await response.json();
    
    console.log('🔐 Session check:', data);
    
    if (data.success) {
      console.log('  - Session exists:', data.session.exists ? '✅ Yes' : '❌ No');
      console.log('  - Token exists:', data.token.exists ? '✅ Yes' : '❌ No');
      console.log('  - User ID:', data.session.user?.id || 'Not found');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Session check failed:', error);
  }
}

// Test 3: Check test-session endpoint
async function checkTestSession() {
  try {
    const response = await fetch('/api/test-session');
    const data = await response.json();
    
    console.log('🧪 Test session check:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Test session check failed:', error);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting authentication tests...\n');
  
  console.log('1️⃣ Checking cookies...');
  const cookieResults = checkCookies();
  
  console.log('\n2️⃣ Checking session...');
  const sessionResults = await checkSession();
  
  console.log('\n3️⃣ Checking test session...');
  const testSessionResults = await checkTestSession();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  if (cookieResults.hasSessionToken && sessionResults?.session?.exists) {
    console.log('✅ Authentication appears to be working correctly!');
    console.log('💡 Try accessing /dashboard directly');
  } else {
    console.log('❌ Authentication issues detected:');
    if (!cookieResults.hasSessionToken) {
      console.log('  - Session token cookie is missing');
    }
    if (!sessionResults?.session?.exists) {
      console.log('  - Server session is not found');
    }
    console.log('💡 Try logging in again');
  }
}

// Auto-run the tests
runTests();

// Instructions
console.log('\n📋 Instructions:');
console.log('1. Open browser developer tools (F12)');
console.log('2. Go to Console tab');
console.log('3. Run this script after attempting to log in');
console.log('4. Check the results above');
console.log('5. If authentication is working, try accessing /dashboard'); 