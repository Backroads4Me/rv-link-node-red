// Retrieve existing autofill instances from flow context.
let uniqueAutofill = flow.get("uniqueAutofill") || [];

// The instance is now a string identifier, e.g., "autofill"
const instanceName = msg.payload.instance;

// Check if this instance name has been seen before
if (instanceName && !uniqueAutofill.includes(instanceName)) {
    uniqueAutofill.push(instanceName);
    flow.set("uniqueAutofill", uniqueAutofill);

    // Pass the instance name to the creation function
    return { payload: { instance: instanceName } };
}

// Return nothing if duplicate instance
return null;