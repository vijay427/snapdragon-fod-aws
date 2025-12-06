"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../src/lambda/get-vehicle-features-handler/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);

// ../src/shared/models/Errors.ts
var FODError = class extends Error {
  constructor(message, code, statusCode = 500, details) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = "FODError";
    Error.captureStackTrace(this, this.constructor);
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details
    };
  }
};
var ValidationError = class extends FODError {
  constructor(field, reason) {
    super(
      `Validation failed for ${field}: ${reason}`,
      "VALIDATION_ERROR",
      400,
      { field, reason }
    );
    this.name = "ValidationError";
  }
};
function isFODError(error) {
  return error instanceof FODError;
}
function toFODError(error) {
  if (isFODError(error)) {
    return error;
  }
  if (error instanceof Error) {
    return new FODError(
      error.message,
      "INTERNAL_ERROR",
      500,
      { originalError: error.name }
    );
  }
  return new FODError(
    "An unknown error occurred",
    "UNKNOWN_ERROR",
    500,
    { error: String(error) }
  );
}

// ../src/lambda/get-vehicle-features-handler/index.ts
async function handler(event) {
  console.log("Get vehicle features request received:", JSON.stringify(event));
  try {
    const vehicleId = event.pathParameters?.vehicleId;
    if (!vehicleId) {
      throw new ValidationError("vehicleId", "Vehicle ID is required in path");
    }
    console.log("Fetching features for vehicle:", vehicleId);
    const mockFeatures = [
      {
        subscriptionId: "sub_mock_001",
        featureId: "SPORT_MODE",
        featureName: "Sport Mode",
        featureDescription: "Enhanced performance and handling",
        status: "ACTIVE",
        activatedAt: new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString(),
        purchasedAt: new Date(Date.now() - 48 * 60 * 60 * 1e3).toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
        isPermanent: false,
        autoRenew: false
      },
      {
        subscriptionId: "sub_mock_002",
        featureId: "CONNECTIVITY_5G",
        featureName: "5G Connectivity",
        featureDescription: "Ultra-fast 5G network access",
        status: "ACTIVE",
        activatedAt: new Date(Date.now() - 72 * 60 * 60 * 1e3).toISOString(),
        purchasedAt: new Date(Date.now() - 96 * 60 * 60 * 1e3).toISOString(),
        expiresAt: void 0,
        isPermanent: true,
        autoRenew: false
      }
    ];
    console.log(`Returning ${mockFeatures.length} mock features for vehicle ${vehicleId}`);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
      },
      body: JSON.stringify({
        success: true,
        data: {
          vehicleId,
          features: mockFeatures,
          count: mockFeatures.length
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })
    };
  } catch (error) {
    console.error("Get vehicle features failed:", error);
    const fodError = isFODError(error) ? error : toFODError(error);
    return {
      statusCode: fodError.statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: fodError.code,
          message: fodError.message,
          details: fodError.details
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=index.js.map
