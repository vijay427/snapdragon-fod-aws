# Quick Start Guide - Kiro Features for FOD

## 🚀 Quick Setup (5 minutes)

### 1. Run Setup Script
```powershell
# In PowerShell, from project root:
.\setup-kiro-features.ps1
```

### 2. Install uv (if not installed)
```powershell
# Run in PowerShell as Administrator:
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Verify:
uv --version
```

### 3. Restart Kiro
- Close Kiro completely
- Reopen your workspace

### 4. Reconnect MCP Servers
- Press `Ctrl+Shift+P`
- Type: "Kiro: Reconnect MCP Servers"
- Press Enter

### 5. Verify Setup

**Check Steering Files:**
- Click Kiro icon in left sidebar
- Look for "Agent Steering" section
- Should show 3 files:
  - ✅ aws-security-standards.md
  - ✅ coding-standards.md
  - ✅ qualcomm-car-to-cloud-sdk.md

**Check MCP Servers:**
- In Kiro sidebar, look for "MCP Servers"
- Should show "filesystem" with green status
- If red, check TROUBLESHOOTING.md

**Check Agent Hooks:**
- Press `Ctrl+Shift+P`
- Type: "Kiro: Open Agent Hooks"
- Should show 4 hooks available

## 🎯 What Each Feature Does

### Agent Steering Files (Always Active)
These provide context to Kiro automatically:

1. **coding-standards.md**
   - TypeScript/Python coding patterns
   - Error handling best practices
   - Testing guidelines

2. **aws-security-standards.md**
   - AWS resource creation rules
   - Security requirements
   - IAM and encryption standards

3. **qualcomm-car-to-cloud-sdk.md**
   - Car-to-Cloud SDK API reference
   - Message formats and examples
   - Integration patterns

**Usage**: Just ask Kiro questions! It will reference these automatically.
- "How should I handle errors in Lambda functions?"
- "What are the security requirements for AWS resources?"
- "Show me the format for feature activation messages"

### Agent Hooks (Trigger Automatically)

1. **test-lambda-functions**
   - Triggers: When you save files in `lambda/` directory
   - Action: Runs unit tests automatically

2. **validate-feature-logic**
   - Triggers: When you save files in `feature-activation/` directory
   - Action: Validates changes against requirements

3. **restart-simulator**
   - Triggers: When you save files in `simulator/` directory
   - Action: Restarts the simulator process

4. **auto-push-to-github**
   - Triggers: When you commit changes
   - Action: Automatically pushes to GitHub

**Enable/Disable**: Use Command Palette → "Kiro: Open Agent Hooks"

### MCP Servers (Query External Systems)

**Filesystem MCP** (Currently configured):
```
"List all TypeScript files in the lambda directory"
"Read the contents of package.json"
```

**To Add More** (see KIRO_SETUP_GUIDE.md):
- GitHub MCP: Manage issues and PRs
- MongoDB MCP: Query database
- Custom Simulator MCP: Control vehicle simulator

## 🧪 Test Your Setup

### Test 1: Steering Files
Ask Kiro:
```
"What are the coding standards for this project?"
```
Expected: Kiro references coding-standards.md

### Test 2: MCP Server
Ask Kiro:
```
"List files in the .kiro directory"
```
Expected: Kiro uses filesystem MCP to list files

### Test 3: Agent Hooks
1. Create a file: `lambda/test.ts`
2. Save it
3. Check if hook triggers (look at terminal output)

## 📋 Common Commands

### Access Kiro Features
```
Ctrl+Shift+P → "Kiro: Open Agent Hooks"
Ctrl+Shift+P → "Kiro: Reconnect MCP Servers"
Ctrl+Shift+P → "Kiro: Show MCP Logs"
```

### Check Status
```powershell
# Verify uv installation
uv --version

# Check directory structure
tree .kiro /F

# View MCP config
type .kiro\settings\mcp.json
```

## ❌ Troubleshooting

### MCP Servers Not Connecting
1. Install uv: `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`
2. Restart Kiro
3. Reconnect MCP servers
4. Check Kiro Output panel for errors

### Agent Hooks Not Visible
1. Press `Ctrl+Shift+P`
2. Type: "Kiro: Open Agent Hooks"
3. If still not visible, restart Kiro

### Steering Files Not Showing
1. Verify files exist in `.kiro/steering/`
2. Check front-matter has `inclusion: always`
3. Restart Kiro

**Full troubleshooting guide**: See TROUBLESHOOTING.md

## 📚 Documentation Files

- **QUICK_START.md** (this file): Fast setup and testing
- **KIRO_SETUP_GUIDE.md**: Detailed setup for all features
- **TROUBLESHOOTING.md**: Fix common issues
- **setup-kiro-features.ps1**: Automated setup script

## ✅ Ready to Proceed?

Once you verify:
- ✅ Steering files visible in Kiro sidebar
- ✅ At least one MCP server connected (filesystem)
- ✅ Agent hooks accessible via Command Palette

You're ready to move to the **Design Phase**!

## 🎓 Learning More

### Ask Kiro About:
- "Explain the Car-to-Cloud SDK message format"
- "What security standards should I follow for AWS Lambda?"
- "Show me error handling patterns for TypeScript"

### Use MCP:
- "List all files in the specs directory"
- "Show me the requirements document"

### Hooks in Action:
- Save a Lambda function → Tests run automatically
- Commit code → Auto-pushes to GitHub

---

**Need help?** Check TROUBLESHOOTING.md or ask Kiro!
