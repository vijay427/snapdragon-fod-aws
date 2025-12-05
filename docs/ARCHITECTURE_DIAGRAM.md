# System Architecture Diagrams

## Complete System Architecture

```mermaid
graph TB
    classDef user fill:#0078D4,stroke:#005A9E,color:#fff
    classDef api fill:#50E6FF,stroke:#0078D4,color:#000
    classDef lambda fill:#8764B8,stroke:#5C2D91,color:#fff
    classDef data fill:#FFB900,stroke:#FF8C00,color:#000
    classDef iot fill:#107C10,stroke:#0B5A0B,color:#fff
    classDef vehicle fill:#D13438,stroke:#A4262C,color:#fff
    
    User[👤 Vehicle Owner<br/>Mobile App/Web]:::user
    
    subgraph "AWS Cloud"
        API[API Gateway<br/>REST API]:::api
        
        subgraph "Lambda Functions"
            Purchase[Purchase Handler<br/>Process Payments]:::lambda
            Activation[Activation Handler<br/>Send to Vehicle]:::lambda
            ACK[ACK Handler<br/>Process Responses]:::lambda
            Deactivation[Deactivation Handler<br/>Handle Expiration]:::lambda
        end
        
        subgraph "Data Layer"
            DB[(MongoDB Atlas<br/>Features, Subscriptions,<br/>Transactions, Telemetry)]:::data
            Secrets[AWS Secrets Manager<br/>Keys & Credentials]:::data
        end
        
        IoT[AWS IoT Core<br/>MQTT Broker]:::iot
        SQS[SQS Queues<br/>Activation/Deactivation]:::api
    end
    
    Vehicle[🚗 Vehicle<br/>Snapdragon Digital Chassis]:::vehicle
    
    User -->|1. Purchase Request| API
    API -->|2. Invoke| Purchase
    Purchase -->|3. Store| DB
    Purchase -->|4. Queue| SQS
    SQS -->|5. Trigger| Activation
    Activation -->|6. Fetch Config| DB
    Activation -->|7. Get Keys| Secrets
    Activation -->|8. Publish| IoT
    IoT -->|9. Deliver| Vehicle
    Vehicle -->|10. ACK| IoT
    IoT -->|11. Route| ACK
    ACK -->|12. Update| DB
    Deactivation -->|13. Check Expired| DB
    Deactivation -->|14. Publish| IoT
```

## Purchase Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    participant User as 👤 User
    participant API as API Gateway
    participant Purchase as Purchase Handler
    participant DB as MongoDB
    participant Payment as Payment Gateway
    participant Queue as SQS Queue
    
    User->>API: POST /purchase<br/>{vehicleId, featureId}
    activate API
    API->>Purchase: Invoke Lambda
    activate Purchase
    
    Purchase->>DB: Check feature exists
    DB-->>Purchase: Feature details
    
    Purchase->>DB: Check duplicate subscription
    DB-->>Purchase: No duplicates
    
    Purchase->>DB: Create transaction (PENDING)
    DB-->>Purchase: Transaction created
    
    Purchase->>Payment: Process payment
    activate Payment
    Payment-->>Purchase: Payment successful
    deactivate Payment
    
    Purchase->>DB: Create subscription (PENDING)
    DB-->>Purchase: Subscription created
    
    Purchase->>DB: Update transaction (COMPLETED)
    
    Purchase->>Queue: Queue activation message
    
    Purchase-->>API: Success response
    deactivate Purchase
    API-->>User: Purchase successful!
    deactivate API
```

## Activation Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Queue as SQS Queue
    participant Activation as Activation Handler
    participant DB as MongoDB
    participant Secrets as Secrets Manager
    participant IoT as IoT Core
    participant Vehicle as 🚗 Vehicle
    participant ACK as ACK Handler
    
    Queue->>Activation: Trigger with subscription
    activate Activation
    
    Activation->>DB: Fetch feature config
    DB-->>Activation: Feature metadata
    
    Activation->>Secrets: Get signing keys
    Secrets-->>Activation: Private key
    
    Activation->>Activation: Build activation message
    Activation->>Activation: Sign message (ECDSA)
    
    Activation->>IoT: Publish to vehicle topic
    deactivate Activation
    
    IoT->>Vehicle: Deliver activation message
    activate Vehicle
    
    Vehicle->>Vehicle: Verify signature
    Vehicle->>Vehicle: Validate timestamp
    Vehicle->>Vehicle: Apply configuration
    
    Vehicle->>IoT: Send ACK (SUCCESS)
    deactivate Vehicle
    
    IoT->>ACK: Route ACK message
    activate ACK
    
    ACK->>ACK: Verify ACK signature
    ACK->>DB: Update subscription (ACTIVE)
    ACK->>DB: Log telemetry
    
    deactivate ACK
```

