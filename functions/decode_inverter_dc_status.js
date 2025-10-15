// INVERTER_DC_STATUS Decoder (Updated with Flat Output) - Complete RV-C Implementation
// Decodes INVERTER_DC_STATUS messages per RV-C specification
// Handles DC input status for inverters (DC battery connection monitoring)
// Input: msg.payload with {dgn, dataPayload, ...other fields}
// Output: msg.payload with decoded fields merged at top level

// === Helper Functions ===

function decodeBits(value, startBit, endBit) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit;
    return (value & mask) >> startBit;
}

// === INVERTER_DC_STATUS Specific Decoders ===

function decodeInverterInstance(value) {
    // Inverter instance interpretation per RV-C spec
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

function decodeDCInstance(value) {
    // DC Instance mapping per RV-C specification
    const dcInstances = {
        0: "Invalid",
        1: "Main House Battery Bank",
        2: "Chassis Start Battery",
        3: "Secondary House Battery Bank",
        4: "Generator Starter Battery",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return dcInstances[value] || `Unknown DC Instance ${value}`;
}

function decodeDCVoltage(value) {
    // DC Voltage in volts (0.05V resolution)
    if (value <= 64000) {
        return parseFloat((value * 0.05).toFixed(2)); // 0.05V per step
    } else if (value === 65533) {
        return "Out of Range";
    } else if (value === 65534) {
        return "Reserved";
    } else if (value === 65535) {
        return "Not Available";
    }
    return "Invalid";
}

function decodeDCCurrent(value) {
    // DC Current in amperes (0.05A resolution, signed)
    const MAX_VALID = 2147483600;

    // Handle signed 32-bit value
    let signedValue = value;
    if (value > 2147483647) {
        signedValue = value - 4294967296; // Convert from unsigned to signed
    }

    if (Math.abs(signedValue) <= MAX_VALID) {
        return parseFloat((signedValue * 0.05).toFixed(2)); // 0.05A per step
    } else if (value === 2147483645) {
        return "Out of Range";
    } else if (value === 2147483646) {
        return "Reserved";
    } else if (value === 2147483647) {
        return "Not Available";
    }
    return "Invalid";
}

function decodeTemperature(value) {
    // Temperature in Celsius, offset -40°C
    if (value <= 210) {
        return value - 40; // -40°C to +170°C range
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

function decodeInverterState(value) {
    // Inverter operational state
    const states = {
        0: "Off",
        1: "Starting",
        2: "Running",
        3: "Stopping",
        4: "Sleep Mode",
        5: "Search Mode",
        6: "Standby",
        7: "Fault",
        8: "Battery Low",
        9: "Overload",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return states[value] || `Unknown State ${value}`;
}

function decodeUint16(data, startByte) {
    // Decode 16-bit value (little-endian)
    if (!data || startByte + 1 >= data.length) {
        return 65535; // Not available
    }
    return data[startByte] | (data[startByte + 1] << 8);
}

function decodeUint32(data, startByte) {
    // Decode 32-bit value (little-endian)
    if (!data || startByte + 3 >= data.length) {
        return 4294967295; // Not available
    }
    return data[startByte] |
           (data[startByte + 1] << 8) |
           (data[startByte + 2] << 16) |
           (data[startByte + 3] << 24);
}

// === Main Decode Function ===

function decodeInverterDCMessage(dgn, data) {
    const result = {
        dgn: dgn,
        dgn_name: "INVERTER_DC_STATUS"
    };

    // Decode INVERTER_DC_STATUS message (8 bytes typical)
    if (data.length >= 8) {
        // Byte 0: Inverter Instance
        result.instance = decodeInverterInstance(data[0]);

        // Byte 1: DC Instance (battery bank)
        result.dc_source_instance = decodeDCInstance(data[1]);

        // Bytes 2-3: DC Voltage (uint16, little-endian)
        const voltageRaw = decodeUint16(data, 2);
        result.dc_voltage = decodeDCVoltage(voltageRaw);

        // Bytes 4-7: DC Current (uint32, little-endian, signed)
        const currentRaw = decodeUint32(data, 4);
        result.dc_current = decodeDCCurrent(currentRaw);

        // Additional bytes if available for extended status
        if (data.length > 8) {
            // Byte 8: Inverter State (if available)
            result.inverter_state = decodeInverterState(data[8]);
        }

        if (data.length > 9) {
            // Byte 9: Temperature (if available)
            result.temperature = decodeTemperature(data[9]);
        }

        // Raw values for debugging
        result.raw_voltage = voltageRaw;
        result.raw_current = currentRaw;
    }

    // Add convenience fields
    result.dc_input_available = result.dc_voltage !== "Not Available" &&
                               typeof result.dc_voltage === 'number' &&
                               result.dc_voltage > 10; // Reasonable DC voltage threshold

    result.inverter_drawing_power = result.dc_current !== "Not Available" &&
                                   typeof result.dc_current === 'number' &&
                                   Math.abs(result.dc_current) > 0.5; // Some current flow

    result.inverter_supplying_power = result.dc_current !== "Not Available" &&
                                     typeof result.dc_current === 'number' &&
                                     result.dc_current < -0.5; // Negative current = supplying power

    if (result.inverter_state !== undefined) {
        const state = result.inverter_state.toString().toLowerCase();
        result.inverter_operational = ["running", "search mode", "standby"].includes(state);
        result.inverter_faulted = ["fault", "battery low", "overload"].includes(state);
    }

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

// Decode the INVERTER_DC_STATUS message
const decodedData = decodeInverterDCMessage(dgn, dataBytes);

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