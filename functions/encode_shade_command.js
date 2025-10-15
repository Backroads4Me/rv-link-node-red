// Encodes HA cover commands (OPEN/CLOSE/STOP) to RV-C WINDOW_SHADE_CONTROL_COMMAND
// Outputs in standard CAN bus format for 'can/send' topic.

// --- Configuration ---
const SOURCE_ADDRESS = global.get("rvc_source_address") || 254;
const PRIORITY = 6;
const DGN = "1FEDF";

// 1. Get pre-parsed instance and command from the decoder function
const instance = msg.instance;
const haCommand = msg.command; // Will be "OPEN", "CLOSE", or "STOP"

if (typeof instance !== 'number' || instance < 1 || instance > 250) {
    node.warn(`Invalid or missing instance number in msg.instance: ${instance}`);
    return null;
}

// 2. Determine RV-C command code and parameters
let command;
let duration = 30; // 30 seconds duration (matches switch panel)

switch (haCommand) {
    case 'OPEN':
        command = 0x85; // Toggle Forward (Raise/Open) - if off, turn on forward; if on, toggles
        break;
    case 'CLOSE':
        command = 0x45; // Toggle Reverse (Lower/Close) - if off, turn on reverse; if on, toggles
        break;
    case 'STOP':
        command = 0x04; // Stop
        duration = 0;   // Duration is ignored for STOP, but set for clarity
        break;
    default:
        node.warn('Unknown shade command from cover entity: ' + haCommand);
        return null;
}

// 3. Build the 8-byte data payload
const motorDuty = 200; // Use 200% motor duty (matches switch panel)
const dataBytes = new Array(8).fill(0xFF);

dataBytes[0] = instance;            // Instance Number
dataBytes[1] = 0xFF;                // Group (Non-group command)
dataBytes[2] = motorDuty;           // Motor Duty Cycle
dataBytes[3] = command;             // Command Code
dataBytes[4] = duration;            // Duration
dataBytes[5] = 0x00;                // Interlock (No Interlock)
dataBytes[6] = 0xFF;                // Not Available
dataBytes[7] = 0xFF;                // Not Available

const dataHex = dataBytes.map(byte => byte.toString(16).padStart(2, '0')).join('');

// 4. Construct the CAN ID
const dgnInt = parseInt(DGN, 16);
const canIdInt = (PRIORITY << 26) | (dgnInt << 8) | SOURCE_ADDRESS;
const canIdHex = canIdInt.toString(16).padStart(8, '0');

// 5. Construct the final output message in CAN bus format
msg.topic = "can/send";
msg.payload = `${canIdHex.toUpperCase()}#${dataHex.toUpperCase()}`;

return msg;