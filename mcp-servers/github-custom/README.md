# GitHub Custom MCP Server

Custom Node.js-based GitHub MCP server built to avoid Python encoding issues on Windows.

## Features

- **List Repositories**: View all accessible repositories
- **Create Repository**: Create new GitHub repositories
- **List Issues**: View issues in a repository
- **Create Issue**: Create new issues
- **Update Issue**: Update existing issues (title, body, state)
- **Create Pull Request**: Create new pull requests
- **Get User Info**: Get authenticated user information

## Installation

```bash
cd mcp-servers/github-custom
npm install
npm run build
```

## Configuration

Already configured in `.kiro/settings/mcp.json`:

```json
{
  "github": {
    "command": "node",
    "args": ["./mcp-servers/github-custom/dist/index.js"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
    },
    "disabled": false
  }
}
```

## Available Tools

### list_repositories
List repositories accessible to the authenticated user.

**Parameters:**
- `type` (optional): all, owner, public, private, member (default: owner)
- `sort` (optional): created, updated, pushed, full_name (default: updated)
- `limit` (optional): Maximum number to return (default: 30)

**Example:**
```
"List my GitHub repositories"
"Show my 10 most recently updated repositories"
```

### create_repository
Create a new GitHub repository.

**Parameters:**
- `name` (required): Repository name
- `description` (optional): Repository description
- `private` (optional): Whether private (default: false)
- `autoInit` (optional): Initialize with README (default: true)

**Example:**
```
"Create a new GitHub repository called 'snapdragon-fod-system' with description 'Feature on Demand system for Snapdragon Digital Chassis'"
```

### list_issues
List issues in a repository.

**Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `state` (optional): open, closed, all (default: open)
- `limit` (optional): Maximum number to return (default: 30)

**Example:**
```
"List open issues in owner/repo"
"Show all closed issues in my-org/my-repo"
```

### create_issue
Create a new issue in a repository.

**Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `title` (required): Issue title
- `body` (optional): Issue description
- `labels` (optional): Array of label names

**Example:**
```
"Create an issue in owner/repo titled 'Implement 5G connectivity activation' with label 'enhancement'"
```

### update_issue
Update an existing issue.

**Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `issueNumber` (required): Issue number
- `title` (optional): New title
- `body` (optional): New body
- `state` (optional): open or closed

**Example:**
```
"Close issue #5 in owner/repo"
"Update issue #10 in owner/repo with new title 'Fixed: 5G activation'"
```

### create_pull_request
Create a new pull request.

**Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `title` (required): PR title
- `body` (optional): PR description
- `head` (required): Source branch
- `base` (optional): Target branch (default: main)

**Example:**
```
"Create a pull request in owner/repo from feature-branch to main titled 'Add sport mode activation'"
```

### get_user_info
Get information about the authenticated user.

**Example:**
```
"Show my GitHub user information"
"What's my GitHub username?"
```

## Advantages Over Python MCP

1. ✅ **No encoding issues** - Works perfectly on Windows
2. ✅ **Faster startup** - Node.js starts quicker than Python
3. ✅ **Consistent with Snapdragon simulator** - Same tech stack
4. ✅ **Easy to extend** - Add more GitHub API features as needed

## Testing

Once connected, test with:
```
"Show my GitHub user information"
"List my repositories"
```
