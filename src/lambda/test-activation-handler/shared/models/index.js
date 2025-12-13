"use strict";
/**
 * Models Index
 * Central export point for all data models
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBaseMessage = exports.createFeatureDeactivationMessage = exports.createFeatureActivationMessage = void 0;
// Feature model
__exportStar(require("./Feature"), exports);
// Subscription model
__exportStar(require("./Subscription"), exports);
// Transaction model
__exportStar(require("./Transaction"), exports);
// Message models (excluding FeatureType to avoid conflict)
var Messages_1 = require("./Messages");
Object.defineProperty(exports, "createFeatureActivationMessage", { enumerable: true, get: function () { return Messages_1.createFeatureActivationMessage; } });
Object.defineProperty(exports, "createFeatureDeactivationMessage", { enumerable: true, get: function () { return Messages_1.createFeatureDeactivationMessage; } });
Object.defineProperty(exports, "validateBaseMessage", { enumerable: true, get: function () { return Messages_1.validateBaseMessage; } });
// Error types
__exportStar(require("./Errors"), exports);
