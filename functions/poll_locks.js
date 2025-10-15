// Generates an RV-C "Request" message to poll all locks for their status.
// DGN 18EAFF is a broadcast request.
// Payload contains the DGN of the status to be returned (1FEE5).

// --- Configuration ---
// The source address of this Node-RED system.
const SOURCE_ADDRESS = global.get("rvc_source_address") || 254;
const PRIORITY = 6;       // Standard priority for requests
const DGN = "18EAFF";     // DGN for a broadcast request message

// 1. Build the data payload
// This is the DGN for LOCK_STATUS (1FEE5), sent in little-endian format (least-significant byte first).
const dataPayload = "E5FE01FFFFFFFF";

// 2. Construct the CAN ID
const dgnInt = parseInt(DGN, 16);
const canIdInt = (dgnInt << 8) | SOURCE_ADDRESS;
const canIdHex = canIdInt.toString(16).padStart(8, '0');

// 3. Construct the final output message in CAN bus format
msg.topic = "can/send";
msg.payload = `${canIdHex.toUpperCase()}#${dataPayload.toUpperCase()}`;

//node.warn(`[Poll Locks] Sending global request for lock status. CAN: ${msg.payload}`);

return msg;
