// Retrieve existing battery instances from flow context, or initialize as empty array
let uniqueBatteries = flow.get("uniqueBatteries") || [];

// Track by numeric instance ID for true uniqueness
let instanceId = msg.payload.instance;

// Check if this instance ID has been seen before
if (!uniqueBatteries.includes(instanceId)) {
    uniqueBatteries.push(instanceId);
    flow.set("uniqueBatteries", uniqueBatteries);

    // Pass the instance ID to create_battery.js
    return { payload: instanceId };
}

// Return nothing if duplicate instance
return null;
