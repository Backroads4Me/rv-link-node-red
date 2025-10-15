// Retrieve existing messages from flow context, or initialize as empty array
let uniqueUNKNOWN = flow.get("uniqueUNKNOWN") || [];

let newMsgStr = JSON.stringify(msg.payload.dgn);

// Check if it's a new unique message
if (!uniqueUNKNOWN.includes(newMsgStr)) {
    uniqueUNKNOWN.push(newMsgStr);
    flow.set("uniqueUNKNOWN", uniqueUNKNOWN);

    // Only return if new
    return msg;
}

// Return nothing if duplicate
return null;

