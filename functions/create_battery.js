/***********************************************************
 * Battery MQTT Discovery for Home Assistant
 * Creates a sensor entity based on battery instance input.
 * Expects msg.payload to be a number (e.g., 1) or DC instance string (e.g., "Main House Battery Bank").
 * Example Input: msg.payload = 1 or msg.payload = "Main House Battery Bank"
 * Resulting Entity ID: battery_1, battery_2, etc.
 ***********************************************************/

// Accept numeric instance ID from unique_batteries.js
if (typeof msg.payload !== 'number') {
    node.error("Input payload must be a number (instance ID).", msg);
    return null;
}

const instanceId = msg.payload;

// Map instance ID to entity suffix and display name per RV-C specification
const batteryMap = {
    0: { suffix: "0", name: "Invalid" },
    1: { suffix: "house", name: "Main House Battery" },
    2: { suffix: "chassis", name: "Chassis Battery" },
    3: { suffix: "house2", name: "Secondary House Battery" },
    4: { suffix: "generator", name: "Generator Battery" }
};

// For instances 5-250, use generic "battery_X" naming
let entitySuffix;
let displayName;
if (instanceId >= 5 && instanceId <= 250) {
    entitySuffix = instanceId.toString();
    displayName = `Battery ${instanceId}`;
} else {
    const batteryInfo = batteryMap[instanceId] || { suffix: instanceId.toString(), name: `Unknown Battery ${instanceId}` };
    entitySuffix = batteryInfo.suffix;
    displayName = batteryInfo.name;
}

const entityId = `battery_${entitySuffix}`;
const componentType = "sensor";

const discoveryTopic = `homeassistant/${componentType}/${entityId}/config`;
const stateTopic = `homeassistant/${componentType}/${entityId}/state`;

const payload = {
    // Basic entity information
    name: displayName,
    unique_id: entityId,
    default_entity_id: `sensor.${entityId}`,
    icon: "mdi:home-battery-outline",

    // Topics for Home Assistant to use
    state_topic: stateTopic,

    // Sensor configuration
    unit_of_measurement: "V",
    device_class: "voltage",
    value_template: "{{ value | float | round(2) }}"
};

// Prepare the final message for the MQTT Out node
msg.topic = discoveryTopic;
msg.payload = payload;
msg.retain = true; // IMPORTANT: Ensures HA rediscovers on restart

// (Optional) Add helper properties for debugging or downstream use
msg.stateTopic = stateTopic;

return msg;