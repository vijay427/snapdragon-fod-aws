# Filesystem Custom MCP Server

Custom Node.js-based Filesystem MCP server built to avoid Python encoding issues on Windows.

## Features

- **Read File**: Read contents of any file in workspace
- **Write File**: Create or overwrite files
- **List Directory**: List directory contents (with recursive option)
- **Create Directory**: Create new directories
- **Delete File**: Delete files
- **File Exists**: Check if file/directory exists
- **Get File Info**: Get detailed file/directory information

## Installation

```bash
cd mcp-servers/filesystem-custom
npm install
npm run build
```

## Available Tools

### read_file
Read the contents of a file.

**Parameters:**
- `path` (required): Path relative to workspace root

**Example:**
```
"Read the file .kiro/specs/snapdragon-fod-aws/requirements.md"
```

### write_file
Write content to a file (creates or overwrites).

**Parameters:**
- `path` (required): Path relative to workspace root
- `content` (required): Content to write

**Example:**
```
"Write 'Hello World' to test.txt"
```

### list_directory
List contents of a directory.

**Parameters:**
- `path` (required): Path relative to workspace root
- `recursive` (optional): List recursively (default: false)

**Example:**
```
"List files in .kiro directory"
"List all files in mcp-servers recursively"
```

### create_directory
Create a new directory.

**Parameters:**
- `path` (required): Path relative to workspace root

**Example:**
```
"Create directory src/components"
```

### delete_file
Delete a file.

**Parameters:**
- `path` (required): Path relative to workspace root

**Example:**
```
"Delete file temp.txt"
```

### file_exists
Check if a file or directory exists.

**Parameters:**
- `path` (required): Path relative to workspace root

**Example:**
```
"Does package.json exist?"
```

### get_file_info
Get detailed information about a file or directory.

**Parameters:**
- `path` (required): Path relative to workspace root

**Example:**
```
"Get info about README.md"
```

## Security

- All paths are restricted to the workspace root
- Attempts to access files outside workspace are blocked
- Path traversal attacks are prevented

## Advantages Over Python MCP

1. ✅ **No encoding issues** - Works perfectly on Windows
2. ✅ **Faster startup** - Node.js starts quicker
3. ✅ **Consistent tech stack** - Same as other custom MCP servers
4. ✅ **Better error messages** - Clear, actionable errors
