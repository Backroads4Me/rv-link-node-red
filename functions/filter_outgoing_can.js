// Filters raw incoming CAN messages to ONLY pass messages sent by this HA system
// Shows ALL messages transmitted by HA regardless of DGN type
// Input: msg.payload (string) - raw CAN message e.g., "19FEDB8C#03FFC805FF00FFFF"
// Output: null (block) or original msg (pass through)

const originalMessage = msg.payload;

// Validate input
if (!originalMessage || typeof originalMessage !== 'string') {
    return null;
}

// Parse CAN message format: CANID#PAYLOAD
const parts = originalMessage.split('#');
if (parts.length !== 2) {
    return null;
}

const canId = parts[0];

// Parse CAN ID as hexadecimal
const canIdNum = parseInt(canId, 16);
if (isNaN(canIdNum)) {
    return null;
}

// Extract Source Address (lowest 8 bits of CAN ID)
const sourceAddress = canIdNum & 0xFF;

// Get the RVC source address claimed by this HA system
const ourSourceAddress = global.get("rvc_source_address");

// ONLY allow messages from our claimed source address
if (sourceAddress === ourSourceAddress) {
    return msg;
}

// Block all other messages
return null;