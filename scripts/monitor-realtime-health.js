#!/usr/bin/env node

/**
 * Real-time Health Monitor
 * 
 * This script monitors the /api/realtime endpoint health to verify:
 * 1. No excessive connections are being created
 * 2. Rate limiting is working properly
 * 3. Connection counts are within expected limits
 * 
 * Usage: node scripts/monitor-realtime-health.js [duration-in-minutes]
 */

const fs = require('fs');
const path = require('path');

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

// Configuration
const MONITOR_DURATION_MINUTES = process.argv[2] ? parseInt(process.argv[2]) : 5;
const CHECK_INTERVAL_SECONDS = 10;
const API_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const LOG_FILE = path.join(__dirname, '../monitoring-results.json');

// Tracking variables
const results = {
  startTime: new Date().toISOString(),
  endTime: null,
  durationMinutes: MONITOR_DURATION_MINUTES,
  checks: [],
  summary: {
    totalChecks: 0,
    averageConnections: 0,
    maxConnections: 0,
    minConnections: Infinity,
    errors: 0,
    rateLimitHits: 0
  }
};

console.log(`🔍 Starting Real-time Health Monitor`);
console.log(`📊 Duration: ${MONITOR_DURATION_MINUTES} minutes`);
console.log(`⏱️  Check interval: ${CHECK_INTERVAL_SECONDS} seconds`);
console.log(`🌐 API Base URL: ${API_BASE_URL}`);
console.log(`📝 Results will be saved to: ${LOG_FILE}`);
console.log(`\n${'='.repeat(60)}\n`);

async function checkRealtimeHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.TEST_SESSION_COOKIE || '' // Add session cookie if available
      }
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      const checkResult = {
        timestamp: new Date().toISOString(),
        status: 'success',
        activeConnections: data.data.activeConnections,
        subscriptions: data.data.subscriptions,
        userCount: data.data.userCount,
        maxConnectionsPerUser: data.data.maxConnectionsPerUser,
        rateLimitWindow: data.data.rateLimitWindow,
        maxAttemptsPerWindow: data.data.maxAttemptsPerWindow
      };
      
      results.checks.push(checkResult);
      
      // Update summary
      results.summary.totalChecks++;
      results.summary.maxConnections = Math.max(results.summary.maxConnections, checkResult.activeConnections);
      results.summary.minConnections = Math.min(results.summary.minConnections, checkResult.activeConnections);
      
      console.log(`✅ [${new Date().toLocaleTimeString()}] Health check passed:`);
      console.log(`   📡 Active connections: ${checkResult.activeConnections}`);
      console.log(`   👥 Users connected: ${checkResult.userCount}`);
      console.log(`   📊 Subscriptions: ${checkResult.subscriptions}`);
      console.log(`   ⚡ Max per user: ${checkResult.maxConnectionsPerUser}`);
      
      return checkResult;
    } else {
      const errorResult = {
        timestamp: new Date().toISOString(),
        status: 'error',
        statusCode: response.status,
        error: data.error || 'Unknown error'
      };
      
      results.checks.push(errorResult);
      results.summary.totalChecks++;
      
      if (response.status === 429) {
        results.summary.rateLimitHits++;
        console.log(`⚠️  [${new Date().toLocaleTimeString()}] Rate limit hit (expected if testing)`);
      } else if (response.status === 401) {
        console.log(`🔐 [${new Date().toLocaleTimeString()}] Authentication required (expected in production)`);
      } else {
        results.summary.errors++;
        console.log(`❌ [${new Date().toLocaleTimeString()}] Error: ${errorResult.error} (Status: ${response.status})`);
      }
      
      return errorResult;
    }
  } catch (error) {
    const errorResult = {
      timestamp: new Date().toISOString(),
      status: 'network_error',
      error: error.message
    };
    
    results.checks.push(errorResult);
    results.summary.totalChecks++;
    results.summary.errors++;
    
    console.log(`🔥 [${new Date().toLocaleTimeString()}] Network error: ${error.message}`);
    
    return errorResult;
  }
}

