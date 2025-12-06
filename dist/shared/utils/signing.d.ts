/**
 * Message Signing and Verification Utilities
 * Implements ECDSA SHA-256 signing for Car-to-Cloud messages
 */
/**
 * Key pair interface
 */
export interface KeyPair {
    privateKey: string;
    publicKey: string;
}
/**
 * Get signing keys from AWS Secrets Manager
 */
export declare function getSigningKeys(): Promise<KeyPair>;
/**
 * Generate ECDSA key pair for development/testing
 */
export declare function generateKeyPair(): KeyPair;
/**
 * Sign a message using ECDSA SHA-256
 */
export declare function signMessage(message: any, privateKey?: string): Promise<string>;
/**
 * Verify message signature using ECDSA SHA-256
 */
export declare function verifyMessageSignature(message: any, publicKey?: string): Promise<boolean>;
/**
 * Validate message timestamp (not too old or in future)
 */
export declare function validateMessageTimestamp(timestamp: string): boolean;
/**
 * Sign and add signature to message
 */
export declare function signAndAddSignature(message: any, privateKey?: string): Promise<any>;
/**
 * Verify complete message (signature + timestamp)
 */
export declare function verifyMessage(message: any, publicKey?: string): Promise<boolean>;
/**
 * Generate message ID (UUID v4)
 */
export declare function generateMessageId(): string;
/**
 * Hash data using SHA-256
 */
export declare function hashData(data: string): string;
//# sourceMappingURL=signing.d.ts.map