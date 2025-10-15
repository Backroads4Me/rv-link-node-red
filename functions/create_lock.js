/***********************************************************
 * Lock MQTT Discovery for Home Assistant
 * Creates a lock entity for each lock instance
 * Expects input msg.payload to be an object with:
 * - msg.payload.instance (Number): The lock instance ID (1-250)
 * - msg.payload.device_type (String): Device type ("lock")
 ***********************************************************/

// Validate input structure
if (!msg.payload || typeof msg.payload !== 'object') {
    node.error("Input payload must be an object.", msg);
    return null;
}

const instance = msg.payload.instance;
const deviceType = msg.payload.device_type;

// Validate required fields
if (typeof instance !== 'number') {
    node.error("Input missing 'instance' (number).", msg);
    return null;
}

if (typeof deviceType !== 'string') {
    node.error("Input missing 'device_type' (string).", msg);
    return null;
}

// Verify device type is lock
if (deviceType !== 'lock') {
    node.error(`Expected device_type 'lock', got '${deviceType}'.`, msg);
    return null;
}

// RV-C valid instance range: 0-250
// Instance 0 = "All Locks" broadcast entity per RV-C spec section 6.40.1
// Instances 1-250 = Individual locks
// Special values: 251=Error, 252=Not Supported, 253=Out of Range, 254=Reserved, 255=Not Available
if (instance < 0 || instance > 250) {
    // Silently ignore special RV-C status values - these aren't real devices
    if (instance >= 251 && instance <= 255) {
        return null;
    }
    node.warn(`Instance ${instance} is outside the valid RV-C instance range (0-250) for a lock. Entity will not be created.`);
    return null;
}

const prefix = "lock";
const displayPrefix = "Lock";
const componentType = "lock";

// Generate entity identifiers
const entityId = `${prefix}_${instance}`;
// Special name for Instance 0 (broadcast to all locks)
const displayName = instance === 0 ? "All Locks" : `${displayPrefix} ${instance}`;

// MQTT topics
const discoveryTopic = `homeassistant/${componentType}/${entityId}/config`;
const stateTopic = `homeassistant/${componentType}/${entityId}/state`;
const commandTopic = `homeassistant/${componentType}/${entityId}/set`;

// MQTT Discovery payload
const payload = {
    // Basic entity information
    name: displayName,
    unique_id: entityId,
    default_entity_id: `${componentType}.${entityId}`,
    icon: "mdi:lock",

    // Topics for Home Assistant to use
    command_topic: commandTopic,
    state_topic: stateTopic,

    // Define what "LOCK" and "UNLOCK" commands look like (simple strings)
    payload_lock: "LOCK",
    payload_unlock: "UNLOCK",

    // State values that will be received from status updates
    state_locked: "LOCKED",
    state_unlocked: "UNLOCKED",

    // Instance 0 (All Locks) uses optimistic mode since it's broadcast-only (no status feedback)
    // Instances 1-250 use non-optimistic mode to show real status from RV-C bus
    optimistic: instance === 0

};

// Prepare the final message for the MQTT Out node
msg.topic = discoveryTopic;
msg.payload = payload;
msg.retain = true; // IMPORTANT: Ensures HA rediscovers on restart

// (Optional) Add helper properties for debugging or downstream use
msg.stateTopic = stateTopic;
msg.commandTopic = commandTopic;
msg.entityId = entityId;
msg.deviceType = deviceType;

return msg;
