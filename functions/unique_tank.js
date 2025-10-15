// Retrieve existing tank instances from flow context, or initialize as empty array
let uniqueTanks = flow.get("uniqueTanks") || [];

// Track by numeric instance ID for true uniqueness
let instanceId = msg.payload.instance;

// Check if this instance ID has been seen before
if (!uniqueTanks.includes(instanceId)) {
    uniqueTanks.push(instanceId);
    flow.set("uniqueTanks", uniqueTanks);

    // Pass the instance ID to create_tank.js
    return { payload: instanceId };
}

// Return nothing if duplicate instance
return null;
