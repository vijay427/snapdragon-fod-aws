# 🎣 Kiro Agent Hooks for Snapdragon FOD System

This directory contains Kiro agent hooks that automate various development and deployment workflows using Kiro's MCP (Model Context Protocol) servers.

## 🚀 **Activation Handler CI/CD Hooks**

### **Automatic Deployment Hook**
- **File**: `activation-handler-cicd.kiro.hook`
- **Trigger**: When files in `src/lambda/activation-handler/` are saved
- **Purpose**: Automatically deploys activation handler using Kiro MCP servers
- **Features**:
  - Code quality validation (build, lint, test)
  - Git operations (commit, push)
  - AWS deployment via MCP
  - Health checks and verification
  - GitHub issue creation for documentation
  - Snapdragon simulator testing

### **Manual Deployment Hook**
- **File**: `manual-activation-deploy.kiro.hook`
- **Trigger**: User-triggered (manual)
- **Purpose**: On-demand activation handler deployment
- **Features**:
  - Pre-deployment assessment
  - Interactive deployment confirmation
  - Real-time monitoring
  - Comprehensive health reporting
  - Post-deployment testing

## 🔧 **How Kiro Agent Hooks Work**

### **Traditional CI/CD vs Kiro Agent Hooks**

**Traditional CI/CD:**
```
Code Change → Git Push → GitHub Actions → AWS Deployment
```

**Kiro Agent Hooks:**
```
Code Change → Kiro Hook Trigger → Agent Execution → MCP Server Operations → AWS Deployment
```

### **Key Advantages of Kiro Agent Hooks:**

1. **🤖 AI-Powered**: Intelligent decision making during deployment
2. **🔌 MCP Integration**: Direct access to AWS, GitHub, and Simulator services
3. **📊 Real-time Monitoring**: Live feedback and status updates
4. **🧪 Integrated Testing**: Automatic testing with Snapdragon simulator
5. **📋 Auto-Documentation**: Automatic GitHub issue creation and tracking
6. **🚨 Smart Error Handling**: Intelligent error detection and remediation
7. **🎯 Context-Aware**: Understands your codebase and makes smart decisions

## 🎯 **Using the Activation Handler CI/CD**

### **Automatic Deployment (Recommended)**
1. Edit `src/lambda/activation-handler/index.ts`
2. Save the file
3. Kiro hook automatically triggers
4. Agent executes the full CI/CD pipeline
5. Deployment completes with full documentation

### **Manual Deployment**
1. Use Kiro command palette or hook trigger
2. Select "Manual: Deploy Activation Handler"
3. Follow the interactive deployment process
4. Agent guides you through each step

## 🔍 **MCP Servers Used**

### **AWS Operations MCP**
- Lambda function management
- CloudWatch monitoring
- Stack status checking
- Deployment verification

### **GitHub MCP**
- Issue creation and management
- Repository operations
- Documentation updates
- Deployment tracking

### **Snapdragon Simulator MCP**
- Activation flow testing
- Vehicle state verification
- Integration testing
- Performance validation

## 📊 **Hook Status**

| Hook Name | Status | Purpose | Trigger |
|-----------|--------|---------|---------|
| `activation-handler-cicd` | ✅ Active | Auto-deploy activation handler | File save |
| `manual-activation-deploy` | ✅ Active | Manual deployment | User trigger |
| `trigger-cicd-pipeline` | ❌ Disabled | Legacy CI/CD | File save |
| `smart-deployment-workflow` | ✅ Active | General deployment | User trigger |
| `quick-lambda-health-check` | ✅ Active | Health monitoring | User trigger |

## 🎮 **How to Use**

### **Enable/Disable Hooks**
Edit the hook file and change `"enabled": true/false`

### **Modify Hook Behavior**
Edit the `"prompt"` section in the hook file to customize the workflow

### **Create New Hooks**
Copy an existing hook and modify:
- `name`: Display name
- `description`: What the hook does
- `when`: Trigger conditions
- `then.prompt`: Workflow instructions

## 🚨 **Troubleshooting**

### **Hook Not Triggering**
1. Check `"enabled": true` in hook file
2. Verify file pattern matches your changes
3. Ensure Kiro agent is active

### **MCP Server Errors**
1. Check MCP server configuration in Kiro settings
2. Verify AWS credentials are configured
3. Ensure GitHub token has proper permissions

### **Deployment Failures**
1. Check code quality (build, lint, test)
2. Verify AWS permissions
3. Check GitHub Actions workflow status
4. Review CloudWatch logs

## 🎯 **Best Practices**

1. **Always test locally** before triggering deployment hooks
2. **Review changes** before confirming deployment
3. **Monitor CloudWatch logs** after deployment
4. **Keep hooks updated** with your workflow changes
5. **Use descriptive commit messages** for better tracking

## 🔮 **Future Enhancements**

- **Multi-environment deployment** hooks
- **Rollback automation** hooks
- **Performance monitoring** hooks
- **Security scanning** integration
- **Automated testing** expansion

## 📞 **Support**

If you encounter issues with the hooks:
1. Check the hook execution logs in Kiro
2. Verify MCP server status
3. Review AWS and GitHub permissions
4. Check the troubleshooting section above

---

**🎉 Your activation handler now has intelligent, AI-powered CI/CD through Kiro agent hooks!**