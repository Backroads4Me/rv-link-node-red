// Check if payload exists and is an object
if (!msg.payload || typeof msg.payload !== 'object') {
    node.warn("STOPPED: msg.payload is not a valid object. Check the JSON node.");
    return null;
}

const instance = msg.payload.instance;
const entityType = msg.payload.entity_type;
node.warn("Payload content: " + JSON.stringify(msg.payload));

// Check if the required properties have the correct data types
if (typeof instance === 'number' && typeof entityType === 'string') {
    const overrides = global.get('entityOverrides') || {};
    overrides[instance] = entityType;
    global.set('entityOverrides', overrides);

} else {
    node.warn(`STOPPED: Validation failed. Type of 'instance' is [${typeof instance}]. Type of 'entity_type' is [${typeof entityType}].`);
}

return null;