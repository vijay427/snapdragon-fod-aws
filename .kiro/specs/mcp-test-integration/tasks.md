# Implementation Plan

## Note: Reusing Existing Infrastructure
This plan leverages existing FOD system components:
- ✅ MongoDB repositories (Transaction, Subscription) - already implemented
- ✅ Data models and interfaces - already implemented
- ✅ API Gateway infrastructure - already deployed
- ✅ MCP Snapdragon Simulator - already implemented

## New Components to Implement
1. HTTP Bridge - REST API wrapper for MCP simulator
2. Test Activation Lambda - Orchestrates complete test flow
3. API Gateway route - New test endpoint

- [x] 1. Set up HTTP Bridge project structure


  - Create directory `mcp-servers/http-bridge`
  - Initialize Node.js project with TypeScript configuration
  - Install dependencies: express, @modelcontextprotocol/sdk, cors, body-parser, dotenv
  - Create tsconfig.json with ES2020 target and strict mode
  - Create package.json with start script
  - _Requirements: 8.1, 10.1_

- [-] 2. Implement HTTP Bridge core server

  - [x] 2.1 Create Express server with CORS and body-parser middleware


    - Initialize Express app with port configuration from environment
    - Configure CORS for all origins during development
    - Add body-parser for JSON request parsing
    - Add request logging middleware
    - _Requirements: 10.1_

  - [x] 2.2 Initialize MCP client connection to Snapdragon simulator


    - Import MCP SDK client
    - Connect to local MCP server using stdio transport
    - Implement connection error handling
    - Add health check for MCP connection status
    - _Requirements: 8.1_

  - [x] 2.3 Implement vehicle activation endpoint (POST /api/vehicle/:vehicleId/activate)


    - Parse vehicleId from URL params and featureId/duration from body
    - Validate request parameters
    - Call MCP activate_feature tool with parameters
    - Return JSON response with activation result and HTTP 200
    - Handle errors with appropriate status codes
    - _Requirements: 9.1, 8.2, 8.3, 8.4_

  - [ ]* 2.4 Write property test for activation endpoint
    - **Property 11: Bridge REST to MCP Translation**
    - **Validates: Requirements 8.2, 8.3, 8.4**
    - Generate random vehicleId and featureId combinations
    - Verify HTTP requests invoke correct MCP tools
    - Verify responses are valid JSON with correct status codes


  - [ ] 2.5 Implement vehicle state endpoint (GET /api/vehicle/:vehicleId/state)
    - Parse vehicleId from URL params
    - Call MCP get_vehicle_state tool
    - Return vehicle state JSON with active features
    - _Requirements: 9.3, 8.2, 8.4_


  - [ ] 2.6 Implement deactivation endpoint (POST /api/vehicle/:vehicleId/deactivate)
    - Parse vehicleId and featureId from request
    - Call MCP deactivate_feature tool
    - Return deactivation confirmation

    - _Requirements: 9.2, 8.2, 8.4_

  - [ ] 2.7 Implement time advance endpoint (POST /api/vehicle/:vehicleId/advance-time)
    - Parse hours parameter from request body
    - Call MCP advance_time tool

    - Return updated time confirmation
    - _Requirements: 9.4_

  - [ ] 2.8 Implement vehicle reset endpoint (POST /api/vehicle/:vehicleId/reset)
    - Parse vehicleId from URL params

    - Call MCP reset_vehicle tool
    - Return reset confirmation
    - _Requirements: 9.5_

  - [x] 2.9 Implement health check endpoint (GET /health)

    - Check MCP connection status
    - Return server uptime and connection state
    - Return HTTP 200 if healthy, 503 if MCP disconnected
    - _Requirements: 8.1_

  - [ ] 2.10 Add error handling middleware
    - Catch MCP tool invocation errors and return HTTP 500
    - Catch validation errors and return HTTP 400
    - Catch timeout errors and return HTTP 504
    - Log all errors with context
    - _Requirements: 8.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 2.11 Write unit tests for HTTP Bridge endpoints
    - Test each endpoint with valid inputs
    - Test error scenarios (invalid params, MCP failures)
    - Test health check endpoint
    - Mock MCP client for isolated testing
    - _Requirements: 8.1-8.5, 9.1-9.5_

