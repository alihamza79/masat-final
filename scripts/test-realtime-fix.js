#!/usr/bin/env node

/**
 * Quick Test for Realtime Fix
 * 
 * This script tests if the dependency loop issue is fixed by checking:
 * 1. No excessive requests are made
 * 2. Rate limiting is working
 * 3. Connection attempts are reasonable
 */

// Polyfill fetch for older Node.js versions
let fetch;
try {
  fetch = globalThis.fetch;
} catch (e) {
  // Node.js < 18
}

if (!fetch) {
  try {
    fetch = require('node-fetch');
  } catch (e) {
    console.error('❌ fetch is not available. For Node.js < 18, install node-fetch: npm install node-fetch');
    process.exit(1);
  }
}

const API_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

console.log('🧪 Testing Realtime Fix...\n');

async function testConnectionLimit() {
  console.log('🔬 Test 1: Connection Limit Test');
  console.log('Making 20 rapid requests to check if excessive requests are blocked...\n');
  
  const startTime = Date.now();
  const promises = [];
  
  // Make 20 rapid requests
  for (let i = 0; i < 20; i++) {
    promises.push(
      fetch(`${API_BASE_URL}/api/realtime?collections=notifications&test=true`, {
        method: 'GET',
        headers: {
          'User-Agent': `test-client-${i}`
        }
      })
      .then(res => ({ 
        index: i, 
        status: res.status, 
        statusText: res.statusText,
        timestamp: Date.now() - startTime 
      }))
      .catch(err => ({ 
        index: i, 
        error: err.message, 
        timestamp: Date.now() - startTime 
      }))
    );
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Analyze results
  const rateLimited = results.filter(r => r.status === 429).length;
  const successful = results.filter(r => r.status === 401 || r.status === 200).length; // 401 is expected without auth
  const errors = results.filter(r => r.error).length;
  
  console.log('📊 Results:');
  console.log(`   ⏱️  Total time: ${totalTime}ms`);
  console.log(`   📡 Total requests: ${results.length}`);
  console.log(`   ✅ Successful/Auth required: ${successful}`);
  console.log(`   ⛔ Rate limited: ${rateLimited}`);
  console.log(`   ❌ Errors: ${errors}`);
  
  // Assessment
  if (rateLimited > 5) {
    console.log('   ✅ GOOD: Rate limiting is working effectively!');
  } else {
    console.log('   ⚠️  WARNING: Rate limiting might need adjustment');
  }
  
  if (totalTime < 5000) { // Should complete in under 5 seconds
    console.log('   ✅ GOOD: Requests complete quickly (no loops detected)');
  } else {
    console.log('   ❌ PROBLEM: Requests taking too long (possible loops)');
  }
  
  return { rateLimited, successful, errors, totalTime };
}

async function testHealthEndpoint() {
  console.log('\n🔬 Test 2: Health Endpoint Test');
  console.log('Checking if health endpoint responds normally...\n');
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE_URL}/api/realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const endTime = Date.now();
    
    console.log('📊 Health Check Results:');
    console.log(`   ⏱️  Response time: ${endTime - startTime}ms`);
    console.log(`   📡 Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('   ✅ GOOD: Authentication required (expected)');
      return true;
    } else if (response.status === 200) {
      const data = await response.json();
      console.log(`   📊 Active connections: ${data.data?.activeConnections || 'N/A'}`);
      console.log('   ✅ GOOD: Health endpoint working');
      return true;
    } else {
      console.log('   ⚠️  Unexpected status code');
      return false;
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Running Realtime Fix Tests\n');
  console.log('=' .repeat(50));
  
  const test1 = await testConnectionLimit();
  const test2 = await testHealthEndpoint();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 FINAL ASSESSMENT:\n');
  
  let issuesFixed = 0;
  let totalIssues = 3;
  
  // Check 1: Rate limiting working
  if (test1.rateLimited > 5) {
    console.log('✅ Rate limiting is working properly');
    issuesFixed++;
  } else {
    console.log('❌ Rate limiting needs improvement');
  }
  
  // Check 2: No performance issues
  if (test1.totalTime < 5000) {
    console.log('✅ No dependency loops detected (fast responses)');
    issuesFixed++;
  } else {
    console.log('❌ Possible dependency loops (slow responses)');
  }
  
  // Check 3: Health endpoint working
  if (test2) {
    console.log('✅ Health endpoint responding normally');
    issuesFixed++;
  } else {
    console.log('❌ Health endpoint has issues');
  }
  
  const successRate = (issuesFixed / totalIssues) * 100;
  
  console.log(`\n🏥 OVERALL HEALTH: ${successRate.toFixed(0)}%`);
  
  if (successRate >= 100) {
    console.log('🎉 ALL ISSUES FIXED! The realtime endpoint is healthy.');
  } else if (successRate >= 66) {
    console.log('⚡ MOSTLY FIXED! Minor issues remain.');
  } else {
    console.log('🚨 STILL NEEDS WORK! Major issues persist.');
  }
  
  console.log('\n💡 TIP: If issues persist, check server logs for specific error patterns.');
  console.log('🔍 Monitor with: node scripts/monitor-realtime-health.js');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 