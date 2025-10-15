/***********************************************************
 * HA Battery Status Updater
 * Takes a JSON payload as input and sends battery voltage updates
 * to the correct Home Assistant MQTT state topic for battery sensor entities.
 * Expects input msg.payload to be an object with:
 * - msg.payload.instance (Number): The numeric battery instance ID.
 * - msg.payload.dc_voltage_V (Number): Battery voltage in volts.
 ***********************************************************/

// Validate voltage availability - if it's "Not Available" string, skip
if (msg.payload?.dc_voltage_V === "Not Available" || msg.dc_voltage_V === "Not Available") {
    return null; // Stop the flow if voltage data not available
}

// Extract values with fallback support
const dcInstanceId = msg.payload?.instance ?? msg.instance;
const voltageValue = msg.payload?.dc_voltage_V ?? msg.dc_voltage_V;

// Validate DC instance ID
if (dcInstanceId === undefined || dcInstanceId === null) {
    node.error("Input missing 'instance'.", msg);
    return null; // Stop the flow
}

// Map instance ID to entity suffix (must match create_battery.js)
const batteryMap = {
    0: "0",
    1: "house",
    2: "chassis",
    3: "house2",
    4: "generator"
};

// For instances 5-250, use numeric suffix
let entitySuffix;
if (dcInstanceId >= 5 && dcInstanceId <= 250) {
    entitySuffix = dcInstanceId.toString();
} else {
    entitySuffix = batteryMap[dcInstanceId] || dcInstanceId.toString();
}

// Validate voltage value
if (typeof voltageValue !== 'number') {
    node.error("Input missing 'dc_voltage_V' (number).", msg);
    return null; // Stop the flow
}

// Ensure voltage is within reasonable range and round to 2 decimal places
const voltage = Math.max(0, Math.min(50, Math.round(voltageValue * 100) / 100));

// Create the state topic for this battery instance
const stateTopic = `homeassistant/sensor/battery_${entitySuffix}/state`;

msg.topic = stateTopic;
msg.payload = voltage; // The payload is the numeric voltage value
msg.retain = true; // Retain the status so HA shows the correct state after a restart

// Add debug information for troubleshooting
msg.debug_info = {
    instance: dcInstanceId,
    entity_suffix: entitySuffix,
    calculated_voltage: voltage,
    raw_voltage_V: voltageValue
};

return msg;