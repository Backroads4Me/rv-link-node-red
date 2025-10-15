// status_dc_dimmer_3.js

// Validate basic input structure
if (!msg.payload || typeof msg.payload !== 'object') {
    node.error("Input payload must be an object.", msg);
    return null;
}

const instance = msg.payload.instance;
const statusValue = msg.payload.load_status;

// Validate required fields
if (typeof instance !== 'number') {
    node.error("Input missing 'instance' (number).", msg);
    return null;
}

if (typeof statusValue !== 'string') {
    node.error("DC_DIMMER_STATUS_3 missing 'load_status' (string).", msg);
    return null;
}

// DC Dimmer: Check if load_status contains "Off"
const haStatus = statusValue.includes("Off") ? "OFF" : "ON";

// Get the override list to determine the correct component type
const overrides = global.get('entityOverrides') || {};
const componentType = overrides[instance] || 'light'; // Default to 'light'

// Construct the MQTT topic with the correct component type
const stateTopic = `homeassistant/${componentType}/switch_${instance}/state`;

// Prepare the final message
msg.topic = stateTopic;
msg.retain = true; // Retain the status so HA shows the correct state after a restart

// Format the payload based on the component type
if (componentType === 'fan') {
    // Fans expect a JSON payload because of the state_value_template
    msg.payload = { "state": haStatus };
} else {
    // Lights and switches work with a simple string
    msg.payload = haStatus;
}

return msg;