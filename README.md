# Snapdragon FOD AWS System

Dynamic Feature on Demand (FOD) system for Snapdragon Digital Chassis with AWS cloud integration.

## Features

- **Connectivity Tier Upgrades**: Soft-SKU upgrades from 4G to 5G
- **Temporary Performance Features**: Time-limited activations like sport mode
- **Secure Communication**: TLS 1.3 encrypted vehicle-to-cloud messaging
- **Simulator Support**: Test without physical hardware

## Project Structure

```
snapdragon-fod-aws/
├── src/
│   ├── lambda/              # AWS Lambda functions
│   │   ├── purchase-handler/
│   │   ├── activation-handler/
│   │   ├── deactivation-handler/
│   │   └── ack-handler/
│   └── shared/              # Shared libraries
│       ├── models/          # Data models
│       ├── repositories/    # MongoDB repositories
│       └── utils/           # Utility functions
├── tests/
│   ├── unit/               # Unit tests
│   ├── property/           # Property-based tests
│   └── integration/        # Integration tests
├── mcp-servers/            # Custom MCP servers
│   ├── snapdragon-simulator/
│   ├── github-custom/
│   └── filesystem-custom/
└── infrastructure/         # AWS CDK infrastructure (to be added)

```

## Setup

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- AWS CLI configured
- MongoDB Atlas account

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run property-based tests
npm run test:property

# Run with coverage
npm run test:coverage
```

## Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Testing

- **Unit Tests**: Test individual functions and classes
- **Property-Based Tests**: Test properties across many inputs (min 100 iterations)
- **Integration Tests**: Test end-to-end flows

### Coding Standards

Follow the coding standards defined in `.kiro/steering/coding-standards.md`:
- Use TypeScript strict mode
- Follow error handling patterns
- Use structured logging
- Write tests alongside implementation

## Architecture

See `.kiro/specs/snapdragon-fod-aws/design.md` for detailed architecture documentation.

## Implementation Plan

See `.kiro/specs/snapdragon-fod-aws/tasks.md` for the complete implementation plan.

## License

MIT
