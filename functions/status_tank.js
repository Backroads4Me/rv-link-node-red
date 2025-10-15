/***********************************************************
 * HA Tank Status Updater
 * Takes a JSON payload as input and sends tank level updates
 * to the correct Home Assistant MQTT state topic for tank sensor entities.
 * Expects input msg.payload to be an object with:
 * - msg.payload.tank_type (String): The type of the tank ("fresh", "gray", "black", "lpg").
 * - msg.payload.level_percentage (Number): Tank level 0-100%.
 * - msg.payload.relative_level (String): Availability indicator.
 ***********************************************************/

// Validate input and availability
if (msg.payload?.relative_level === "Not Available" || msg.relative_level === "Not Available") {
    return null; // Stop the flow if level data not available
}

// Extract values with fallback support (preserving original working logic)
const tankType = msg.payload?.tank_type ?? msg.tank_type;
const levelPercentage = msg.payload?.level_percentage ?? msg.level_percentage;

// Validate tank type
if (!tankType) {
    node.error("Input missing 'tank_type'.", msg);
    return null; // Stop the flow
}

// Validate level percentage
if (typeof levelPercentage !== 'number') {
    node.error("Input missing 'level_percentage' (number).", msg);
    return null; // Stop the flow
}

// Ensure level is within valid range
const level = Math.max(0, Math.min(100, Math.round(levelPercentage)));

// Create the state topic for this tank instance
const stateTopic = `homeassistant/sensor/tank_${tankType}/state`;

msg.topic = stateTopic;
msg.payload = level; // The payload is the numeric level percentage
msg.retain = true; // Retain the status so HA shows the correct state after a restart

// Add debug information for troubleshooting
msg.debug_info = {
    original_tank_type: tankType,
    calculated_level: level,
    raw_level_percentage: levelPercentage,
    raw_relative_level: msg.payload?.relative_level ?? msg.relative_level
};

return msg;