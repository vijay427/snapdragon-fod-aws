#!/usr/bin/env node

// Simple script to test the Snapdragon Simulator MCP server
const { spawn } = require('child_process');

const vehicleId = process.argv[2] || 'TEST_VIN_1232';
const action = process.argv[3] || 'get_vehicle_state';

console.log(`Testing Snapdragon Simulator: ${action} for vehicle ${vehicleId}\n`);

// Start the MCP server
const server = spawn('node', ['./mcp-servers/snapdragon-simulator/dist/index.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseData = '';

server.stdout.on('data', (data) => {
  responseData += data.toString();
});

server.stderr.on('data', (data) => {
  const msg = data.toString();
  if (!msg.includes('running on stdio')) {
    console.error('Server error:', msg);
  }
});

// Wait for server to start
setTimeout(() => {
  // Send the MCP request
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: action,
      arguments: { vehicleId }
    }
  };

  server.stdin.write(JSON.stringify(request) + '\n');

  // Wait for response
  setTimeout(() => {
    server.kill();
    
    try {
      // Parse the response
      const lines = responseData.split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          if (response.result && response.result.content) {
            const content = response.result.content[0].text;
            console.log('Vehicle State:');
            console.log('='.repeat(50));
            const state = JSON.parse(content);
            console.log(JSON.stringify(state, null, 2));
            console.log('='.repeat(50));
            
            // Show available features
            console.log('\n📋 Available Features in Simulator:');
            console.log('  - CONNECTIVITY_5G: Upgrade from 4G to 5G');
            console.log('  - SPORT_MODE: Enable sport performance mode');
            console.log('  - PREMIUM_AUDIO: Premium audio system');
            console.log('  - AUTOPILOT: Autonomous driving features');
            
            console.log('\n🎯 Current Vehicle Status:');
            console.log(`  - Connectivity: ${state.connectivityTier}`);
            console.log(`  - Performance Mode: ${state.performanceMode}`);
            console.log(`  - Active Features: ${state.activeFeatures.length > 0 ? state.activeFeatures.map(f => f.featureId).join(', ') : 'None'}`);
            console.log(`  - Simulated Time: ${state.simulatedTime}`);
          }
        } catch (e) {
          // Skip non-JSON lines
        }
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
      console.log('Raw response:', responseData);
    }
  }, 1000);
}, 500);
