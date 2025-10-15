// Retrieve existing lock instances from flow context, or initialize as empty array
let uniqueLocks = flow.get("uniqueLocks") || [];

// Track by numeric instance ID for true uniqueness
// Instance 0 = "All Locks" broadcast entity (per RV-C spec 6.40.1)
// Instances 1-250 = Individual lock entities
let instanceId = msg.payload.instance;
let messagesToSend = [];

// Ensure instance 0 is always initialized on first run
if (!uniqueLocks.includes(0)) {
    uniqueLocks.push(0);
    flow.set("uniqueLocks", uniqueLocks);

    // Send instance 0 for initialization
    messagesToSend.push({
        payload: {
            instance: 0,
            device_type: "lock"
        }
    });
}

// Check if the current instance ID has been seen before
if (!uniqueLocks.includes(instanceId)) {
    uniqueLocks.push(instanceId);
    flow.set("uniqueLocks", uniqueLocks);

    // Add the current instance to messages to send
    messagesToSend.push({
        payload: {
            instance: instanceId,
            device_type: "lock"
        }
    });
}

// Return messages (instance 0 if needed, current instance if new)
// Returns null if no new instances detected
// Node-RED will send each message in the array sequentially to the next node
return messagesToSend.length > 0 ? messagesToSend : null;
