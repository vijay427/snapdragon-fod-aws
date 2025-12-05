# Requirements Document

## Introduction

This document defines the requirements for implementing a direct MCP (Model Context Protocol) integration testing system for the Feature on Demand (FOD) platform. The system will enable simplified end-to-end testing of feature activation flows by calling the Snapdragon simulator MCP server via an HTTP bridge instead of requiring full IoT Core infrastructure setup. The HTTP bridge exposes the local MCP server as a REST API that AWS Lambda functions can communicate with. This testing approach reduces complexity during development and allows rapid validation of the activation workflow.

## Glossary

- **MCP Server**: Model Context Protocol server that provides programmatic access to the Snapdragon Digital Chassis simulator
- **HTTP Bridge**: Express.js server that wraps the MCP simulator and exposes it as a REST API accessible to AWS Lambda
- **Test Activation Handler**: AWS Lambda function that processes activation requests and communicates with the MCP simulator via the HTTP bridge
- **Activation Flow**: The complete sequence from purchase request through feature activation to vehicle acknowledgment
- **Snapdragon Simulator**: MCP-based simulator that mimics vehicle behavior for testing purposes
- **FOD System**: Feature on Demand system that manages vehicle feature purchases and activations
- **Tunnel Service**: Service (ngrok, localtunnel, or AWS deployment) that makes the local HTTP bridge accessible from AWS Lambda

## Requirements

### Requirement 1

**User Story:** As a developer, I want to test feature activation flows without IoT Core setup, so that I can rapidly validate the purchase-to-activation workflow during development.

#### Acceptance Criteria

1. WHEN a developer triggers a test activation request THEN the Test Activation Handler SHALL process the request without requiring IoT Core configuration
2. WHEN the Test Activation Handler processes a request THEN the system SHALL communicate with the Snapdragon simulator via the HTTP bridge using REST API calls
3. WHEN the activation completes THEN the system SHALL return the complete activation flow results including purchase, activation, and acknowledgment data
4. WHEN the test endpoint is invoked THEN the system SHALL validate all input parameters before processing
5. WHERE the HTTP bridge is unavailable THEN the system SHALL return a clear error message indicating the connection failure with retry guidance

### Requirement 2

**User Story:** As a developer, I want the test endpoint to simulate the complete activation flow, so that I can verify all components work together correctly.

#### Acceptance Criteria

1. WHEN a test activation is initiated THEN the system SHALL create a purchase transaction record in the database
2. WHEN the purchase is recorded THEN the system SHALL create a subscription record with the appropriate expiration time
3. WHEN the subscription is created THEN the system SHALL invoke the MCP simulator to activate the feature on the vehicle
4. WHEN the MCP simulator activates the feature THEN the system SHALL record the activation timestamp and status
5. WHEN the activation succeeds THEN the system SHALL return a response containing transaction ID, subscription ID, and activation confirmation

### Requirement 3

**User Story:** As a developer, I want to test different feature types and configurations, so that I can validate the system handles various activation scenarios.

#### Acceptance Criteria

1. WHEN testing connectivity upgrades THEN the system SHALL support activation of 4G and 5G tier features
2. WHEN testing performance modes THEN the system SHALL support activation of SPORT, ECO, and COMFORT modes
3. WHEN testing time-limited features THEN the system SHALL correctly set expiration timestamps based on duration parameters
4. WHEN testing permanent features THEN the system SHALL create subscriptions without expiration dates
5. WHERE invalid feature configurations are provided THEN the system SHALL reject the request with descriptive error messages

### Requirement 4

**User Story:** As a developer, I want clear error handling and logging, so that I can quickly diagnose issues during testing.

#### Acceptance Criteria

1. WHEN any step in the activation flow fails THEN the system SHALL log the failure with complete context including vehicle ID, feature ID, and error details
2. WHEN database operations fail THEN the system SHALL return error responses that indicate the specific operation that failed
3. WHEN MCP simulator communication fails THEN the system SHALL distinguish between connection errors and activation errors
4. WHEN validation fails THEN the system SHALL return error messages that specify which validation rule was violated
5. WHEN errors occur THEN the system SHALL include request correlation IDs for tracing across log entries

### Requirement 5

**User Story:** As a developer, I want the test endpoint accessible via API Gateway, so that I can trigger tests from various tools and interfaces.

#### Acceptance Criteria

1. WHEN the test endpoint is deployed THEN the system SHALL expose it via API Gateway with a dedicated route
2. WHEN requests are made to the test endpoint THEN the system SHALL accept POST requests with JSON payloads
3. WHEN the endpoint receives requests THEN the system SHALL validate authentication and authorization
4. WHEN responses are returned THEN the system SHALL include appropriate HTTP status codes and CORS headers
5. WHERE rate limiting is configured THEN the system SHALL enforce reasonable limits to prevent abuse during testing

