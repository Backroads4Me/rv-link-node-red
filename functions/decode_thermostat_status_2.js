// THERMOSTAT_STATUS_2 Decoder (Updated with Flat Output) - Complete RV-C Implementation
// Decodes THERMOSTAT_STATUS_2 messages per RV-C specification
// Handles thermostat scheduling and advanced features
// Input: msg.payload with {dgn, dataPayload, ...other fields}
// Output: msg.payload with decoded fields merged at top level

// === Helper Functions ===

function decodeBits(value, startBit, endBit) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit;
    return (value & mask) >> startBit;
}

// === THERMOSTAT_STATUS_2 Specific Decoders ===

function decodeThermostatInstance(value) {
    // Thermostat instance mapping
    if (value <= 200) {
        return value; // Direct instance number (Zone)
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

function decodeCurrentScheduleInstance(value) {
    // Current schedule instance mapping per RV-C spec
    if (value === 0) {
        return "Sleep";
    } else if (value === 1) {
        return "Wake";
    } else if (value === 2) {
        return "Away";
    } else if (value === 3) {
        return "Return";
    } else if (value >= 4 && value <= 249) {
        return `Additional Instance ${value}`;
    } else if (value === 250) {
        return "Storage";
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

function decodeScheduleInstances(value) {
    // Number of schedule instances capacity
    if (value <= 200) {
        return value; // Direct count
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

function decodeReducedNoiseMode(value) {
    // Reduced noise mode from bit field
    if (value === 0) {
        return "Disabled";
    } else if (value === 1) {
        return "Enabled";
    }
    return "Unknown";
}

// === Parameter Decoder ===

function decodeParameter(param, data) {
    if (!data || param.byte >= data.length) {
        return "Invalid Data";
    }

    const byte = param.byte;
    let value;

    // Handle multi-byte parameters
    if (typeof param.byte === 'string' && param.byte.includes('-')) {
        const [startByte, endByte] = param.byte.split('-').map(Number);
        value = 0;
        for (let i = startByte; i <= endByte; i++) {
            value = (value << 8) | data[i];
        }
    } else {
        value = data[byte];
    }

    if (param.type === 'uint8') {
        // Handle specific THERMOSTAT_STATUS_2 parameter types
        if (param.name === 'instance') {
            return decodeThermostatInstance(value);
        }
        if (param.name === 'current schedule instance') {
            return decodeCurrentScheduleInstance(value);
        }
        if (param.name === 'number of schedule instances') {
            return decodeScheduleInstances(value);
        }

        // Default uint8 handling
        return value;

    } else if (param.type === 'bit' || param.type === 'bit2' || (param.type.startsWith('uint') && param.bit)) {
        // Handle bit field parameters
        const bitMatch = param.bit.match(/(\d+)-(\d+)/);
        if (bitMatch) {
            const [, startBit, endBit] = bitMatch.map(Number);
            const bitValue = decodeBits(value, startBit, endBit);

            if (param.name === 'reduced noise mode') {
                return decodeReducedNoiseMode(bitValue);
            }

            if (param.values) {
                return param.values[bitValue.toString()] || bitValue;
            }
            return bitValue;
        }
    }

    return value;
}

// === Main Decode Function ===

function decodeThermostatStatus2Message(dgn, data) {
    const result = {
        dgn: dgn,
        dgn_name: "THERMOSTAT_STATUS_2"
    };

    // Decode based on THERMOSTAT_STATUS_2 format (typically 4-8 bytes)
    if (data.length > 0) {
        // Byte 0: Instance (Zone)
        result.instance = decodeThermostatInstance(data[0]);

        // Byte 1: Current Schedule Instance
        if (data.length > 1) {
            result.current_schedule_instance = decodeCurrentScheduleInstance(data[1]);
        }

        // Byte 2: Number of Schedule Instances
        if (data.length > 2) {
            result.number_of_schedule_instances = decodeScheduleInstances(data[2]);
        }

        // Byte 3: Reduced Noise Mode (bits 0-1)
        if (data.length > 3) {
            if (data[3] === 255) {
                result.reduced_noise_mode = "Not Available";
            } else if (data[3] === 254) {
                result.reduced_noise_mode = "Reserved";
            } else if (data[3] === 253) {
                result.reduced_noise_mode = "Out of Range";
            } else {
                const noiseBits = decodeBits(data[3], 0, 1);
                result.reduced_noise_mode = decodeReducedNoiseMode(noiseBits);
            }
        }

        // Raw values for debugging
        result.raw_instance = data[0];
        if (data.length > 1) result.raw_current_schedule = data[1];
        if (data.length > 2) result.raw_schedule_count = data[2];
        if (data.length > 3) result.raw_features_byte = data[3];
        if (data.length > 4) result.raw_byte_4 = data[4];
        if (data.length > 5) result.raw_byte_5 = data[5];
        if (data.length > 6) result.raw_byte_6 = data[6];
        if (data.length > 7) result.raw_byte_7 = data[7];
    }

    // Add convenience fields
    result.scheduling_supported = result.number_of_schedule_instances !== "Not Available" &&
                                 typeof result.number_of_schedule_instances === 'number' &&
                                 result.number_of_schedule_instances > 0;

    result.current_mode = result.current_schedule_instance;

    // Determine if in a standard schedule mode
    if (typeof result.current_schedule_instance === 'string') {
        const schedule = result.current_schedule_instance.toLowerCase();
        result.in_sleep_mode = schedule === "sleep";
        result.in_wake_mode = schedule === "wake";
        result.in_away_mode = schedule === "away";
        result.in_return_mode = schedule === "return";
        result.in_standard_schedule = ["sleep", "wake", "away", "return"].includes(schedule);
    }

    result.quiet_mode_active = result.reduced_noise_mode === "Enabled";

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

// Decode the THERMOSTAT_STATUS_2 message
const decodedData = decodeThermostatStatus2Message(dgn, dataBytes);

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