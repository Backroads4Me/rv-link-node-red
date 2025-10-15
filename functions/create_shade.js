/***********************************************************
 * Create Home Assistant MQTT Discovery for RV-C Shades
 * Creates a dedicated 'cover' entity for each shade instance.
 *
 * Expects input msg.payload to be an object with:
 * - msg.payload.instance (Number): The shade instance ID (1-250)
 ***********************************************************/

// Validate input structure
if (!msg.payload || typeof msg.payload !== 'object' || typeof msg.payload.instance !== 'number') {
    node.error("Input payload must be an object with a numeric 'instance' property.", msg);
    return null;
}

const instance = msg.payload.instance;

// RV-C valid instance range: 1-250
// Silently ignore special RV-C status/error values (251-255)
if (instance < 1 || instance > 250) {
    if (instance < 251) { // Only warn for invalid user-range instances
        node.warn(`Instance ${instance} is outside the valid RV-C range (1-250). Cover will not be created.`);
    }
    return null;
}

// --- MQTT Discovery Configuration for a Cover Entity ---

const entityId = `shade_${instance}`;
const discoveryTopic = `homeassistant/cover/${entityId}/config`;
const commandTopic = `homeassistant/cover/${entityId}/set`; // Topic HA will send commands to

const stateTopic = `homeassistant/cover/${entityId}/state`;

const discoveryPayload = {
    name: `Shade ${instance}`,
    unique_id: `shade_${instance}`,
    default_entity_id: `cover.${entityId}`,
    icon: "mdi:window-shutter",
    command_topic: commandTopic,
    payload_open: "OPEN",
    payload_close: "CLOSE",
    payload_stop: "STOP",
    state_topic: stateTopic,
    position_topic: stateTopic,
    // Cover entity states
    state_opening: "opening",
    state_closing: "closing",
    state_open: "open",
    state_closed: "closed",
    // Position support (keeps both buttons enabled)
    value_template: "{{ value_json.state }}",
    position_template: "{{ value_json.position | int }}",
    optimistic: false
};

// Return the discovery message
msg.topic = discoveryTopic;
msg.payload = JSON.stringify(discoveryPayload);
msg.retain = true;

return msg;