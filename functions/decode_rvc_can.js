// RVC CAN Message Parser
// Decodes a raw CAN message to output only the fields needed for
// downstream routing (dgnName) and decoding (dataPayload).
// Input: msg.payload (string) - e.g., "19FEDA8C#3AFF00FDFF2100FF"
// Output: msg.payload (object) with essential fields

const originalMessage = msg.payload;

// 1. Validate input
if (!originalMessage || typeof originalMessage !== 'string') {
    node.warn("Invalid message payload: expected string, got " + typeof originalMessage);
    return null;
}
const dgnMap = global.get('dgnMap');
if (!dgnMap) {
    node.error("dgnMap not found in global context. Ensure the map is initialized.");
    return null;
}

// 2. Parse CAN message format: CANID#PAYLOAD
const parts = originalMessage.split('#');
if (parts.length !== 2) {
    node.warn("Invalid CAN message format: " + originalMessage);
    return null;
}
const canIdHex = parts[0];
const dataPayload = parts[1];
const canIdNum = parseInt(canIdHex, 16);

if (isNaN(canIdNum)) {
    node.warn("Invalid CAN ID: " + canIdHex);
    return null;
}

// 3. Determine the DGN and its name
let dgn = ((canIdNum >> 8) & 0x1FFFF).toString(16).toUpperCase();
let dgnName = dgnMap.get(dgn);

// Fallback logic for alternate DGN formats
if (!dgnName && dgn.length === 4) {
    const alternateDgn = '1' + dgn;
    const alternateName = dgnMap.get(alternateDgn);
    if (alternateName) {
        dgn = alternateDgn;
        dgnName = alternateName;
    }
}

// Fallback for proprietary names
if (!dgnName) {
    if (dgn === 'EF64') {
        dgnName = "AQUAHOT";
    } else if (dgn.startsWith('EF')) {
        dgnName = "PROPRIETARY";
    }
}

// Default to UNKNOWN if no name is found
if (!dgnName) {
    dgnName = "UNKNOWN";
}

// 4. Create the simplified output object
msg.payload = {
    originalMessage: originalMessage,
    dgn: dgn,
    dgnName: dgnName,
    dataPayload: dataPayload
};

return msg;