## Component Interaction Diagram

```mermaid
graph LR
    classDef primary fill:#0078D4,stroke:#005A9E,color:#fff
    classDef secondary fill:#50E6FF,stroke:#0078D4,color:#000
    classDef data fill:#FFB900,stroke:#FF8C00,color:#000
    
    subgraph "User Layer"
        Mobile[📱 Mobile App]:::primary
        Web[🌐 Web Portal]:::primary
    end
    
    subgraph "API Layer"
        Gateway[API Gateway]:::secondary
        Auth[Authentication]:::secondary
    end
    
    subgraph "Business Logic"
        Purchase[Purchase Handler]:::secondary
        Activation[Activation Handler]:::secondary
        ACK[ACK Handler]:::secondary
        Deactivation[Deactivation Handler]:::secondary
    end
    
    subgraph "Data Layer"
        Features[(Features)]:::data
        Subscriptions[(Subscriptions)]:::data
        Transactions[(Transactions)]:::data
        Telemetry[(Telemetry)]:::data
    end
    
    subgraph "Communication Layer"
        IoT[IoT Core]:::secondary
        Vehicle[🚗 Vehicle]:::primary
    end
    
    Mobile --> Gateway
    Web --> Gateway
    Gateway --> Auth
    Auth --> Purchase
    Purchase --> Features
    Purchase --> Subscriptions
    Purchase --> Transactions
    Purchase --> Activation
    Activation --> IoT
    IoT --> Vehicle
    Vehicle --> IoT
    IoT --> ACK
    ACK --> Subscriptions
    ACK --> Telemetry
    Deactivation --> Subscriptions
    Deactivation --> IoT
```

## Data Model Relationships

```mermaid
erDiagram
    FEATURES ||--o{ SUBSCRIPTIONS : "purchased as"
    FEATURES {
        string featureId PK
        string name
        string featureType
        number price
        number duration
        boolean isActive
        object metadata
    }
    
    SUBSCRIPTIONS ||--|| TRANSACTIONS : "created by"
    SUBSCRIPTIONS {
        string subscriptionId PK
        string vehicleId FK
        string featureId FK
        string status
        date purchasedAt
        date activatedAt
        date expiresAt
        boolean isPermanent
    }
    
    TRANSACTIONS {
        string transactionId PK
        string vehicleId
        string featureId FK
        string subscriptionId FK
        number amount
        string status
        date timestamp
    }
    
    SUBSCRIPTIONS ||--o{ TELEMETRY : "generates"
    TELEMETRY {
        string vehicleId
        string eventType
        string featureId FK
        date timestamp
        object metadata
    }
```

## State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> FeatureAvailable: Feature Created
    
    FeatureAvailable --> PurchaseInitiated: User Purchases
    PurchaseInitiated --> PaymentProcessing: Validate
    
    PaymentProcessing --> TransactionFailed: Payment Declined
    PaymentProcessing --> SubscriptionPending: Payment Success
    
    TransactionFailed --> [*]
    
    SubscriptionPending --> ActivationSent: Queue Activation
    ActivationSent --> SubscriptionActive: Vehicle ACK Success
    ActivationSent --> SubscriptionFailed: Vehicle ACK Failed
    
    SubscriptionActive --> CheckingExpiration: Time Passes
    CheckingExpiration --> SubscriptionActive: Not Expired
    CheckingExpiration --> DeactivationSent: Expired
    
    DeactivationSent --> SubscriptionExpired: Vehicle ACK
    
    SubscriptionActive --> DeactivationSent: User Cancels
    SubscriptionExpired --> [*]
    SubscriptionFailed --> [*]
```

## Deployment Architecture

```mermaid
graph TB
    classDef aws fill:#FF9900,stroke:#232F3E,color:#fff
    classDef compute fill:#FF9900,stroke:#232F3E,color:#fff
    classDef network fill:#8C4FFF,stroke:#232F3E,color:#fff
    classDef data fill:#3B48CC,stroke:#232F3E,color:#fff
    
    subgraph "AWS Region: us-east-1"
        subgraph "VPC"
            subgraph "Public Subnet"
                NAT[NAT Gateway]:::network
                ALB[Application Load Balancer]:::network
            end
            
            subgraph "Private Subnet 1"
                Lambda1[Lambda Functions<br/>Purchase, Activation]:::compute
            end
            
            subgraph "Private Subnet 2"
                Lambda2[Lambda Functions<br/>ACK, Deactivation]:::compute
            end
        end
        
        API[API Gateway]:::aws
        IoT[IoT Core]:::aws
        SQS[SQS Queues]:::aws
        Secrets[Secrets Manager]:::aws
        CloudWatch[CloudWatch<br/>Logs & Metrics]:::aws
    end
    
    MongoDB[(MongoDB Atlas<br/>Multi-Region)]:::data
    
    Internet[Internet]
    Vehicle[🚗 Vehicles]
    
    Internet --> API
    API --> Lambda1
    Lambda1 --> SQS
    SQS --> Lambda2
    Lambda2 --> IoT
    IoT --> Vehicle
    Lambda1 --> MongoDB
    Lambda2 --> MongoDB
    Lambda1 --> Secrets
    Lambda2 --> Secrets
    Lambda1 --> CloudWatch
    Lambda2 --> CloudWatch
