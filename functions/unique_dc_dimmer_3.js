// Retrieve existing DC dimmer instances from flow context, or initialize as empty array
let uniqueDcDimmers = flow.get("uniqueDcDimmers") || [];

// Track by numeric instance ID for true uniqueness
let instanceId = msg.payload.instance;

// Check if this instance ID has been seen before
if (!uniqueDcDimmers.includes(instanceId)) {
    uniqueDcDimmers.push(instanceId);
    flow.set("uniqueDcDimmers", uniqueDcDimmers);

    // Pass the instance ID to create_dc_dimmer_3.js
    return { payload: { instance: instanceId } };
}

// Return nothing if duplicate instance
return null;