### Requirement 6

**User Story:** As a developer, I want to verify the MCP simulator state after activation, so that I can confirm the vehicle received and processed the activation correctly.

#### Acceptance Criteria

1. WHEN an activation completes THEN the system SHALL query the MCP simulator for the updated vehicle state
2. WHEN the vehicle state is retrieved THEN the system SHALL verify the feature appears in the active features list
3. WHEN time-limited features are activated THEN the system SHALL verify the expiration timestamp matches the requested duration
4. WHEN the verification succeeds THEN the system SHALL include the vehicle state in the test response
5. WHERE the vehicle state does not reflect the activation THEN the system SHALL report a verification failure with details

### Requirement 7

**User Story:** As a developer, I want comprehensive test response data, so that I can analyze the complete activation flow in a single request.

#### Acceptance Criteria

1. WHEN a test activation completes THEN the system SHALL return the purchase transaction details including amount and timestamp
2. WHEN a test activation completes THEN the system SHALL return the subscription details including feature ID and expiration
3. WHEN a test activation completes THEN the system SHALL return the MCP simulator activation response
4. WHEN a test activation completes THEN the system SHALL return the final vehicle state showing active features
5. WHEN a test activation completes THEN the system SHALL return timing information for each step in the flow


### Requirement 8

**User Story:** As a developer, I want an HTTP bridge that exposes the MCP simulator as a REST API, so that AWS Lambda functions can communicate with the local simulator.

#### Acceptance Criteria

1. WHEN the HTTP bridge starts THEN the system SHALL initialize the MCP simulator client and establish connection
2. WHEN the bridge receives activation requests THEN the system SHALL translate REST API calls to MCP tool invocations
3. WHEN the bridge invokes MCP tools THEN the system SHALL call the appropriate simulator functions (activate_feature, get_vehicle_state, deactivate_feature)
4. WHEN MCP operations complete THEN the system SHALL return responses in JSON format with appropriate HTTP status codes
5. WHERE MCP operations fail THEN the system SHALL return error responses with detailed error messages and status codes

### Requirement 9

**User Story:** As a developer, I want the HTTP bridge to support all simulator operations, so that I can test the complete feature lifecycle.

#### Acceptance Criteria

1. WHEN a POST request is made to /api/vehicle/:vehicleId/activate THEN the system SHALL invoke the MCP activate_feature tool with the provided feature configuration
2. WHEN a POST request is made to /api/vehicle/:vehicleId/deactivate THEN the system SHALL invoke the MCP deactivate_feature tool
3. WHEN a GET request is made to /api/vehicle/:vehicleId/state THEN the system SHALL invoke the MCP get_vehicle_state tool and return current vehicle status
4. WHEN a POST request is made to /api/vehicle/:vehicleId/advance-time THEN the system SHALL invoke the MCP advance_time tool for testing time-limited features
5. WHEN a POST request is made to /api/vehicle/:vehicleId/reset THEN the system SHALL invoke the MCP reset_vehicle tool to restore default state

### Requirement 10

**User Story:** As a developer, I want the HTTP bridge to be accessible from AWS Lambda, so that cloud-deployed functions can reach the local simulator.

#### Acceptance Criteria

1. WHEN the HTTP bridge is deployed THEN the system SHALL listen on a configurable port with CORS enabled for cross-origin requests
2. WHERE local testing is required THEN the system SHALL support tunnel services (ngrok or localtunnel) to expose the bridge publicly
3. WHEN Lambda functions make requests THEN the system SHALL accept requests from AWS IP ranges with proper authentication
4. WHEN the bridge URL is configured THEN the system SHALL store it as an environment variable accessible to Lambda functions
5. WHERE authentication is enabled THEN the system SHALL validate API keys or tokens on incoming requests

### Requirement 11

**User Story:** As a developer, I want the HTTP bridge to handle errors gracefully, so that I can diagnose issues when testing fails.

#### Acceptance Criteria

1. WHEN MCP tool invocations fail THEN the system SHALL return HTTP 500 status with error details in the response body
2. WHEN invalid requests are received THEN the system SHALL return HTTP 400 status with validation error messages
3. WHEN the MCP server is not connected THEN the system SHALL return HTTP 503 status indicating service unavailability
4. WHEN requests timeout THEN the system SHALL return HTTP 504 status after a configurable timeout period
5. WHEN errors occur THEN the system SHALL log complete error context including request details and stack traces
