/***********************************************************
 * HA Lock Status Updater
 * Takes a JSON payload as input and sends lock/unlock status
 * to the correct Home Assistant MQTT state topic for lock entities.
 * Expects input msg.payload to be an object with:
 * - msg.payload.instance (Number): The ID of the lock (1-250).
 * - msg.payload.is_locked (Boolean): Whether lock is locked.
 * - msg.payload.is_unlocked (Boolean): Whether lock is unlocked.
 * - msg.payload.lock_status (String): Lock status text.
 ***********************************************************/

// Validate instance - must be a valid number (1-250)
// Special values (0, 251-255) are decoded as strings and should be ignored
if (typeof msg.payload.instance !== 'number') {
    // Silently ignore messages with invalid instance values
    return null;
}

const instance = msg.payload.instance;

// Additional validation: only process instances 0-250
// Instance 0 is accepted but won't publish state (optimistic entity)
if (instance < 0 || instance > 250) {
    return null;
}

// Skip state publishing for Instance 0 (broadcast "All Locks" entity)
// Instance 0 uses optimistic mode and doesn't have individual status
if (instance === 0) {
    return null;
}

// Determine the lock state
let haStatus = "UNKNOWN";

// Check boolean flags first (most reliable)
if (msg.payload.is_locked === true) {
    haStatus = "LOCKED";
} else if (msg.payload.is_unlocked === true) {
    haStatus = "UNLOCKED";
} else if (typeof msg.payload.lock_status === 'string') {
    // Fall back to parsing lock_status string
    const lockStatusLower = msg.payload.lock_status.toLowerCase();
    if (lockStatusLower.includes("locked") && !lockStatusLower.includes("unlocked")) {
        haStatus = "LOCKED";
    } else if (lockStatusLower.includes("unlocked")) {
        haStatus = "UNLOCKED";
    }
}

// Create the state topic for this lock instance
const stateTopic = `homeassistant/lock/lock_${instance}/state`;

msg.topic = stateTopic;
msg.payload = haStatus; // The payload is the lock state string
msg.retain = true; // Retain the status so HA shows the correct state after a restart

return msg;
