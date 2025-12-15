#!/usr/bin/env node

/**
 * Watch and Deploy Script
 * Continuously monitors file changes and triggers automatic deployment
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { autoDeploy } = require('./auto-deploy.js');

// Configuration
const WATCH_CONFIG = {
  paths: [
    'src/lambda',
    'src/shared',
    'infrastructure/lib'
  ],
  excludePatterns: [
    /node_modules/,
    /\.git/,
    /dist/,
    /cdk\.out/,
    /\.log$/,
    /\.tmp$/,
    /\.swp$/,
    /~$/
  ],
  debounceMs: 2000, // Wait 2 seconds after last change
  batchChanges: true
};

class FileWatcher {
  constructor(config = WATCH_CONFIG) {
    this.config = config;
    this.watchers = new Map();
    this.changeTimeout = null;
    this.pendingChanges = new Set();
    this.isDeploying = false;
  }

  /**
   * Start watching all configured paths
   */
  start() {
    console.log('👀 Starting FOD File Watcher');
    console.log('═'.repeat(50));
    console.log(`📁 Watching paths: ${this.config.paths.join(', ')}`);
    console.log(`⏱️ Debounce delay: ${this.config.debounceMs}ms`);
    console.log('🛑 Press Ctrl+C to stop\n');

    // Watch each configured path
    this.config.paths.forEach(watchPath => {
      this.watchPath(watchPath);
    });

    // Setup graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping file watcher...');
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.stop();
      process.exit(0);
    });
  }

  /**
   * Watch a specific path
   */
  watchPath(watchPath) {
    if (!fs.existsSync(watchPath)) {
      console.log(`⚠️ Path does not exist: ${watchPath}`);
      return;
    }

    const stats = fs.statSync(watchPath);
    
    if (stats.isDirectory()) {
      this.watchDirectory(watchPath);
    } else {
      this.watchFile(watchPath);
    }
  }

  /**
   * Watch a directory recursively
   */
  watchDirectory(dirPath) {
    try {
      const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (filename) {
          const fullPath = path.join(dirPath, filename);
          this.handleFileChange(eventType, fullPath);
        }
      });

      this.watchers.set(dirPath, watcher);
      console.log(`📂 Watching directory: ${dirPath}`);
    } catch (error) {
      console.error(`❌ Failed to watch directory ${dirPath}:`, error.message);
    }
  }

  /**
   * Watch a single file
   */
  watchFile(filePath) {
    try {
      const watcher = fs.watch(filePath, (eventType) => {
        this.handleFileChange(eventType, filePath);
      });

      this.watchers.set(filePath, watcher);
      console.log(`📄 Watching file: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to watch file ${filePath}:`, error.message);
    }
  }

  /**
   * Handle file change events
   */
  handleFileChange(eventType, filePath) {
    // Skip if file should be excluded
    if (this.shouldExclude(filePath)) {
      return;
    }

    // Skip if currently deploying
    if (this.isDeploying) {
      return;
    }

    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`🔄 ${eventType}: ${relativePath}`);

    // Add to pending changes
    this.pendingChanges.add(relativePath);

    // Debounce: reset timer on each change
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }

    this.changeTimeout = setTimeout(() => {
      this.processPendingChanges();
    }, this.config.debounceMs);
  }

  /**
   * Check if file should be excluded from watching
   */
  shouldExclude(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    return this.config.excludePatterns.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(relativePath);
      }
      return relativePath.includes(pattern);
    });
  }

  /**
   * Process accumulated changes
   */
  async processPendingChanges() {
    if (this.pendingChanges.size === 0) {
      return;
    }

    const changes = Array.from(this.pendingChanges);
    this.pendingChanges.clear();

    console.log('\n📊 Processing changes:');
    changes.forEach(change => console.log(`   • ${change}`));

    // Check if changes affect Lambda functions
    const lambdaChanges = this.detectLambdaChanges(changes);
    
    if (lambdaChanges.length > 0) {
      console.log(`\n🎯 Lambda changes detected: ${lambdaChanges.join(', ')}`);
      
      try {
        this.isDeploying = true;
        console.log('\n🚀 Triggering auto-deployment...');
        
        await autoDeploy({ autoConfirm: true });
        
        console.log('✅ Auto-deployment completed');
      } catch (error) {
        console.error('❌ Auto-deployment failed:', error.message);
      } finally {
        this.isDeploying = false;
      }
    } else {
      console.log('ℹ️ No Lambda-affecting changes detected');
    }

    console.log('\n👀 Continuing to watch for changes...\n');
  }

  /**
   * Detect which Lambda functions are affected by changes
   */
  detectLambdaChanges(changedFiles) {
    const lambdaChanges = new Set();

    changedFiles.forEach(file => {
      // Check for specific Lambda function changes
      const lambdaMatch = file.match(/^src\/lambda\/([^\/]+)\//);
      if (lambdaMatch) {
        lambdaChanges.add(lambdaMatch[1]);
      }

      // Check for shared code changes (affects all Lambdas)
      if (file.startsWith('src/shared/') || 
          file.startsWith('infrastructure/lib/') ||
          file === 'package.json' || 
          file === 'tsconfig.json') {
        lambdaChanges.add('shared-dependencies');
      }
    });

    return Array.from(lambdaChanges);
  }

  /**
   * Stop all watchers
   */
  stop() {
    console.log('🛑 Stopping file watchers...');
    
    this.watchers.forEach((watcher, path) => {
      try {
        watcher.close();
        console.log(`✅ Stopped watching: ${path}`);
      } catch (error) {
        console.error(`❌ Error stopping watcher for ${path}:`, error.message);
      }
    });

    this.watchers.clear();

    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout);
    }
  }
}

/**
 * Start file watching with custom configuration
 */
function startWatching(customConfig = {}) {
  const config = { ...WATCH_CONFIG, ...customConfig };
  const watcher = new FileWatcher(config);
  watcher.start();
  return watcher;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
👀 FOD Watch and Deploy Script

Usage:
  node scripts/watch-and-deploy.js [options]

Options:
  --help      Show this help message

Features:
  • Monitors file changes in Lambda functions and shared code
  • Automatically triggers deployment when changes are detected
  • Debounces changes to avoid excessive deployments
  • Excludes irrelevant files (node_modules, build artifacts, etc.)

Examples:
  node scripts/watch-and-deploy.js    # Start watching
`);
  } else {
    startWatching();
  }
}

module.exports = { FileWatcher, startWatching };