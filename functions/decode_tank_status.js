// TANK_STATUS Decoder (Updated with Flat Output) - Complete and Accurate RV-C Implementation
// Decodes TANK_STATUS messages (1FFB7) per RV-C specification
// Handles all RV tank types: Fresh Water, Gray Water, Black Water, LPG
// Input: msg.payload with {dgn, dataPayload, ...other fields}
// Output: msg.payload with decoded fields merged at top level

// === Helper Functions ===

function decodeBits(value, startBit, endBit) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit;
    return (value & mask) >> startBit;
}

// === TANK_STATUS Specific Decoders ===

function decodeTankInstance(value) {
    // Tank instance mapping per RV-C specification
    const tankTypes = {
        0: "Fresh Water",
        1: "Gray Water",
        2: "Black Water",
        3: "LPG",
        4: "Fuel",
        5: "Hot Water",
        6: "Hydraulic Fluid",
        7: "Live Well",
        8: "Ballast",
        9: "Oil",
        10: "Coolant",
        11: "Diesel Exhaust Fluid",
        12: "Compressed Air",
        13: "Fresh Water 2",
        14: "Gray Water 2",
        15: "Black Water 2",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return tankTypes[value] || `Unknown Tank ${value}`;
}

function decodeTankLevel(value) {
    // Tank level as raw sensor reading (not percentage)
    // Percentage calculated as: (relative_level / resolution) * 100
    if (value <= 250) {
        return value; // Raw sensor reading
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

function decodeTankResolution(value) {
    // Tank resolution as raw sensor resolution value
    // Used in calculation: (relative_level / resolution) * 100
    if (value <= 250) {
        return value; // Raw resolution value
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

function decodeTankStatus(value) {
    // Tank status bit field decoding
    const statusBits = {
        0: "Tank OK",
        1: "Tank Low",
        2: "Tank Full",
        3: "Tank Overfilled",
        4: "Sensor Fault",
        5: "Tank Disconnected",
        6: "Reserved",
        7: "Reserved"
    };

    const activeStatuses = [];
    for (let bit = 0; bit < 8; bit++) {
        if (value & (1 << bit)) {
            activeStatuses.push(statusBits[bit]);
        }
    }

    return activeStatuses.length > 0 ? activeStatuses.join(", ") : "Tank OK";
}

// === Parameter Decoder ===

function decodeParameter(param, data) {
    if (!data || param.byte >= data.length) {
        return "Invalid Data";
    }

    const byte = param.byte;
    const value = data[byte];

    if (param.type === 'uint8') {
        // Handle specific TANK_STATUS parameter types
        if (param.name === 'instance') {
            return decodeTankInstance(value);
        }
        if (param.name === 'relative level' || param.name === 'level') {
            return decodeTankLevel(value);
        }
        if (param.name === 'resolution') {
            return decodeTankResolution(value);
        }
        if (param.name === 'temperature') {
            return decodeTemperature(value);
        }
        if (param.name === 'status' || param.name === 'tank status') {
            return decodeTankStatus(value);
        }

        // Default uint8 handling
        return value;

    } else if (param.type === 'bit2' || param.type.startsWith('uint') && param.bit) {
        // Handle bit field parameters
        const bitMatch = param.bit.match(/(\d+)-(\d+)/);
        if (bitMatch) {
            const [, startBit, endBit] = bitMatch.map(Number);
            const bitValue = decodeBits(value, startBit, endBit);

            if (param.values) {
                return param.values[bitValue.toString()] || bitValue;
            }
            return bitValue;
        }
    }

    return value;
}

// === Main Decode Function ===

function decodeTankStatusMessage(dgn, data) {
    const result = {
        dgn: dgn,
        dgn_name: "TANK_STATUS"
    };

    // Decode based on TANK_STATUS format (8 bytes typical)
    if (data.length >= 8) {
        // Byte 0: Tank Instance
        result.instance = data[0];
        result.instance_name = decodeTankInstance(data[0]);

        // Byte 1: Relative Level (0-200)
        result.relative_level = decodeTankLevel(data[1]);

        // Byte 2: Resolution (tank capacity steps)
        result.resolution = decodeTankResolution(data[2]);

        // Byte 3: Temperature
        result.temperature = decodeTemperature(data[3]);

        // Byte 4: Tank Status (bit field)
        result.status = decodeTankStatus(data[4]);

        // Bytes 5-7: Reserved/Future use
        // Currently set to 0xFF in most implementations

        // Raw values for debugging
        result.raw_instance = data[0];
        result.raw_relative_level = data[1];
        result.raw_resolution = data[2];
        result.raw_temperature = data[3];
        result.raw_status = data[4];
        if (data.length > 5) result.raw_byte_5 = data[5];
        if (data.length > 6) result.raw_byte_6 = data[6];
        if (data.length > 7) result.raw_byte_7 = data[7];
    }

    // Add convenience fields for easier consumption
    // Calculate tank percentage using RV-C formula: (relative_level / resolution) * 100
    if (result.relative_level !== undefined && result.resolution !== undefined &&
        typeof result.relative_level === 'number' && typeof result.resolution === 'number' &&
        result.resolution > 0) {
        result.level_percentage = Math.round((result.relative_level / result.resolution) * 100);
    } else if (result.relative_level !== undefined && typeof result.relative_level === 'number') {
        // Fallback if resolution is not available (direct percentage)
        result.level_percentage = Math.round(result.relative_level * 0.5); // 0.5% per step
    }

    if (result.instance !== undefined) {
        // Map numeric instance to single-word tank type
        const tankTypeMap = {
            0: "fresh",
            1: "gray",
            2: "black",
            3: "lpg",
            4: "fuel",
            5: "hot",
            6: "hydraulic",
            7: "livewell",
            8: "ballast",
            9: "oil",
            10: "coolant",
            11: "def",
            12: "air",
            13: "fresh2",
            14: "gray2",
            15: "black2",
            251: "error",
            252: "notsupported",
            253: "outofrange",
            254: "reserved",
            255: "notavailable"
        };

        result.tank_type = tankTypeMap[result.instance] || "other";
    }

    // Tank level status
    if (typeof result.level_percentage === 'number') {
        result.tank_empty = result.level_percentage <= 5;
        result.tank_low = result.level_percentage <= 25;
        result.tank_full = result.level_percentage >= 95;
        result.tank_level_available = true;
    } else {
        result.tank_level_available = false;
    }

    // Validate instance - Tank spec defines instances 0-19 for tank types
    // RV-C special values 251-255 indicate error/unavailable status
    const validInstances = [0, 1, 2, 3, 16, 17, 18, 19];
    const isValidRange = result.instance <= 19 || (result.instance >= 16 && result.instance <= 19);

    if (result.instance > 250 || (!isValidRange && result.instance > 19)) {
        node.warn(`Invalid tank instance: ${result.instance} (${result.instance_name}) - message ignored`);
        return null;
    }

    // Temperature status
    result.temperature_available = typeof result.temperature === 'number';

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

// Decode the TANK_STATUS message
const decodedData = decodeTankStatusMessage(dgn, dataBytes);

// Handle null return (invalid instance filtered out)
if (!decodedData) {
    return null;
}

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