```

## Security Architecture

```mermaid
graph TB
    classDef secure fill:#107C10,stroke:#0B5A0B,color:#fff
    classDef encrypt fill:#FFB900,stroke:#FF8C00,color:#000
    
    subgraph "Security Layers"
        subgraph "Transport Security"
            TLS[TLS 1.3<br/>All Connections]:::encrypt
        end
        
        subgraph "Authentication"
            IAM[IAM Roles<br/>Service-to-Service]:::secure
            Certs[X.509 Certificates<br/>Vehicle Auth]:::secure
        end
        
        subgraph "Message Security"
            Signing[ECDSA SHA-256<br/>Message Signing]:::secure
            Timestamp[Timestamp Validation<br/>5 min window]:::secure
        end
        
        subgraph "Data Security"
            Encryption[Encryption at Rest<br/>MongoDB + Secrets]:::encrypt
            Keys[AWS KMS<br/>Key Management]:::encrypt
        end
    end
    
    User[User Request] --> TLS
    TLS --> IAM
    IAM --> Signing
    Signing --> Timestamp
    Timestamp --> Encryption
    Encryption --> Keys
```

## Monitoring Dashboard Layout

```mermaid
graph TB
    classDef metric fill:#0078D4,stroke:#005A9E,color:#fff
    classDef alarm fill:#D13438,stroke:#A4262C,color:#fff
    
    subgraph "CloudWatch Dashboard"
        subgraph "Business Metrics"
            Purchases[Purchase Rate<br/>per minute]:::metric
            Revenue[Revenue<br/>$ per hour]:::metric
            Active[Active Subscriptions<br/>count]:::metric
        end
        
        subgraph "Performance Metrics"
            Latency[Activation Latency<br/>p50, p95, p99]:::metric
            Success[Success Rate<br/>%]:::metric
            Errors[Error Rate<br/>per minute]:::metric
        end
        
        subgraph "System Health"
            Lambda[Lambda Invocations<br/>count]:::metric
            IoT[IoT Messages<br/>count]:::metric
            DB[Database Connections<br/>count]:::metric
        end
        
        subgraph "Alarms"
            HighError[Error Rate > 5%]:::alarm
            HighLatency[Latency > 10s]:::alarm
            LowSuccess[Success < 95%]:::alarm
        end
    end
```

## Message Flow Diagram

```mermaid
graph LR
    classDef cloud fill:#50E6FF,stroke:#0078D4,color:#000
    classDef vehicle fill:#107C10,stroke:#0B5A0B,color:#fff
    classDef message fill:#FFB900,stroke:#FF8C00,color:#000
    
    subgraph "Cloud to Vehicle"
        Activation[Activation Message<br/>FEATURE_ACTIVATION]:::message
        Deactivation[Deactivation Message<br/>FEATURE_DEACTIVATION]:::message
        Query[State Query<br/>STATE_QUERY]:::message
    end
    
    subgraph "Vehicle to Cloud"
        ActivationACK[Activation ACK<br/>FEATURE_ACTIVATION_ACK]:::message
        DeactivationACK[Deactivation ACK<br/>FEATURE_DEACTIVATION_ACK]:::message
        StateResponse[State Response<br/>STATE_RESPONSE]:::message
        Telemetry[Telemetry<br/>TELEMETRY]:::message
    end
    
    Cloud[☁️ Cloud]:::cloud
    Vehicle[🚗 Vehicle]:::vehicle
    
    Cloud -->|Publish| Activation
    Cloud -->|Publish| Deactivation
    Cloud -->|Publish| Query
    
    Activation -->|Deliver| Vehicle
    Deactivation -->|Deliver| Vehicle
    Query -->|Deliver| Vehicle
    
    Vehicle -->|Publish| ActivationACK
    Vehicle -->|Publish| DeactivationACK
    Vehicle -->|Publish| StateResponse
    Vehicle -->|Publish| Telemetry
    
    ActivationACK -->|Route| Cloud
    DeactivationACK -->|Route| Cloud
    StateResponse -->|Route| Cloud
    Telemetry -->|Route| Cloud
```
