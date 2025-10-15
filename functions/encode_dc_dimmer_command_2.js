// Encodes HA switch commands to the specific toggle format required by the dimmer.
// Implements two-message sequence: UNLOCK + TOGGLE
// Returns null after sequential transmission

// --- Configuration ---
const RVC_COMMAND = 0x05; // The specific command type for the toggle.
const CMD_UNLOCK = 0x22;  // Remove lock condition
const LEVEL_ON = 250;     // The brightness level sent by the physical switch (0xFA).
const NON_GROUP = 0xFF;
const SOURCE_ADDRESS = global.get("rvc_source_address") || 254;
const PRIORITY = 6;
const DGN = "1FEDB";

const instance = msg.instance;
const state = msg.command; // "ON" or "OFF"

if (typeof instance !== 'number' || instance < 1 || instance > 250) {
    node.warn(`[encode_switch_command] Invalid instance: ${instance}`);
    return null;
}

// Helper function to build CAN message
function buildCanMessage(instance, desiredLevel, commandCode) {
    // Build the 8-byte data payload to EXACTLY match the physical switch
    const dataBytes = new Array(8).fill(0xFF);
    dataBytes[0] = instance;
    dataBytes[1] = NON_GROUP;
    dataBytes[2] = desiredLevel;
    dataBytes[3] = commandCode;
    dataBytes[4] = 0xFF; // Delay/Duration
    dataBytes[5] = 0x00; // Interlock
    dataBytes[6] = 0xFF; // Ramp Time
    dataBytes[7] = 0xFF; // Reserved

    const dataHex = dataBytes.map(byte => byte.toString(16).padStart(2, '0')).join('');

    // Construct the CAN ID
    const dgnInt = parseInt(DGN, 16);
    const canIdInt = (PRIORITY << 26) | (dgnInt << 8) | SOURCE_ADDRESS;
    const canIdHex = canIdInt.toString(16).padStart(8, '0');

    return `${canIdHex.toUpperCase()}#${dataHex.toUpperCase()}`;
}

// This is a toggle command. The payload is the same for both ON and OFF.
// The desiredLevel is always the 'ON' level (250) sent by the physical switch.
const desiredLevel = LEVEL_ON;

// Build Message 1: UNLOCK
const unlockMessage = {
    topic: "can/send",
    payload: buildCanMessage(instance, desiredLevel, CMD_UNLOCK)
};

// Build Message 2: TOGGLE
const toggleMessage = {
    topic: "can/send",
    payload: buildCanMessage(instance, desiredLevel, RVC_COMMAND)
};

// Send both messages sequentially using node.send()
// This ensures both messages go to the same output port in order
node.send(unlockMessage);
node.send(toggleMessage);

// Return null to prevent duplicate sending
return null;