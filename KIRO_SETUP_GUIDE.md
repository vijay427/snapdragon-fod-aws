# Kiro Features Setup Guide for FOD Project

This guide walks you through setting up all Kiro features for the Snapdragon FOD system development.

## Prerequisites

1. **Install uv and uvx** (for Python-based MCP servers):
   ```bash
   # Windows (PowerShell)
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

2. **Install Node.js** (for custom MCP server):
   - Download from https://nodejs.org/ (v18 or higher)

3. **Set up environment variables**:
   ```bash
   # GitHub Personal Access Token (for GitHub MCP)
   $env:GITHUB_TOKEN = "your_github_token_here"
   
   # MongoDB Connection String (for MongoDB MCP)
   $env:MONGODB_CONNECTION_STRING = "mongodb+srv://user:pass@cluster.mongodb.net/fod_db"
   ```

## 1. Agent Hooks Setup

Agent hooks are already configured in `.kiro/hooks/`. They will automatically:

### ✅ Configured Hooks:

1. **test-lambda-functions.json**: Auto-run tests when Lambda functions are modified
2. **validate-feature-logic.json**: Validate changes against requirements
3. **restart-simulator.json**: Restart simulator when simulator code changes
4. **auto-push-to-github.json**: Auto-push commits to GitHub

### Activate Hooks:

1. Open Kiro Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Search for "Kiro: Open Agent Hooks"
3. Enable the hooks you want to use
4. Hooks will trigger automatically based on their configuration

## 2. Steering Files Setup

Steering files are already created in `.kiro/steering/`. They provide persistent context:

### ✅ Configured Steering Files:

1. **coding-standards.md**: TypeScript/Python coding patterns and error handling
2. **aws-security-standards.md**: AWS resource creation and security requirements
3. **qualcomm-car-to-cloud-sdk.md**: Car-to-Cloud SDK API reference

These files are automatically included in all Kiro conversations (inclusion: always).

## 3. MCP Servers Setup

### A. GitHub MCP Server

**Purpose**: Sync code to GitHub, manage issues, track bugs, review PRs

**Setup:**
1. Create GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `repo`, `workflow`, `write:packages`
   
2. Set environment variable:
   ```powershell
   $env:GITHUB_TOKEN = "ghp_your_token_here"
   ```

3. The server is already configured in `.kiro/settings/mcp.json`

4. Restart Kiro or reconnect MCP servers

**Usage:**
```
"Create a GitHub issue for implementing 5G connectivity activation"
"List all open issues in the FOD repository"
"Create a pull request for the feature activation logic"
```

### B. MongoDB MCP Server

**Purpose**: Connect to MongoDB database and update feature subscription status

**Setup:**
1. Get MongoDB connection string from MongoDB Atlas
   
2. Set environment variable:
   ```powershell
   $env:MONGODB_CONNECTION_STRING = "mongodb+srv://username:password@cluster.mongodb.net/fod_db"
   ```

3. The server is already configured in `.kiro/settings/mcp.json`

4. Restart Kiro or reconnect MCP servers

**Usage:**
```
"Query all active feature subscriptions from MongoDB"
"Update subscription status for vehicle VIN1234567890"
"Insert a new feature activation record"
```

### C. Snapdragon Simulator MCP Server (Custom)

**Purpose**: Control simulator, test feature activations, inspect logs

**Setup:**
1. Install dependencies:
   ```bash
   cd mcp-servers/snapdragon-simulator
   npm install
   npm run build
   ```

2. Update `.kiro/settings/mcp.json` to add:
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

3. Restart Kiro or reconnect MCP servers

**Usage:**
```
"Get the current state of vehicle VIN1234567890"
"Activate SPORT_MODE on vehicle VIN1234567890 for 48 hours"
"Advance time by 50 hours for vehicle VIN1234567890"
"Show activation logs for vehicle VIN1234567890"
```

### D. Jira MCP Server (Optional)

**Purpose**: Update Jira task/bug status

**Setup:**
1. Install Jira MCP server:
   ```bash
   uvx mcp-server-jira
   ```

2. Add to `.kiro/settings/mcp.json`:
   ```json
   {
     "mcpServers": {
       "jira": {
         "command": "uvx",
         "args": ["mcp-server-jira"],
         "env": {
           "JIRA_URL": "https://your-domain.atlassian.net",
           "JIRA_EMAIL": "your-email@example.com",
           "JIRA_API_TOKEN": "your_jira_api_token"
         },
         "disabled": false,
         "autoApprove": ["get_issue", "update_issue", "transition_issue"]
       }
     }
   }
   ```

3. Get Jira API token from: https://id.atlassian.com/manage-profile/security/api-tokens

**Usage:**
```
"Update Jira ticket FOD-123 status to In Progress"
"Get details of Jira issue FOD-456"
"Transition Jira ticket FOD-789 to Done"
```

## 4. Verification

### Test Agent Hooks:
1. Modify a file in `lambda/` directory
2. Check if tests run automatically
3. Check terminal output for hook execution

### Test Steering Files:
1. Ask Kiro: "What are the coding standards for this project?"
2. Ask Kiro: "How should I create AWS Lambda functions?"
3. Verify Kiro references the steering files

### Test MCP Servers:
1. **GitHub**: "List issues in this repository"
2. **MongoDB**: "Query the features collection"
3. **Simulator**: "Get state of vehicle VIN1234567890"
4. **Jira**: "Get Jira issue FOD-123"

## 5. Troubleshooting

### MCP Server Not Working:
1. Check MCP Server view in Kiro sidebar
2. Look for connection errors
3. Verify environment variables are set
4. Try reconnecting: Command Palette → "Kiro: Reconnect MCP Servers"

### Agent Hook Not Triggering:
1. Verify hook is enabled in Agent Hooks view
2. Check file pattern matches your file
3. Look at Kiro output panel for errors

### Steering File Not Applied:
1. Verify file is in `.kiro/steering/` directory
2. Check front-matter has `inclusion: always`
3. Restart Kiro if needed

## 6. Workflow Integration

### Development Workflow with Kiro Features:

1. **Start Development**:
   - Kiro reads steering files for coding standards
   - Simulator MCP provides vehicle state

2. **Write Code**:
   - Agent hooks validate against requirements
   - Agent hooks run tests automatically

3. **Test Features**:
   - Use simulator MCP to activate features
   - Advance time to test expirations
   - Check logs for debugging

4. **Commit & Deploy**:
   - Agent hook auto-pushes to GitHub
   - GitHub MCP creates issues for bugs
   - Jira MCP updates task status

5. **Monitor**:
   - MongoDB MCP queries subscription status
   - Simulator MCP inspects activation logs

## Next Steps

1. ✅ Verify all MCP servers are connected
2. ✅ Enable desired agent hooks
3. ✅ Test simulator with sample vehicle
4. ✅ Continue to design phase of spec workflow

Ready to proceed with the design phase!
