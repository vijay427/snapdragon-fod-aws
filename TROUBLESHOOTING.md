# Troubleshooting Kiro Features

## Issue 1: Agent Hooks Not Visible

### Solution Steps:

1. **Access Agent Hooks UI**:
   - Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
   - Type: "Kiro: Open Agent Hooks"
   - Press Enter

2. **Alternative Access**:
   - Look for the Kiro icon in the left sidebar
   - Click on it to open the Kiro panel
   - Look for "Agent Hooks" section
   - If not visible, try restarting Kiro

3. **Verify Hook Files**:
   - Hooks are located in `.kiro/hooks/` directory
   - Each hook is a JSON file
   - Files should have proper JSON format

4. **Manual Hook Verification**:
   ```bash
   # Check if hooks directory exists
   dir .kiro\hooks
   
   # Should show:
   # - auto-push-to-github.json
   # - restart-simulator.json
   # - test-lambda-functions.json
   # - validate-feature-logic.json
   ```

5. **If Still Not Visible**:
   - Restart Kiro completely
   - Check Kiro version (hooks require recent version)
   - Check Kiro output panel for errors

## Issue 2: MCP Servers Not Connecting

### Root Causes:
1. Missing `uv` and `uvx` installation
2. Environment variables not set
3. MCP server packages not available
4. Network/firewall issues

### Solution Steps:

### Step 1: Install uv/uvx (Required!)

**Windows PowerShell (Run as Administrator):**
```powershell
# Install uv
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Verify installation
uv --version
uvx --version
```

**If installation fails:**
- Try using pip: `pip install uv`
- Or download from: https://github.com/astral-sh/uv/releases

### Step 2: Start with Simple MCP Server

I've configured a basic filesystem MCP server that should work immediately:

1. **Check MCP Configuration**:
   - File: `.kiro/settings/mcp.json`
   - Should contain filesystem server config

2. **Test MCP Connection**:
   - Open Kiro
   - Look for "MCP Servers" in the Kiro sidebar
   - You should see "filesystem" server
   - Status should be "Connected" (green)

3. **If Not Connected**:
   - Check Kiro Output panel (View → Output → Select "Kiro MCP")
   - Look for error messages
   - Common errors:
     - "uvx not found" → Install uv/uvx
     - "Permission denied" → Run as administrator
     - "Module not found" → uvx will auto-install on first use

### Step 3: Test MCP Server

Once connected, test it:
```
Ask Kiro: "List files in the current directory using MCP"
```

If this works, the MCP system is functioning!

### Step 4: Add More MCP Servers (Optional)

After filesystem works, you can add others one at a time:

**Add GitHub MCP:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "uvx",
      "args": ["mcp-server-filesystem", "."],
      "disabled": false
    },
    "github": {
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      },
      "disabled": false
    }
  }
}
```

**Important**: Replace `your_token_here` with actual GitHub token from:
https://github.com/settings/tokens

### Step 5: Reconnect MCP Servers

After any config change:
1. Press `Ctrl+Shift+P`
2. Type: "Kiro: Reconnect MCP Servers"
3. Press Enter
4. Check MCP Servers panel for status

## Issue 3: Steering Files Not Visible

### Solution:

Steering files should be visible in the Kiro panel under "Agent Steering".

**Verify:**
1. Open Kiro sidebar (click Kiro icon)
2. Look for "Agent Steering" section
3. Should show:
   - aws-security-standards.md
   - coding-standards.md
   - qualcomm-car-to-cloud-sdk.md

**If not visible:**
- Check files exist in `.kiro/steering/`
- Verify front-matter in each file has `inclusion: always`
- Restart Kiro

## Quick Diagnostic Commands

Run these in PowerShell to verify setup:

```powershell
# Check if uv is installed
uv --version

# Check if uvx is installed
uvx --version

# List .kiro directory structure
tree .kiro /F

# Check if hooks exist
dir .kiro\hooks

# Check if steering files exist
dir .kiro\steering

# Check MCP config
type .kiro\settings\mcp.json
```

## Common Error Messages

### "uvx: command not found"
**Solution**: Install uv/uvx (see Step 1 above)

### "GITHUB_TOKEN not set"
**Solution**: Either:
1. Set environment variable: `$env:GITHUB_TOKEN = "your_token"`
2. Or hardcode in mcp.json (not recommended for security)

### "Permission denied"
**Solution**: Run PowerShell as Administrator

### "Module not found: mcp-server-*"
**Solution**: uvx will auto-download on first use. Wait a moment and try reconnecting.

## Still Having Issues?

1. **Check Kiro Version**:
   - Help → About
   - Ensure you have latest version

2. **Check Kiro Output Panel**:
   - View → Output
   - Select "Kiro" or "Kiro MCP" from dropdown
   - Look for error messages

3. **Restart Kiro**:
   - Close completely
   - Reopen
   - Check if issues persist

4. **Minimal Test**:
   - Create new empty workspace
   - Add only filesystem MCP
   - See if it connects
   - If yes, issue is with project config
   - If no, issue is with Kiro/system setup

## Next Steps After Fixing

Once MCP servers are connected:
1. ✅ Test filesystem MCP: "List files in current directory"
2. ✅ Verify steering files are visible
3. ✅ Check agent hooks UI is accessible
4. ✅ Proceed to design phase

## Contact Points

If issues persist:
- Check Kiro documentation
- Check Kiro community forums
- Verify system requirements are met
