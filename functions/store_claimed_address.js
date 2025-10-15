// RV-C Store Claimed Address Function
// Called after 250ms timer expires - broadcasts ADDRESS_CLAIMED and stores address
// Reference: RV-C Spec Section 3.3.2 - Source Address Claiming

// Check if claim is still in progress
const claimInProgress = flow.get("claim_in_progress");
if (!claimInProgress) {
    node.warn("Claim already aborted due to conflict");
    return null;
}

// Get the address we successfully claimed
const claimedAddress = flow.get("claiming_address");

if (claimedAddress === undefined || claimedAddress === null) {
    node.error("No address to claim - claiming process not started properly");
    return null;
}

// Build ADDRESS_CLAIMED message
// DGN: EE00 (ADDRESS_CLAIMED)
// Data: 8-byte ADDRESS_CLAIM identifier per RV-C Spec 3.3.3

const DGN = "EE00";
const priority = 6; // Standard priority
const dgnHigh = "EE";
const dgnLow = "00";

// Construct CAN ID with our newly claimed source address
const priorityBits = (priority << 26) >>> 0;
const dgnHighBits = (parseInt(dgnHigh, 16) << 18) >>> 0;
const dgnLowBits = (parseInt(dgnLow, 16) << 8) >>> 0;
const sourceAddressBits = claimedAddress; // Use claimed address as source

const canId = (priorityBits | dgnHighBits | dgnLowBits | sourceAddressBits) >>> 0;
const canIdHex = canId.toString(16).padStart(8, '0').toUpperCase();

// ADDRESS_CLAIM data field (8 bytes)
// This is a simplified implementation - for production, should include:
// - Arbitrary Address Capable (1 bit)
// - Industry Group (3 bits)
// - Device Class Instance (4 bits)
// - Device Class (7 bits)
// - Reserved (1 bit)
// - Device Function (8 bits)
// - Device Function Instance (5 bits)
// - Manufacturer Code (11 bits)
// - Identity Number (21 bits)
//
// For now, using a generic identifier for a diagnostic/display node
// Bit 0 (LSB of byte 0) = 1 (Arbitrary Address Capable - we can dynamically claim)
// Remaining bits: Generic values for a Node-RED controller/diagnostic device

const addressClaimData = "C3A1F00700000000"; // Generic diagnostic device identifier

// Construct CAN message
const canMessage = `${canIdHex}#${addressClaimData}`;

// Store the claimed address to global context
global.set("rvc_source_address", claimedAddress);

// Clear claiming flags
flow.set("claim_in_progress", false);
flow.set("claiming_address", null);

// Prepare output message for MQTT
msg.payload = canMessage;
msg.topic = "can/tx"; // Adjust to your MQTT transmit topic

node.warn(`Successfully claimed address ${claimedAddress} (0x${claimedAddress.toString(16).toUpperCase()})`);
node.warn(`Address stored to global.rvc_source_address: ${claimedAddress}`);

return msg;