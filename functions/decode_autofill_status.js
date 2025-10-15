// Simplified AUTOFILL_STATUS Decoder
// Decodes the status to a final "on" or "off" and uses a string instance name.

/**
 * Main function to decode the incoming autofill message.
 * @param {string} dgn - The DGN of the message.
 * @param {number[]} data - The data payload as an array of bytes.
 * @returns {object} A result object.
 */
function decodeAutofillMessage(dgn, data) {
    let finalStatus = "off";

    // Check the first byte for the operating status
    if (data.length > 0) {
        const operatingStatusBits = data[0] & 0x03; // Mask for bits 0-1
        if (operatingStatusBits === 1) { // 01b = AutoFill on
            finalStatus = "on";
        }
    }

    const result = {
        dgn: dgn,
        dgn_name: "AUTOFILL_STATUS",
        instance: "autofill", // Hard-code to string instance name
        status: finalStatus,
    };

    return result;
}

// === Main Logic ===
if (!msg.payload || typeof msg.payload !== 'object') {
    node.warn('Invalid payload: expected an object');
    return null;
}
const { dgn, dataPayload } = msg.payload;
if (!dgn || !dataPayload) {
    node.warn('Missing required fields: dgn and/or dataPayload');
    return null;
}
const dataBytes = [];
for (let i = 0; i < dataPayload.length; i += 2) {
    dataBytes.push(parseInt(dataPayload.substring(i, i + 2), 16));
}
const decodedData = decodeAutofillMessage(dgn, dataBytes);
msg.payload = { ...msg.payload, ...decodedData };
return msg;