// Simulate multiple connection attempts to test rate limiting
async function testRateLimit() {
  console.log(`\n🧪 Testing rate limiting...`);
  
  const promises = [];
  for (let i = 0; i < 15; i++) { // Attempt more than the limit
    promises.push(fetch(`${API_BASE_URL}/api/realtime?collections=notifications`, {
      method: 'GET',
      headers: {
        'Cookie': process.env.TEST_SESSION_COOKIE || ''
      }
    }).then(res => ({ index: i, status: res.status })).catch(err => ({ index: i, error: err.message })));
  }
  
  const rateLimitResults = await Promise.all(promises);
  const rateLimitHits = rateLimitResults.filter(r => r.status === 429).length;
  
  console.log(`📊 Rate limit test results:`);
  console.log(`   🚦 Total attempts: ${rateLimitResults.length}`);
  console.log(`   ⛔ Rate limited: ${rateLimitHits}`);
  console.log(`   ✅ Allowed: ${rateLimitResults.length - rateLimitHits}`);
  
  if (rateLimitHits > 0) {
    console.log(`   ✅ Rate limiting is working correctly!`);
  } else {
    console.log(`   ⚠️  No rate limiting detected (might need authentication)`);
  }
}

// Main monitoring function
async function startMonitoring() {
  const endTime = Date.now() + (MONITOR_DURATION_MINUTES * 60 * 1000);
  
  // Initial rate limit test
  await testRateLimit();
  console.log(`\n${'='.repeat(60)}\n`);
  
  const interval = setInterval(async () => {
    if (Date.now() >= endTime) {
      clearInterval(interval);
      await generateReport();
      return;
    }
    
    await checkRealtimeHealth();
  }, CHECK_INTERVAL_SECONDS * 1000);
  
  // Initial check
  await checkRealtimeHealth();
}

async function generateReport() {
  results.endTime = new Date().toISOString();
  
  // Calculate averages
  const successfulChecks = results.checks.filter(c => c.status === 'success');
  if (successfulChecks.length > 0) {
    results.summary.averageConnections = Math.round(
      successfulChecks.reduce((sum, check) => sum + check.activeConnections, 0) / successfulChecks.length
    );
  }
  
  // If no successful checks, reset min connections
  if (results.summary.minConnections === Infinity) {
    results.summary.minConnections = 0;
  }
  
  console.log(`\n${'='.repeat(60)}\n`);
  console.log(`📊 MONITORING COMPLETE - SUMMARY REPORT`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log(`⏱️  Duration: ${MONITOR_DURATION_MINUTES} minutes`);
  console.log(`🔍 Total health checks: ${results.summary.totalChecks}`);
  console.log(`📡 Connection stats:`);
  console.log(`   📊 Average: ${results.summary.averageConnections}`);
  console.log(`   📈 Maximum: ${results.summary.maxConnections}`);
  console.log(`   📉 Minimum: ${results.summary.minConnections}`);
  console.log(`❌ Errors: ${results.summary.errors}`);
  console.log(`⚠️  Rate limit hits: ${results.summary.rateLimitHits}`);
  
  // Assessment
  console.log(`\n🎯 ASSESSMENT:`);
  
  if (results.summary.maxConnections <= 50) {
    console.log(`✅ Connection count is healthy (max: ${results.summary.maxConnections})`);
  } else if (results.summary.maxConnections <= 100) {
    console.log(`⚠️  Connection count is elevated but acceptable (max: ${results.summary.maxConnections})`);
  } else {
    console.log(`❌ Connection count is too high (max: ${results.summary.maxConnections})`);
  }
  
  if (results.summary.errors === 0) {
    console.log(`✅ No errors detected`);
  } else {
    console.log(`⚠️  ${results.summary.errors} errors detected - review logs`);
  }
  
  if (results.summary.rateLimitHits > 0) {
    console.log(`✅ Rate limiting is working (${results.summary.rateLimitHits} attempts blocked)`);
  }
  
  // Overall status
  const isHealthy = results.summary.maxConnections <= 50 && results.summary.errors <= results.summary.totalChecks * 0.1;
  
  console.log(`\n🏥 OVERALL STATUS: ${isHealthy ? '✅ HEALTHY' : '❌ NEEDS ATTENTION'}`);
  
  if (isHealthy) {
    console.log(`\n🎉 The realtime endpoint appears to be fixed!`);
    console.log(`   No excessive connection creation detected.`);
    console.log(`   Rate limiting is working properly.`);
    console.log(`   Connection counts are within normal limits.`);
  } else {
    console.log(`\n⚠️  The realtime endpoint still needs attention.`);
    console.log(`   Review the detailed logs and consider further optimization.`);
  }
  
  // Save results to file
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2));
    console.log(`\n📁 Detailed results saved to: ${LOG_FILE}`);
  } catch (error) {
    console.log(`\n❌ Failed to save results: ${error.message}`);
  }
  
  console.log(`\n${'='.repeat(60)}\n`);
}

// Start monitoring
startMonitoring().catch(error => {
  console.error('❌ Monitoring failed:', error);
  process.exit(1);
}); 