- [-] 3. Create Test Activation Lambda Handler (reuses existing repositories)

  - [x] 3.1 Update existing test-activation-handler implementation


    - Modify `src/lambda/test-activation-handler/index.ts`
    - Import existing TransactionRepository and SubscriptionRepository
    - Import existing data models (Transaction, Subscription interfaces)
    - Add axios for HTTP Bridge communication
    - _Requirements: 1.1, 5.1_


  - [ ] 3.2 Implement input validation logic
    - Validate required fields: vehicleId, featureId, userId
    - Validate optional fields: duration (positive number), isPermanent (boolean)
    - Return descriptive error messages for validation failures
    - _Requirements: 1.4, 3.5, 4.4_

  - [ ]* 3.3 Write property test for input validation
    - **Property 3: Input Validation**
    - **Validates: Requirements 1.4, 4.4**
    - Generate random invalid inputs (missing fields, negative durations)
    - Verify all invalid inputs are rejected with error messages
    - Verify error messages specify which validation rule failed


  - [ ] 3.4 Use existing TransactionRepository to create transaction
    - Import TransactionRepository from `src/repositories/transaction-repository.ts`
    - Call createTransaction() with vehicleId, featureId, amount, testMode: true
    - Set source: 'TEST_ENDPOINT' in metadata
    - Return transaction ID
    - _Requirements: 2.1_

  - [ ]* 3.5 Write property test for transaction creation
    - **Property 4: Transaction Creation**
    - **Validates: Requirements 2.1**
    - Generate random vehicleId and featureId combinations
    - Verify transaction record exists in database after activation

    - Verify testMode is true and status is COMPLETED

  - [ ] 3.6 Use existing SubscriptionRepository to create subscription
    - Import SubscriptionRepository from `src/repositories/subscription-repository.ts`
    - Call createSubscription() with vehicleId, featureId, userId
    - Calculate expiresAt as activatedAt + duration hours (if duration provided)
    - Set expiresAt to null if isPermanent is true
    - Link to transaction via transactionId in metadata
    - _Requirements: 2.2, 3.3, 3.4_

  - [ ]* 3.7 Write property test for subscription expiration calculation
    - **Property 5: Subscription Creation with Expiration**
    - **Validates: Requirements 2.2, 3.3, 6.3**
    - Generate random duration values (1-168 hours)
    - Verify expiresAt equals activatedAt plus duration in hours
    - Verify permanent subscriptions have null expiresAt

  - [ ]* 3.8 Write property test for permanent feature handling
    - **Property 9: Permanent Feature Handling**
    - **Validates: Requirements 3.4**
    - Generate requests with isPermanent: true

    - Verify subscription has expiresAt as null
    - Verify isPermanent field is true

  - [ ] 3.9 Implement HTTP Bridge communication
    - Create axios client with bridge URL from environment variable
    - Add API key header if configured
    - Set timeout from environment (default 30 seconds)
    - Implement POST request to /api/vehicle/:vehicleId/activate endpoint
    - Parse and return activation response
    - _Requirements: 1.2, 2.3_

  - [ ]* 3.10 Write property test for HTTP bridge communication
    - **Property 1: HTTP Bridge Communication**
    - **Validates: Requirements 1.2**
    - Generate random valid activation requests
    - Verify HTTP POST is made to correct endpoint
    - Verify request payload contains vehicleId and featureId

  - [ ]* 3.11 Write property test for simulator activation invocation
    - **Property 6: Simulator Activation Invocation**
    - **Validates: Requirements 2.3**

    - Generate random subscriptions
    - Verify MCP simulator receives activation call before response
    - Verify activation parameters match subscription

  - [ ] 3.12 Implement vehicle state verification
    - Call GET /api/vehicle/:vehicleId/state on HTTP Bridge
    - Parse vehicle state response
    - Verify activated feature appears in activeFeatures array
    - Include vehicle state in response
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ]* 3.13 Write property test for vehicle state verification
    - **Property 10: Vehicle State Verification**

    - **Validates: Requirements 6.1, 6.2**
    - Generate random feature activations
    - Query vehicle state after activation
    - Verify featureId appears in activeFeatures array

  - [ ] 3.14 Implement response builder
    - Collect transaction details (transactionId, amount, timestamp)
    - Collect subscription details (subscriptionId, featureId, expiresAt)
    - Collect activation details (vehicleId, status, activatedAt)
    - Collect vehicle state (activeFeatures, connectivityTier, performanceMode)
    - Calculate timing metrics for each step
    - Build complete response object
    - _Requirements: 1.3, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 3.15 Write property test for complete response structure
    - **Property 2: Complete Response Structure**
    - **Validates: Requirements 1.3, 2.5, 6.4, 7.1, 7.2, 7.3, 7.4**
    - Generate random successful activations
    - Verify response contains all required fields
    - Verify transaction, subscription, activation, and vehicleState objects are present
    - Verify timing information is included

  - [x] 3.16 Implement error handling

    - Catch validation errors and return HTTP 400 with error details
    - Catch database errors and return HTTP 500 with operation context
    - Catch HTTP Bridge connection errors and return HTTP 503/504
    - Include correlation ID in all error responses
    - Log errors with full context
    - _Requirements: 1.5, 4.1, 4.2, 4.3, 4.5_

  - [ ]* 3.17 Write property test for feature type support
    - **Property 8: Feature Type Support**
    - **Validates: Requirements 3.1, 3.2**
    - Generate requests for all feature types (4G, 5G, SPORT, ECO, COMFORT)
    - Verify all feature types are successfully processed
    - Verify appropriate records are created for each type

  - [ ]* 3.18 Write property test for activation timestamp recording
    - **Property 7: Activation Timestamp Recording**
    - **Validates: Requirements 2.4**
    - Generate random activations
    - Verify subscription has activatedAt timestamp
    - Verify status is set to ACTIVE

