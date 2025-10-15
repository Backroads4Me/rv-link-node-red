// Parse Home Assistant MQTT command topics
// Handles covers, locks, and simple switches/lights.

// --- Cover entities ---
const rvcTopicMatch = msg.topic.match(/^homeassistant\/cover\/shade_(\d+)\/set$/);
if (rvcTopicMatch) {
    const instance = parseInt(rvcTopicMatch[1], 10);
    const command = String(msg.payload).toUpperCase();
    msg.routingKey = "cover";
    msg.instance = instance;
    msg.command = command;
    msg.entityType = "cover";
    msg.entityId = `shade_${instance}`;
    return msg;
}

// --- Lock entities ---
const lockTopicMatch = msg.topic.match(/^homeassistant\/lock\/lock_(\d+)\/set$/);
if (lockTopicMatch) {
    const instance = parseInt(lockTopicMatch[1], 10);
    const command = String(msg.payload).toUpperCase();
    msg.routingKey = "lock";
    msg.instance = instance;
    msg.command = command;
    msg.entityType = "lock";
    msg.entityId = `lock_${instance}`;
    return msg;
}

// --- Switch and Light entities ---
const topicParts = msg.topic.split('/');
if (topicParts[0] !== 'homeassistant' || (topicParts[1] !== 'switch' && topicParts[1] !== 'light') || topicParts[3] !== 'set' || topicParts.length !== 4) {
    return null; // Not a topic we handle
}

const entityId = topicParts[2];
const command = String(msg.payload).toUpperCase();

// === Special handling for 'water_pump' and 'autofill' ===
if (entityId === 'water_pump' || entityId === 'autofill') {
    msg.instance = entityId;
    msg.routingKey = entityId;
} else {
    // === Generic handling for all other switches/lights ===
    const entityIdParts = entityId.split('_');
    const instanceStr = entityIdParts[entityIdParts.length - 1];
    const instanceNum = parseInt(instanceStr, 10);

    if (isNaN(instanceNum)) { return null; }

    msg.instance = instanceNum;
    msg.routingKey = entityIdParts.slice(0, -1).join('_');
}

// Assign final properties to the message
msg.entityType = topicParts[1]; // CORRECTED: Dynamically sets "light" or "switch"
msg.entityId = entityId;
msg.command = command;

return msg;