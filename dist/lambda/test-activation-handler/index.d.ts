/**
 * Test Activation Handler Lambda Function
 * Orchestrates complete activation flow: purchase → subscription → HTTP Bridge → simulator
 * For testing without IoT Core infrastructure
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
//# sourceMappingURL=index.d.ts.map