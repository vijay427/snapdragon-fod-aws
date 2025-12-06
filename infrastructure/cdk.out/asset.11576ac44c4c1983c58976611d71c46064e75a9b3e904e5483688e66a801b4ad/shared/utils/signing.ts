/**
 * Message Signing and Verification Utilities
 * Implements ECDSA SHA-256 signing for Car-to-Cloud messages
 */

import * as crypto from 'crypto';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Message expiration window (5 minutes)
const MESSAGE_EXPIRATION_MS = 5 * 60 * 1000;

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
export async function getSigningKeys(): Promise<KeyPair> {
  // Check for local development override
  if (process.env.SIGNING_PRIVATE_KEY && process.env.SIGNING_PUBLIC_KEY) {
    return {
      privateKey: process.env.SIGNING_PRIVATE_KEY,
      publicKey: process.env.SIGNING_PUBLIC_KEY,
    };
  }

  // Fetch from AWS Secrets Manager
  const secretName = process.env.SIGNING_KEY_SECRET_NAME || 'fod-signing-keys';
  const region = process.env.AWS_REGION || 'us-east-1';

  const client = new SecretsManagerClient({ region });

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );

    if (!response.SecretString) {
      throw new Error('Secret value is empty');
    }

    const secret = JSON.parse(response.SecretString);
    return {
      privateKey: secret.privateKey,
      publicKey: secret.publicKey,
    };
  } catch (error: any) {
    console.error('Failed to retrieve signing keys:', error);
    throw new Error(`Failed to retrieve signing keys: ${error.message}`);
  }
}

/**
 * Generate ECDSA key pair for development/testing
 */
export function generateKeyPair(): KeyPair {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1', // P-256 curve for ECDSA
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return {
    privateKey,
    publicKey,
  };
}

/**
 * Create message payload for signing (excludes signature field)
 */
function createSigningPayload(message: any): string {
  // Create a copy without the signature field
  const { signature, ...messageWithoutSignature } = message;

  // Sort keys for consistent signing
  const sortedMessage = sortObjectKeys(messageWithoutSignature);

  // Convert to JSON string
  return JSON.stringify(sortedMessage);
}

/**
 * Recursively sort object keys for consistent hashing
 */
function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sorted: any = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = sortObjectKeys(obj[key]);
    });

  return sorted;
}

/**
 * Sign a message using ECDSA SHA-256
 */
export async function signMessage(message: any, privateKey?: string): Promise<string> {
  try {
    // Get private key if not provided
    if (!privateKey) {
      const keys = await getSigningKeys();
      privateKey = keys.privateKey;
    }

    // Create signing payload
    const payload = createSigningPayload(message);

    // Create signature
    const sign = crypto.createSign('SHA256');
    sign.update(payload);
    sign.end();

    const signature = sign.sign(privateKey, 'base64');
    return signature;
  } catch (error: any) {
    console.error('Message signing failed:', error);
    throw new Error(`Failed to sign message: ${error.message}`);
  }
}

/**
 * Verify message signature using ECDSA SHA-256
 */
export async function verifyMessageSignature(
  message: any,
  publicKey?: string
): Promise<boolean> {
  try {
    // Get public key if not provided
    if (!publicKey) {
      const keys = await getSigningKeys();
      publicKey = keys.publicKey;
    }

    // Extract signature
    const signature = message.signature;
    if (!signature || typeof signature !== 'string') {
      return false;
    }

    // Create signing payload
    const payload = createSigningPayload(message);

    // Verify signature
    const verify = crypto.createVerify('SHA256');
    verify.update(payload);
    verify.end();

    return verify.verify(publicKey, signature, 'base64');
  } catch (error: any) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Validate message timestamp (not too old or in future)
 */
export function validateMessageTimestamp(timestamp: string): boolean {
  try {
    const messageTime = new Date(timestamp).getTime();
    const now = Date.now();

    // Check if timestamp is valid
    if (isNaN(messageTime)) {
      return false;
    }

    // Check if message is too old
    if (now - messageTime > MESSAGE_EXPIRATION_MS) {
      return false;
    }

    // Check if message is from the future (allow 1 minute clock skew)
    if (messageTime - now > 60000) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sign and add signature to message
 */
export async function signAndAddSignature(message: any, privateKey?: string): Promise<any> {
  const signature = await signMessage(message, privateKey);
  return {
    ...message,
    signature,
  };
}

/**
 * Verify complete message (signature + timestamp)
 */
export async function verifyMessage(message: any, publicKey?: string): Promise<boolean> {
  // Validate timestamp
  if (!validateMessageTimestamp(message.timestamp)) {
    console.error('Message timestamp validation failed');
    return false;
  }

  // Verify signature
  const isValid = await verifyMessageSignature(message, publicKey);
  if (!isValid) {
    console.error('Message signature verification failed');
    return false;
  }

  return true;
}

/**
 * Generate message ID (UUID v4)
 */
export function generateMessageId(): string {
  return crypto.randomUUID();
}

/**
 * Hash data using SHA-256
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
