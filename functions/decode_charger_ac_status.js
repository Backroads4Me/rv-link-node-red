// CHARGER_AC_STATUS Decoder (Updated with Flat Output) - Complete RV-C Implementation
// Decodes CHARGER_AC_STATUS_1/2/3/4 messages per RV-C specification
// Handles AC input status for battery chargers (follows AC_STATUS format)
// Input: msg.payload with {dgn, dataPayload, ...other fields}
// Output: msg.payload with decoded fields merged at top level

// === Helper Functions ===

function decodeBits(value, startBit, endBit) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit;
    return (value & mask) >> startBit;
}

// === CHARGER_AC_STATUS Specific Decoders ===

function decodeChargerACInstance(value) {
    // Charger AC instance interpretation per RV-C spec
    // For chargers, this typically indicates the AC input line
    if (value <= 200) {
        return value; // Direct instance number
    } else if (value === 251) {
        return "Error";
    } else if (value === 252) {
        return "Not Supported";
    } else if (value === 253) {
        return "Out of Range";
    } else if (value === 254) {
        return "Reserved";
    } else if (value === 255) {
        return "Not Available";
    }
    return "Invalid";
}

function decodeACVoltage(value) {
    // AC RMS voltage (see Table 5.3 - standard RV-C scaling)
    if (value <= 65530) {
        return parseFloat((value * 0.05).toFixed(1)); // 0.05V per step
    } else if (value === 65533) {
        return "Out of Range";
    } else if (value === 65534) {
        return "Reserved";
    } else if (value === 65535) {
        return "Not Available";
    }
    return "Invalid";
}

function decodeACCurrent(value) {
    // AC RMS current (see Table 5.3 - standard RV-C scaling)
    // Special case: 0x7D00 (32000) often represents zero in RV-C AC measurements
    if (value === 32000) {
        return 0; // Special zero encoding
    } else if (value <= 65530) {
        return parseFloat((value * 0.05).toFixed(2)); // 0.05A per step
    } else if (value === 65533) {
        return "Out of Range";
    } else if (value === 65534) {
        return "Reserved";
    } else if (value === 65535) {
        return "Not Available";
    }
    return "Invalid";
}

function decodeFrequency(value) {
    // AC frequency with 1/128 Hz precision, 0-500 Hz range
    if (value <= 64000) {
        return parseFloat((value / 128).toFixed(2)); // 1/128 Hz per step
    } else if (value === 65533) {
        return "Out of Range";
    } else if (value === 65534) {
        return "Reserved";
    } else if (value === 65535) {
        return "Not Available";
    }
    return "Invalid";
}

function decodeFaultBits(value) {
    // Decode fault bits from byte 7
    const faults = [];

    // Special handling for 0xFF (all bits set) - typically means "Not Available"
    if (value === 255) {
        return {
            faults: "No Faults",
            open_ground: false,
            open_neutral: false,
            reverse_polarity: false,
            ground_current_fault: false,
            any_fault: false
        };
    }

    const openGround = decodeBits(value, 0, 1);
    const openNeutral = decodeBits(value, 2, 3);
    const reversePolarity = decodeBits(value, 4, 5);
    const groundCurrent = decodeBits(value, 6, 7);

    if (openGround === 1) faults.push("Open Ground");
    if (openNeutral === 1) faults.push("Open Neutral");
    if (reversePolarity === 1) faults.push("Reverse Polarity");
    if (groundCurrent === 1) faults.push("Ground Current Fault");

    return {
        faults: faults.length > 0 ? faults.join(", ") : "No Faults",
        open_ground: openGround === 1,
        open_neutral: openNeutral === 1,
        reverse_polarity: reversePolarity === 1,
        ground_current_fault: groundCurrent === 1,
        any_fault: faults.length > 0
    };
}

function decodeUint16(data, startByte) {
    // Decode 16-bit value (little-endian)
    if (!data || startByte + 1 >= data.length) {
        return 65535; // Not available
    }
    return data[startByte] | (data[startByte + 1] << 8);
}


// === Main Decode Function ===

function decodeChargerACMessage(dgn, data) {
    const result = {
        dgn: dgn,
        dgn_name: "CHARGER_AC_STATUS"
    };

    // Decode based on AC_STATUS_1 format (8 bytes)
    if (data.length >= 8) {
        // Byte 0: Instance
        result.instance = decodeChargerACInstance(data[0]);

        // Bytes 1-2: RMS Voltage (uint16, little-endian)
        const voltageRaw = decodeUint16(data, 1);
        result.rms_voltage = decodeACVoltage(voltageRaw);

        // Bytes 3-4: RMS Current (uint16, little-endian)
        const currentRaw = decodeUint16(data, 3);
        result.rms_current = decodeACCurrent(currentRaw);

        // Bytes 5-6: Frequency (uint16, little-endian)
        const frequencyRaw = decodeUint16(data, 5);
        result.frequency = decodeFrequency(frequencyRaw);

        // Byte 7: Fault bits
        if (data.length > 7) {
            const faultInfo = decodeFaultBits(data[7]);
            result.fault_status = faultInfo.faults;
            result.open_ground = faultInfo.open_ground;
            result.open_neutral = faultInfo.open_neutral;
            result.reverse_polarity = faultInfo.reverse_polarity;
            result.ground_current_fault = faultInfo.ground_current_fault;
            result.any_fault = faultInfo.any_fault;
        }

        // Raw values for debugging
        result.raw_voltage = voltageRaw;
        result.raw_current = currentRaw;
        result.raw_frequency = frequencyRaw;
        if (data.length > 7) {
            result.raw_fault_byte = data[7];
        }
    }

    // Add convenience fields
    result.ac_available = result.rms_voltage !== "Not Available" &&
                         typeof result.rms_voltage === 'number' &&
                         result.rms_voltage > 50; // Reasonable AC voltage threshold

    result.charging_capable = result.ac_available && !result.any_fault;

    return result;
}

// === Main Logic ===

// Validate input payload
if (!msg.payload || typeof msg.payload !== 'object') {
    node.warn('Invalid payload: expected object');
    return null;
}

const incomingPayload = msg.payload;
const { dgn, dataPayload } = incomingPayload;

if (!dgn || !dataPayload) {
    node.warn('Missing required fields: dgn and/or dataPayload');
    return null;
}

// Validate and convert hex payload to byte array
if (typeof dataPayload !== 'string' || dataPayload.length % 2 !== 0) {
    node.warn('Invalid dataPayload: must be even-length hex string');
    return null;
}

const dataBytes = [];
for (let i = 0; i < dataPayload.length; i += 2) {
    const hexByte = dataPayload.substring(i, i + 2);
    const byteValue = parseInt(hexByte, 16);
    if (isNaN(byteValue)) {
        node.warn(`Invalid hex byte in dataPayload: ${hexByte}`);
        return null;
    }
    dataBytes.push(byteValue);
}

// Decode the CHARGER_AC_STATUS message
const decodedData = decodeChargerACMessage(dgn, dataBytes);

// Handle decode errors
if (decodedData.error) {
    incomingPayload.decoding_error = decodedData.error;
    msg.payload = incomingPayload;
    return msg;
}

// Merge the incoming payload and the decoded data into a single flat object
msg.payload = {
    ...incomingPayload,
    ...decodedData
};

// Clean up the final object by removing the raw data field
delete msg.payload.dataPayload;

return msg;