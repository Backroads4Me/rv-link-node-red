// Encodes HA lock entity commands to RV-C LOCK_COMMAND (DGN 1FEE4)
// Handles lock entity LOCK/UNLOCK commands only
// Outputs in standard CAN bus format for 'can/send' topic.

// --- Configuration ---
const SOURCE_ADDRESS = global.get("rvc_source_address") || 254;
const PRIORITY = 6;
const DGN = "1FEE4";

// 1. Get pre-parsed instance and command from the decoder function
const instance = msg.instance;
const haCommand = msg.command; // Will be "LOCK" or "UNLOCK"

// Accept Instance 0 (broadcast to all locks) per RV-C spec section 6.40.1
if (typeof instance !== 'number' || instance < 0 || instance > 250) {
    node.warn(`Invalid or missing instance number in msg.instance: ${instance}`);
    return null;
}

// 2. Parse command from lock entity
let lockCommand;

switch (haCommand) {
    case 'UNLOCK':
        lockCommand = 0; // Unlock
        break;
    case 'LOCK':
        lockCommand = 1; // Lock
        break;
    default:
        node.warn('Unknown lock command from lock entity: ' + haCommand);
        return null;
}

// 3. Build the 8-byte data payload
const dataBytes = new Array(8).fill(0xFF);

dataBytes[0] = instance;            // Instance Number
dataBytes[1] = lockCommand;         // Lock Command (0=unlock, 1=lock)
dataBytes[2] = 0;                   // Additional Command (0=no action)
dataBytes[3] = 0xFF;                // Byte 4 (Not Available)
dataBytes[4] = 0xFF;                // Byte 5 (Not Available)
dataBytes[5] = 0xFF;                // Byte 6 (Not Available)
dataBytes[6] = 0xFF;                // Byte 7 (Not Available)
dataBytes[7] = 0xFF;                // Byte 8 (Not Available)

const dataHex = dataBytes.map(byte => byte.toString(16).padStart(2, '0')).join('');

// 4. Construct the CAN ID
const dgnInt = parseInt(DGN, 16);
const canIdInt = (PRIORITY << 26) | (dgnInt << 8) | SOURCE_ADDRESS;
const canIdHex = canIdInt.toString(16).padStart(8, '0');

// 5. Construct the final output message in CAN bus format
msg.topic = "can/send";
msg.payload = `${canIdHex.toUpperCase()}#${dataHex.toUpperCase()}`;

return msg;
