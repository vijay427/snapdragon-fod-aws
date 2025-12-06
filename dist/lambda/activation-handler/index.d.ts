/**
 * Activation Handler Lambda Function
 * Handles feature activation after purchase - sends activation message to vehicle via IoT Core
 */
import { SQSEvent } from 'aws-lambda';
/**
 * Main Lambda handler (triggered by SQS)
 */
export declare function handler(event: SQSEvent): Promise<void>;
//# sourceMappingURL=index.d.ts.map