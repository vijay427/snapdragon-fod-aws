#!/usr/bin/env node
/**
 * Lambda Discovery Script
 * Automatically discovers Lambda functions in src/lambda directory
 * and generates deployment configuration
 */

import * as fs from 'fs';
import * as path from 'path';

interface LambdaFunction {
  name: string;
  path: string;
  handler: string;
  hasTypeScript: boolean;
  hasJavaScript: boolean;
}

/**
 * Discover all Lambda functions in src/lambda directory
 */
function discoverLambdas(lambdaDir: string): LambdaFunction[] {
  const lambdas: LambdaFunction[] = [];

  if (!fs.existsSync(lambdaDir)) {
    console.error(`Lambda directory not found: ${lambdaDir}`);
    return lambdas;
  }

  const entries = fs.readdirSync(lambdaDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const functionPath = path.join(lambdaDir, entry.name);
      const tsFile = path.join(functionPath, 'index.ts');
      const jsFile = path.join(functionPath, 'index.js');

      const hasTypeScript = fs.existsSync(tsFile);
      const hasJavaScript = fs.existsSync(jsFile);

      if (hasTypeScript || hasJavaScript) {
        // Convert directory name to PascalCase for function name
        const functionName = entry.name
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');

        lambdas.push({
          name: functionName,
          path: functionPath,
          handler: 'index.handler',
          hasTypeScript,
          hasJavaScript,
        });
      }
    }
  }

  return lambdas;
}

/**
 * Generate buildspec.yml for CodeBuild
 */
function generateBuildSpec(lambdas: LambdaFunction[]): object {
  return {
    version: '0.2',
    phases: {
      install: {
        'runtime-versions': {
          nodejs: '18',
        },
        commands: [
          'echo "Installing dependencies..."',
          'npm ci',
        ],
      },
      pre_build: {
        commands: [
          'echo "Running linter..."',
          'npm run lint || true',
          'echo "Running tests..."',
          'npm run test || true',
        ],
      },
      build: {
        commands: [
          'echo "Building TypeScript Lambda functions..."',
          'npm run build',
          ...lambdas.map(
            (lambda) =>
              `echo "Built ${lambda.name} from ${lambda.path}"`
          ),
        ],
      },
      post_build: {
        commands: [
          'echo "Preparing deployment artifacts..."',
          'cd infrastructure',
          'npm ci',
          'npm run build',
          'cd ..',
        ],
      },
    },
    artifacts: {
      files: ['**/*'],
      'exclude-paths': ['node_modules/**/*', '.git/**/*', 'tests/**/*'],
    },
    cache: {
      paths: ['node_modules/**/*', 'infrastructure/node_modules/**/*'],
    },
  };
}

/**
 * Main execution
 */
function main() {
  const projectRoot = path.resolve(__dirname, '../..');
  const lambdaDir = path.join(projectRoot, 'src', 'lambda');

  console.log('🔍 Discovering Lambda functions...');
  const lambdas = discoverLambdas(lambdaDir);

  console.log(`\n✅ Found ${lambdas.length} Lambda functions:\n`);
  lambdas.forEach((lambda) => {
    console.log(`  📦 ${lambda.name}`);
    console.log(`     Path: ${lambda.path}`);
    console.log(`     Handler: ${lambda.handler}`);
    console.log(
      `     Type: ${lambda.hasTypeScript ? 'TypeScript' : 'JavaScript'}\n`
    );
  });

  // Generate buildspec
  const buildSpec = generateBuildSpec(lambdas);
  const buildSpecPath = path.join(projectRoot, 'buildspec.yml');
  fs.writeFileSync(buildSpecPath, JSON.stringify(buildSpec, null, 2));
  console.log(`📝 Generated buildspec.yml at ${buildSpecPath}`);

  // Generate Lambda list for deployment
  const lambdaList = {
    lambdas: lambdas.map((l) => ({
      name: l.name,
      path: l.path.replace(projectRoot, '.'),
      handler: l.handler,
    })),
    generatedAt: new Date().toISOString(),
  };

  const lambdaListPath = path.join(
    projectRoot,
    'infrastructure',
    'lambda-functions.json'
  );
  fs.writeFileSync(lambdaListPath, JSON.stringify(lambdaList, null, 2));
  console.log(`📝 Generated lambda-functions.json at ${lambdaListPath}`);

  console.log('\n✨ Discovery complete!');
}

main();
