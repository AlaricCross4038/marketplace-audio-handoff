import assert from "node:assert/strict";
import { decideHandoff, HandoffRequest } from "./marketplace_handoff.js";

const input = HandoffRequest.parse({ orderId: "o1", sellerId: "s1", audioAssetId: "a1", transcript: "Package delivered to the buyer." });
const result = decideHandoff(input, "Your package is delivered.");
assert.equal(result.state, "buyer_update");
assert.equal(result.orderId, "o1");
console.log("handoff decision test passed");
