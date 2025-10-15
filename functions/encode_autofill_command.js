// Encodes an HA ON/OFF command to a universal RV-C AUTOFILL_COMMAND.

// --- Configuration ---
const SOURCE_ADDRESS = global.get("rvc_source_address") || 254;
const PRIORITY = 6;
const DGN = "1FFB0"; // AUTOFILL_COMMAND

// 1. Get command from the HA parser
const state = msg.command; // Will be "ON" or "OFF"
let commandValue;

switch (state) {
    case 'ON':
        // Universal ON command that works on standard and non-standard systems
        commandValue = 0xFD;
        break;
    case 'OFF':
        // Universal OFF command
        commandValue = 0xFC;
        break;
    default:
        node.warn(`[encode_autofill_command] Invalid command: "${state}".`);
        return null;
}

// 2. Build the 8-byte data payload
const dataBytes = new Array(8).fill(0xFF);
dataBytes[0] = commandValue;

const dataHex = dataBytes.map(byte => byte.toString(16).padStart(2, '0')).join('');

// 3. Construct the CAN ID
const dgnInt = parseInt(DGN, 16);
const canIdInt = (PRIORITY << 26) | (dgnInt << 8) | SOURCE_ADDRESS;
const canIdHex = canIdInt.toString(16).padStart(8, '0');

// 4. Construct the final output message
msg.topic = "can/send";
msg.payload = `${canIdHex.toUpperCase()}#${dataHex.toUpperCase()}`;
return msg;