- [ ]* 3.19 Write unit tests for Lambda handler
    - Test input validation with various invalid inputs
    - Test database operations with mocked MongoDB client
    - Test HTTP client with mocked axios
    - Test response building logic
    - Test error handling for each failure scenario
    - _Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.5_



- [ ] 4. Update existing CDK infrastructure for test endpoint
  - [ ] 4.1 Update ComputeStack to include Test Activation Lambda
    - Modify `infrastructure/lib/compute-stack.ts`
    - Add NodejsFunction for test-activation-handler (similar to existing handlers)
    - Set runtime to Node.js 18.x, memory 512MB, timeout 30s
    - Add new environment variables: HTTP_BRIDGE_URL, HTTP_BRIDGE_API_KEY
    - Reuse existing MONGODB_URI and LOG_LEVEL environment variables
    - Grant same permissions as existing Lambda functions

    - _Requirements: 5.1, 10.4_

  - [ ] 4.2 Update ApiStack to add test endpoint
    - Modify `infrastructure/lib/api-stack.ts`
    - Add POST /test-activation route (similar to existing routes)
    - Integrate with Test Activation Lambda

    - Reuse existing CORS configuration
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ] 4.3 Configure CloudWatch monitoring
    - Enable detailed CloudWatch metrics for Lambda
    - Create alarm for error rate > 5%


    - Create alarm for duration > 25 seconds
    - Set up log group with 90-day retention
    - _Requirements: 4.1_

- [ ] 5. Create deployment and setup scripts
  - [x] 5.1 Create HTTP Bridge startup script

    - Write bash/PowerShell script to start bridge server
    - Include environment variable setup
    - Add instructions for ngrok tunnel setup
    - Document bridge URL configuration
    - _Requirements: 10.1, 10.2, 10.4_

  - [x] 5.2 Create Lambda deployment script

    - Build TypeScript to JavaScript
    - Package Lambda function
    - Update environment variables with bridge URL
    - Deploy CDK stack
    - Output API Gateway endpoint URL
    - _Requirements: 5.1_

  - [ ] 5.3 Create end-to-end test script
    - Start HTTP Bridge locally
    - Start ngrok tunnel
    - Deploy Lambda with tunnel URL
    - Make test API call
    - Verify response structure
    - Check database records
    - Query simulator state
    - _Requirements: 1.1-1.5, 2.1-2.5_

- [-] 6. Create documentation

  - [x] 6.1 Write HTTP Bridge README

    - Document installation steps
    - Document configuration options
    - Document API endpoints with examples
    - Document error codes and troubleshooting
    - _Requirements: 8.1-8.5, 9.1-9.5_

  - [x] 6.2 Write Test Activation Lambda README

    - Document request/response format
    - Document environment variables
    - Document error scenarios
    - Provide example API calls with curl/Postman
    - _Requirements: 1.1-1.5, 2.1-2.5_

  - [x] 6.3 Create quick start guide


    - Step-by-step setup instructions
    - Prerequisites checklist
    - Common issues and solutions
    - Example test scenarios
    - _Requirements: 1.1, 5.1_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
