// Encodes a simple HA ON/OFF command to an RV-C WATER_PUMP_COMMAND.
// This function is for a standard, single-instance water pump.

// --- Configuration ---
const SOURCE_ADDRESS = global.get("rvc_source_address") || 254;
const PRIORITY = 6;
const DGN = "1FFB2"; // WATER_PUMP_COMMAND DGN

// 1. Get the command from the input message
const state = msg.command; // Expects "ON" or "OFF"

// 2. Determine the command value based on the state
let pumpCommandValue;
switch (state) {
    case 'ON':
        pumpCommandValue = 1; // 01b = Enable pump (standby)
        break;
    case 'OFF':
        pumpCommandValue = 0; // 00b = Disable pump
        break;
    default:
        node.warn(`[encode_pump_command] Invalid command: "${state}". Expected "ON" or "OFF".`);
        return null;
}

// 3. Build the 8-byte data payload
// Byte 0 contains the command. All other bytes are set to 0xFF (Not Available)
// as we are not setting pressure or other parameters.
const dataBytes = new Array(8).fill(0xFF);
dataBytes[0] = pumpCommandValue;

const dataHex = dataBytes.map(byte => byte.toString(16).padStart(2, '0')).join('');

// 4. Construct the CAN ID from Priority, DGN, and Source Address
const dgnInt = parseInt(DGN, 16);
const canIdInt = (PRIORITY << 26) | (dgnInt << 8) | SOURCE_ADDRESS;
const canIdHex = canIdInt.toString(16).padStart(8, '0');

// 5. Construct the final output message in 'can/send' format
msg.topic = "can/send";
msg.payload = `${canIdHex.toUpperCase()}#${dataHex.toUpperCase()}`;

// Debug output
node.warn(`[encode_pump_command] State: ${state} | CAN: ${msg.payload}`);

return msg;