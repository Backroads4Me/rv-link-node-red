// === Full Node-RED Function (with all helpers) ===

// Helper Functions
function decodeBits(value, startBit, endBit) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit;
    return (value & mask) >> startBit;
}
function decodeRampTime(value) {
    if (value === 0) return 0;
    if (value >= 1 && value <= 250) return parseFloat((value * 0.1).toFixed(1));
    if (value === 255) return "Not Available";
    return "Invalid";
}
function decodeDesiredLevel(value) {
    if (value >= 0 && value <= 200) return parseFloat((value * 0.5).toFixed(1));
    if (value >= 230 && value <= 249) return `Scene ${value - 229}`;
    if (value === 250) return "Dimmed Memory";
    if (value === 251) return "Master Memory";
    if (value === 255) return "Not Available";
    return "Invalid";
}
function getGroupDetails(value) {
    if (value === 0xFF) return { type: 'special', description: 'No data' };
    if (value & 0x80) return { type: 'non-group', description: 'Non-group or Node Group command' };
    if (value === 0x00) return { type: 'special', description: 'Member of all groups' };
    const groups = []; const groupBits = value & 0x7F;
    for (let bit = 0; bit < 7; bit++) { if (!(groupBits & (1 << bit))) { groups.push(bit + 1); } }
    return { type: 'standard', groups: groups, description: groups.length > 0 ? `Groups: ${groups.join(', ')}` : "No group membership"};
}
function decodeDelayDuration(value) {
    if (value >= 0 && value <= 240) return `${value} seconds`;
    if (value >= 241 && value <= 250) return `${value - 236} minutes`;
    if (value === 255) return "Continuous";
    return "Invalid";
}
function decodeCommand(value) {
    const commands = { 0: "Set Level (Delay)", 1: "On (Duration)", 2: "On (Delay)", 3: "Off (Delay)", 4: "Stop", 5: "Toggle", 6: "Memory Off", 7: "Save Scene", 11: "Ramp Brightness", 12: "Ramp Toggle", 13: "Ramp Up", 14: "Ramp Down", 15: "Ramp Up/Down", 16: "Ramp Up/Down Toggle", 21: "Lock", 22: "Unlock", 31: "Flash", 32: "Flash Momentary" };
    return commands[value] || `unknown command: ${value}`;
}

// Main Decode Function (Updated for July 31, 2025 Spec)
function decodeDcDimmerCommand2Message(dgn, data) {
    const result = {};
    if (data.length < 7) return { error: "Invalid data length for DGN 1FEDBh" };
    result.instance = data[0]; // [cite: 269]
    const groupDetails = getGroupDetails(data[1]); // [cite: 269]
    result.group_description = groupDetails.description;
    result.desired_level = decodeDesiredLevel(data[2]); // [cite: 269]
    result.command = decodeCommand(data[3]); // [cite: 269]
    result.delay_duration = decodeDelayDuration(data[4]); // 
    const interlockValue = decodeBits(data[5], 0, 1); // 
    const interlocks = { 0: "No Interlock active", 1: "Interlock A", 2: "Interlock B" };
    result.interlock = interlocks[interlockValue] || "Invalid";
    result.ramp_time = decodeRampTime(data[6]); // 
    return result;
}

// === Main Logic ===
const incomingPayload = msg.payload;
const { dgn, dataPayload } = incomingPayload;
const dataBytes = [];
for (let i = 0; i < dataPayload.length; i += 2) {
    dataBytes.push(parseInt(dataPayload.substring(i, i + 2), 16));
}

let decodedData;
if (dgn === '1FEDB') {
    decodedData = decodeDcDimmerCommand2Message(dgn, dataBytes);
} else {
    decodedData = { error: `Decoder for DGN ${dgn} is not implemented.` };
}

msg.payload = { ...incomingPayload, ...decodedData };
delete msg.payload.dataPayload;
return msg;