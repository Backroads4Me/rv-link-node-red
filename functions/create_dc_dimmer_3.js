// create_dc_dimmer_3.js

// Validate input structure
if (!msg.payload || typeof msg.payload !== 'object') {
    node.error("Input payload must be an object.", msg);
    return null;
}

const instance = msg.payload.instance;

// Validate required fields
if (typeof instance !== 'number') {
    node.error("Input missing 'instance' (number).", msg);
    return null;
}

if (instance < 1 || instance > 250) {
    if (instance >= 251 && instance <= 255) {
        return null;
    }
    node.warn(`Instance ${instance} is outside the valid RV-C instance range (1-250) for a switch. Entity will not be created.`);
    return null;
}

// Device configuration
const prefix = "switch";
const displayPrefix = "Switch";
const icon = 'mdi:light-recessed';

// Generate entity identifiers
const entityId = `${prefix}_${instance}`;
const displayName = `${displayPrefix} ${instance}`;

// MQTT topics
const discoveryTopic = `homeassistant/light/${entityId}/config`;
const stateTopic = `homeassistant/light/${entityId}/state`;
const commandTopic = `homeassistant/light/${entityId}/set`;

// MQTT Discovery payload
const payload = {
    name: displayName,
    unique_id: entityId,
    icon: icon,
    command_topic: commandTopic,
    state_topic: stateTopic,
    state_value_template: "{{ value_json.state }}",
    payload_on: "ON",
    payload_off: "OFF"
};

// Prepare the final message for the MQTT Out node
msg.topic = discoveryTopic;
msg.payload = payload;
msg.retain = true;

msg.stateTopic = stateTopic;
msg.commandTopic = commandTopic;
msg.entityId = entityId;

return msg;