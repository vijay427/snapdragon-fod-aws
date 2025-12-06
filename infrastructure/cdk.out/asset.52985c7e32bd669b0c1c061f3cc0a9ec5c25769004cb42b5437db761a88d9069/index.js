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

// ../src/lambda/catalog-handler/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
async function handler(event) {
  console.log("Catalog request received:", JSON.stringify(event));
  try {
    const mockFeatures = [
      {
        featureId: "SPORT_MODE",
        name: "Sport Mode",
        description: "Enhanced performance and handling with aggressive throttle response",
        price: 99.99,
        duration: 48,
        category: "PERFORMANCE",
        isActive: true
      },
      {
        featureId: "CONNECTIVITY_5G",
        name: "5G Connectivity",
        description: "Ultra-fast 5G network access for seamless connectivity",
        price: 299.99,
        duration: 0,
        category: "CONNECTIVITY",
        isActive: true
      },
      {
        featureId: "PREMIUM_AUDIO",
        name: "Premium Audio System",
        description: "High-fidelity audio with surround sound",
        price: 199.99,
        duration: 0,
        category: "INFOTAINMENT",
        isActive: true
      },
      {
        featureId: "AUTOPILOT",
        name: "Advanced Autopilot",
        description: "Advanced driver assistance with lane keeping and adaptive cruise",
        price: 499.99,
        duration: 168,
        category: "SAFETY",
        isActive: true
      },
      {
        featureId: "ECO_MODE",
        name: "Eco Mode",
        description: "Optimized for fuel efficiency and range",
        price: 49.99,
        duration: 72,
        category: "PERFORMANCE",
        isActive: true
      }
    ];
    console.log(`Returning ${mockFeatures.length} mock features`);
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
          features: mockFeatures,
          count: mockFeatures.length
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })
    };
  } catch (error) {
    console.error("Catalog fetch failed:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Internal server error"
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
