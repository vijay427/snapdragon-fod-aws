# Snapdragon Simulator MCP Server

Custom MCP server for simulating Qualcomm Snapdragon Digital Chassis behavior in the FOD system.

## Features

- **Vehicle State Management**: Track connectivity tier, performance mode, and active features
- **Feature Activation/Deactivation**: Simulate feature activations with time-limited support
- **Time Progression**: Fast-forward simulator time to test feature expirations
- **Activation Logs**: Inspect all activation/deactivation events
- **Multiple Vehicles**: Support multiple simulated vehicles simultaneously

## Installation

```bash
cd mcp-servers/snapdragon-simulator
npm install
npm run build
```

## Configuration

Add to your `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "snapdragon-simulator": {
      "command": "node",
      "args": ["./mcp-servers/snapdragon-simulator/dist/index.js"],
      "disabled": false,
      "autoApprove": [
        "get_vehicle_state",
        "activate_feature",
        "deactivate_feature",
        "advance_time",
        "get_activation_logs"
      ]
    }
  }
}
```

## Available Tools

### get_vehicle_state
Get current state of a simulated vehicle.

**Parameters:**
- `vehicleId` (string): Vehicle identifier

**Example:**
```
Get the state of vehicle VIN1234567890
```

### activate_feature
Simulate feature activation.

**Parameters:**
- `vehicleId` (string): Vehicle identifier
- `featureId` (string): Feature to activate (CONNECTIVITY_5G, SPORT_MODE, etc.)
- `duration` (number, optional): Duration in hours for time-limited features

**Example:**
```
Activate SPORT_MODE on vehicle VIN1234567890 for 48 hours
```

### deactivate_feature
Simulate feature deactivation.

**Parameters:**
- `vehicleId` (string): Vehicle identifier
- `featureId` (string): Feature to deactivate

### advance_time
Fast-forward simulator time.

**Parameters:**
- `vehicleId` (string): Vehicle identifier
- `hours` (number): Hours to advance

**Example:**
```
Advance time by 50 hours for vehicle VIN1234567890 to test sport mode expiration
```

### get_activation_logs
Get activation/deactivation history.

**Parameters:**
- `vehicleId` (string): Vehicle identifier
- `limit` (number, optional): Max entries to return (default: 50)

### reset_vehicle
Reset vehicle to default state.

**Parameters:**
- `vehicleId` (string): Vehicle identifier

## Usage Examples

### Test 5G Connectivity Upgrade
```
1. Get initial state: get_vehicle_state for VIN1234567890
2. Activate 5G: activate_feature CONNECTIVITY_5G on VIN1234567890
3. Verify state: get_vehicle_state for VIN1234567890
```

### Test Sport Mode Weekend Rental
```
1. Activate sport mode: activate_feature SPORT_MODE on VIN1234567890 for 48 hours
2. Check state: get_vehicle_state for VIN1234567890
3. Fast forward: advance_time by 50 hours for VIN1234567890
4. Verify expiration: get_vehicle_state for VIN1234567890 (should show COMFORT mode)
```

### Debug Activation Issues
```
1. Get logs: get_activation_logs for VIN1234567890
2. Review activation history and status codes
```
