/***********************************************************
 * Tank MQTT Discovery for Home Assistant
 * Creates a sensor entity based on tank type input.
 * Expects msg.payload to be a tank type string (e.g., "fresh", "gray", "black", "lpg").
 * Example Input: msg.payload = "fresh"
 * Resulting Entity ID: tank_fresh
 ***********************************************************/

// Accept numeric instance ID from unique_tank.js
if (typeof msg.payload !== 'number') {
    node.error("Input payload must be a number (instance ID).", msg);
    return null;
}

const instanceId = msg.payload;

// Map instance ID to single-word tank type and display name
const tankTypeMap = {
    0: { type: "fresh", name: "Fresh Water" },
    1: { type: "gray", name: "Gray Water" },
    2: { type: "black", name: "Black Water" },
    3: { type: "lpg", name: "LPG" },
    4: { type: "fuel", name: "Fuel" },
    5: { type: "hot", name: "Hot Water" },
    6: { type: "hydraulic", name: "Hydraulic Fluid" },
    7: { type: "livewell", name: "Live Well" },
    8: { type: "ballast", name: "Ballast" },
    9: { type: "oil", name: "Oil" },
    10: { type: "coolant", name: "Coolant" },
    11: { type: "def", name: "DEF" },
    12: { type: "air", name: "Air" },
    13: { type: "fresh2", name: "Fresh Water 2" },
    14: { type: "gray2", name: "Gray Water 2" },
    15: { type: "black2", name: "Black Water 2" },
    251: { type: "error", name: "Error" },
    252: { type: "notsupported", name: "Not Supported" },
    253: { type: "outofrange", name: "Out of Range" },
    254: { type: "reserved", name: "Reserved" },
    255: { type: "notavailable", name: "Not Available" }
};

const tankInfo = tankTypeMap[instanceId] || { type: "other", name: `Unknown Tank ${instanceId}` };
const tankType = tankInfo.type;
const displayName = tankInfo.name;

const entityId = `tank_${tankType}`;
const componentType = "sensor";

const discoveryTopic = `homeassistant/${componentType}/${entityId}/config`;
const stateTopic = `homeassistant/${componentType}/${entityId}/state`;

const payload = {
    // Basic entity information
    name: displayName,
    unique_id: entityId,
    default_entity_id: `sensor.${entityId}`,
    icon: "mdi:water-percent",

    // Topics for Home Assistant to use
    state_topic: stateTopic,

    // Sensor configuration
    unit_of_measurement: "%",
    value_template: "{{ value | float }}" // Ensure it's parsed as a number

};

// Prepare the final message for the MQTT Out node
msg.topic = discoveryTopic;
msg.payload = payload;
msg.retain = true; // IMPORTANT: Ensures HA rediscovers on restart

// (Optional) Add helper properties for debugging or downstream use
msg.stateTopic = stateTopic;

return msg;