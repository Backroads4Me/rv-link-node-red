/***********************************************************
 * HA Status Updater for AutoFill
 * Publishes the pre-calculated status from the upstream decoder.
 *
 * Expects input msg.payload with:
 * - msg.payload.instance (String): The device instance name ("autofill")
 * - msg.payload.status (String): The final status, "on" or "off"
 ***********************************************************/

if (!msg.payload || typeof msg.payload.instance !== 'string' || typeof msg.payload.status !== 'string') {
    node.error("Input missing 'instance' (string) or 'status' (string).", msg);
    return null;
}

const instance = msg.payload.instance;
const haStatus = msg.payload.status.toUpperCase(); // Ensure payload is "ON" or "OFF"

// Construct the MQTT state topic to match the entity creator
const stateTopic = `homeassistant/switch/${instance}/state`;

// Prepare the final message
msg.topic = stateTopic;
msg.payload = haStatus;
msg.retain = true; // Retain the status for HA restarts

return msg;