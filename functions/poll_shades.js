// --- Configuration ---
// The source address of this Node-RED system.
const SOURCE_ADDRESS = global.get("rvc_source_address") || 254; // 0xFE
const PRIORITY = 6;
const REQUESTED_DGN = "01FEDE"; // The DGN for WINDOW_SHADE_CONTROL_STATUS
const BROADCAST_ADDRESS = 255;  // The destination address for a global request (0xFF)

// --- Logic ---

// 1. Build the data payload
// The payload is the DGN being requested, sent in 3-byte little-endian format.
// The remaining 5 bytes are padded with 0xFF.
const requestedDgnInt = parseInt(REQUESTED_DGN, 16);
const dataPayloadBytes = new Uint8Array(8);
dataPayloadBytes.fill(0xFF); // Pad the entire payload with 0xFF first
dataPayloadBytes[0] = requestedDgnInt & 0xFF;         // Byte 1: DE
dataPayloadBytes[1] = (requestedDgnInt >> 8) & 0xFF;  // Byte 2: FE
dataPayloadBytes[2] = (requestedDgnInt >> 16) & 0xFF; // Byte 3: 01
const dataPayloadHex = Array.from(dataPayloadBytes).map(b => b.toString(16).padStart(2, '0')).join('');

// 2. Determine the PGN for the request message itself
// A J1939 request PGN is 0xEA00. The destination address is placed in the second byte.
const requestPgn = 0xEA00 | BROADCAST_ADDRESS; // This results in 0xEAFF

// 3. Construct the full 29-bit CAN ID from its parts
// Formula: (Priority << 26) | (PGN << 8) | Source Address
const canIdInt = (PRIORITY << 26) | (requestPgn << 8) | SOURCE_ADDRESS;
const canIdHex = canIdInt.toString(16).padStart(8, '0');

// 4. Construct the final output message in CAN bus format
msg.topic = "can/send";
msg.payload = `${canIdHex.toUpperCase()}#${dataPayloadHex.toUpperCase()}`;

// node.warn(`[Poll Shades] Sending global request for shade status. CAN: ${msg.payload}`);

return msg;
