"use strict";
/**
 * Message Signing and Verification Utilities
 * Implements ECDSA SHA-256 signing for Car-to-Cloud messages
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSigningKeys = getSigningKeys;
exports.generateKeyPair = generateKeyPair;
exports.signMessage = signMessage;
exports.verifyMessageSignature = verifyMessageSignature;
exports.validateMessageTimestamp = validateMessageTimestamp;
exports.signAndAddSignature = signAndAddSignature;
exports.verifyMessage = verifyMessage;
exports.generateMessageId = generateMessageId;
exports.hashData = hashData;
const crypto = __importStar(require("crypto"));
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
// Message expiration window (5 minutes)
const MESSAGE_EXPIRATION_MS = 5 * 60 * 1000;
/**
 * Get signing keys from AWS Secrets Manager
 */
async function getSigningKeys() {
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
    const client = new client_secrets_manager_1.SecretsManagerClient({ region });
    try {
        const response = await client.send(new client_secrets_manager_1.GetSecretValueCommand({
            SecretId: secretName,
        }));
        if (!response.SecretString) {
            throw new Error('Secret value is empty');
        }
        const secret = JSON.parse(response.SecretString);
        return {
            privateKey: secret.privateKey,
            publicKey: secret.publicKey,
        };
    }
    catch (error) {
        console.error('Failed to retrieve signing keys:', error);
        throw new Error(`Failed to retrieve signing keys: ${error.message}`);
    }
}
/**
 * Generate ECDSA key pair for development/testing
 */
function generateKeyPair() {
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
function createSigningPayload(message) {
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
function sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }
    const sorted = {};
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
async function signMessage(message, privateKey) {
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
    }
    catch (error) {
        console.error('Message signing failed:', error);
        throw new Error(`Failed to sign message: ${error.message}`);
    }
}
/**
 * Verify message signature using ECDSA SHA-256
 */
async function verifyMessageSignature(message, publicKey) {
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
    }
    catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
}
/**
 * Validate message timestamp (not too old or in future)
 */
function validateMessageTimestamp(timestamp) {
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
    }
    catch (error) {
        return false;
    }
}
/**
 * Sign and add signature to message
 */
async function signAndAddSignature(message, privateKey) {
    const signature = await signMessage(message, privateKey);
    return {
        ...message,
        signature,
    };
}
/**
 * Verify complete message (signature + timestamp)
 */
async function verifyMessage(message, publicKey) {
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
function generateMessageId() {
    return crypto.randomUUID();
}
/**
 * Hash data using SHA-256
 */
function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}
//# sourceMappingURL=signing.js.map