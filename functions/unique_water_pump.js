// Retrieve existing water pump instances from flow context.
let uniqueWaterPumps = flow.get("uniqueWaterPumps") || [];

// The instance is now a string identifier, e.g., "water_pump"
const instanceName = msg.payload.instance;

// Check if this instance name has been seen before
if (instanceName && !uniqueWaterPumps.includes(instanceName)) {
    uniqueWaterPumps.push(instanceName);
    flow.set("uniqueWaterPumps", uniqueWaterPumps);

    // Pass the instance name to the creation function
    return { payload: { instance: instanceName } };
}

// Return nothing if duplicate instance
return null;