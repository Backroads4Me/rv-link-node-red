// Standard RV-C WATER_PUMP_STATUS Decoder
// Decodes the standard DGN 1FFB3h to a simple "on" or "off" status.

// Validate input payload from the CAN bus node
if (!msg.payload || typeof msg.payload.dataPayload !== 'string') {
    node.warn('Invalid payload: expected object with dataPayload string.');
    return null;
}

const dataPayload = msg.payload.dataPayload;

// We only need the first byte for the status
if (dataPayload.length < 2) {
    node.warn("Data payload is too short to decode.");
    return null;
}

// Get the first byte and parse it
const firstByte = parseInt(dataPayload.substring(0, 2), 16);

// Extract the first two bits (00-11) which represent the operating status
const statusBits = firstByte & 0x03; // Mask to get only the first two bits

// Per the RV-C spec, a value of 1 means "enabled"
const finalStatus = (statusBits === 1) ? "ON" : "OFF";

// Prepare the payload for the downstream status updater node
msg.payload = {
    ...msg.payload, // Keep the original message data
    instance: "water_pump",
    status: finalStatus
};

return msg;