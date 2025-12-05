# Agent Hooks Guide

This directory contains Agent Hooks that combine automation with AI intelligence using MCP servers.

## 🎯 Understanding Hooks + MCP Servers

### Simple Hooks (Command Only)
- **Auto Push to GitHub**: Runs `git push origin HEAD`
- **Restart Simulator**: Runs `npm run simulator:restart`
- **Test Lambda Functions**: Runs `npm test`

### Smart Hooks (AI + MCP Servers)
These hooks ask Kiro AI to perform intelligent actions using MCP server tools.

---

## 📋 Available Smart Hooks

### 1. **Smart Commit and Create PR** 🚀
**Trigger**: Manual button click
**What it does**:
- AI reviews your changes
- Generates a conventional commit message
- Creates a GitHub PR with detailed description
- Uses: GitHub MCP Server

**Use case**: "I finished a feature, create a PR for me"

---

### 2. **Create GitHub Issue from TODO** 📝
**Trigger**: When you edit source files
**What it does**:
- Scans for new TODO/FIXME comments
- Asks if you want to create an issue
- Creates GitHub issue with context
- Uses: GitHub MCP Server

**Use case**: Automatic issue tracking from code comments

---

### 3. **Deployment Notification** 🚀
**Trigger**: When infrastructure code changes
**What it does**:
- Monitors deployment status
- Creates deployment record in GitHub
- Documents changes and outputs
- Uses: AWS Operations MCP + GitHub MCP

**Use case**: Maintain deployment history

---

### 4. **Request AI Code Review** 🔍
**Trigger**: Manual button click
**What it does**:
- Reviews your code changes
- Identifies issues (security, performance, quality)
- Creates GitHub issues for problems found
- Uses: GitHub MCP Server

**Use case**: "Review my code before I commit"

---

### 5. **Sync Spec Tasks with GitHub** 📊
**Trigger**: When tasks.md is updated
**What it does**:
- Reads new tasks from spec
- Creates GitHub issues for each task
- Links to requirements and milestones
- Uses: GitHub MCP Server

**Use case**: Keep GitHub issues in sync with specs

---

### 6. **Smart Deployment Workflow** 🎯
**Trigger**: Manual button click
**What it does**:
- Complete deployment orchestration
- Tests → Deploy → Verify → Document
- Uses: AWS Operations MCP + GitHub MCP

**Use case**: "Deploy everything and document it"

---

## 🔄 How Hooks + MCP Servers Work Together

```
┌─────────────────┐
│  You Click Hook │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Hook Triggers  │
│  "askAgent"     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Kiro AI       │
│   Analyzes      │
│   Request       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Decides to  │
│  Use MCP Tools  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  MCP Servers Execute:       │
│  - GitHub API calls         │
│  - AWS operations           │
│  - File operations          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  AI Reports     │
│  Results to You │
└─────────────────┘
```

---

## 🎮 How to Use These Hooks

### Method 1: Via Sidebar
1. Look for "Agent Hooks" panel in IDE sidebar
2. Find the hook you want to use
3. Click the "Start Hook" button

### Method 2: Via Command Palette
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
2. Type "Kiro Hook"
3. Select the hook to run

---

## 💡 Creating Your Own Smart Hooks

### Template for AI-Powered Hook:
```json
{
  "enabled": true,
  "name": "Your Hook Name",
  "description": "What it does",
  "version": "1",
  "when": {
    "type": "userTriggered"  // or "fileEdited"
  },
  "then": {
    "type": "askAgent",
    "prompt": "Tell Kiro AI what to do. Be specific about:\n1. What to analyze\n2. Which MCP servers to use\n3. What actions to take\n4. What to report back"
  }
}
```

### Available MCP Servers to Use:
- **GitHub MCP**: Create issues, PRs, repos, list repos
- **AWS Operations MCP**: Check stacks, Lambda metrics, deployments
- **Snapdragon Simulator MCP**: Test vehicle features
- **Filesystem MCP**: Read/write files

---

## 🔧 Troubleshooting

### Hook doesn't trigger:
- Check if hook is enabled (`"enabled": true`)
- Verify file patterns match your files
- Check Kiro output panel for errors

### AI doesn't use MCP server:
- Ensure MCP server is configured in `.kiro/settings/mcp.json`
- Check if MCP server is running (not disabled)
- Verify authentication (tokens, credentials)

### Hook runs but nothing happens:
- Check terminal output for command execution
- Look for AI response in chat
- Verify MCP server tools are auto-approved

---

## 📚 Examples

### Example 1: Quick PR Creation
1. Make code changes
2. Click "Smart Commit and Create PR" hook
3. AI reviews changes and suggests commit message
4. Confirm, and AI creates PR with description

### Example 2: Deployment with Documentation
1. Update infrastructure code
2. Click "Smart Deployment Workflow" hook
3. AI tests, deploys, verifies, and documents
4. GitHub issue created with deployment details

### Example 3: Automatic Issue Tracking
1. Add `// TODO: Fix this bug` in code
2. Save file (hook triggers automatically)
3. AI finds TODO and asks if you want an issue
4. Confirm, and GitHub issue is created

---

## 🎯 Best Practices

1. **Be Specific in Prompts**: Tell AI exactly what you want
2. **Use Auto-Approve**: Add frequently used tools to autoApprove list
3. **Test Hooks**: Try hooks on small changes first
4. **Review AI Actions**: Always review what AI plans to do
5. **Combine Hooks**: Use multiple hooks for complex workflows

---

## 🚀 Next Steps

1. Try the "Smart Commit and Create PR" hook
2. Customize prompts to match your workflow
3. Create your own hooks for repetitive tasks
4. Share useful hooks with your team

---

**Remember**: Hooks are automation, MCP Servers are AI superpowers. Together, they make you incredibly productive!
