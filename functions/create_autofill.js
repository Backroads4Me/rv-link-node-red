/***********************************************************
 * MQTT Discovery for AutoFill
 * Creates a switch entity based on the string instance "autofill".
 ***********************************************************/
if (!msg.payload || typeof msg.payload.instance !== 'string') {
    node.error("Input must be an object with a string 'instance' property.", msg);
    return null;
}

const instance = msg.payload.instance; // e.g., "autofill"

// Device configuration
const displayName = "Autofill";
const icon = "mdi:water-plus-outline";
const componentType = "switch";

// Generate entity identifiers directly from the instance string
const entityId = instance;

// MQTT topics
const discoveryTopic = `homeassistant/${componentType}/${entityId}/config`;
const stateTopic = `homeassistant/${componentType}/${entityId}/state`;
const commandTopic = `homeassistant/${componentType}/${entityId}/set`;

// MQTT Discovery payload
const payload = {
    name: displayName,
    unique_id: entityId,
    icon: icon,
    command_topic: commandTopic,
    state_topic: stateTopic,
    payload_on: "ON",
    payload_off: "OFF"
};

// Prepare the final message for the MQTT Out node
msg.topic = discoveryTopic;
msg.payload = payload;
msg.retain = true;
return msg;