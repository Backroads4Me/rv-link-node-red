let uniqueShades = flow.get("uniqueShades") || []

// Track by numeric instance ID for true uniqueness
let instanceId = msg.payload.instance;

// Check if this instance ID has been seen before
if (!uniqueShades.includes(instanceId)) {
    uniqueShades.push(instanceId);
    flow.set("uniqueShades", uniqueShades);

    return {
        payload: {
            instance: instanceId,
            device_type: "shade"
        }
    };
}

// Return nothing if duplicate instance
return null;
