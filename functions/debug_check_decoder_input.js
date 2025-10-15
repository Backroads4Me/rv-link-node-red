// Debug function to check what decoder functions are receiving
// Place this IMMEDIATELY before your decode_dc_dimmer_status_3,
// decode_water_pump_status, and decode_autofill_status functions

if (!msg.payload) {
    node.warn("DEBUG: msg.payload is missing entirely!");
    return null;
}

if (typeof msg.payload !== 'object') {
    node.warn("DEBUG: msg.payload is not an object, it's: " + typeof msg.payload);
    return null;
}

// Log what fields are present
const fields = Object.keys(msg.payload);
node.warn("DEBUG: msg.payload fields present: " + fields.join(", "));

// Check specific required fields
if (!msg.payload.dgn) {
    node.warn("DEBUG: msg.payload.dgn is missing or falsy. Value: " + msg.payload.dgn);
}

if (!msg.payload.dataPayload) {
    node.warn("DEBUG: msg.payload.dataPayload is missing or falsy. Value: " + msg.payload.dataPayload);
}

// Log the actual values
node.warn("DEBUG: dgn = " + msg.payload.dgn);
node.warn("DEBUG: dataPayload = " + msg.payload.dataPayload);
node.warn("DEBUG: dgnName = " + msg.payload.dgnName);

// Pass through unchanged
return msg;
