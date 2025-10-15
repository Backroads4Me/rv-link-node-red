// THERMOSTAT_AMBIENT_STATUS Decoder (Updated with Flat Output) - Complete RV-C Implementation
// Decodes THERMOSTAT_AMBIENT_STATUS messages per RV-C specification
// Handles ambient temperature and humidity sensors
// Input: msg.payload with {dgn, dataPayload, ...other fields}
// Output: msg.payload with decoded fields merged at top level

// === Helper Functions ===

function decodeBits(value, startBit, endBit) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit;
    return (value & mask) >> startBit;
}

// === THERMOSTAT_AMBIENT_STATUS Specific Decoders ===

function decodeThermostatInstance(value) {
    // Thermostat instance mapping
    if (value <= 200) {
        return value; // Direct instance number
    } else if (value <= 250) {
        return "Out of Range"; // Values 201-250
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

function decodeTemperature(value, isCelsius = false) {
    // Temperature decoding with offset
    if (value <= 210) {
        const temp = value - 40; // -40°C to +170°C range
        if (isCelsius) {
            return temp;
        } else {
            // Convert to Fahrenheit: F = C * 9/5 + 32
            return parseFloat(((temp * 9/5) + 32).toFixed(1));
        }
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

function decodeHumidity(value) {
    // Humidity as percentage
    if (value <= 200) {
        return parseFloat((value * 0.5).toFixed(1)); // 0.5% per step, 0-100%
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

function decodeDewPoint(value, isCelsius = false) {
    // Dew point temperature with same encoding as ambient temperature
    return decodeTemperature(value, isCelsius);
}

function decodeAirQuality(value) {
    // Air quality index
    const qualityLevels = {
        0: "Good",
        1: "Moderate",
        2: "Unhealthy for Sensitive",
        3: "Unhealthy",
        4: "Very Unhealthy",
        5: "Hazardous",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return qualityLevels[value] || `Unknown Quality ${value}`;
}

function decodeSensorStatus(value) {
    // Handle special values first
    if (value === 255) {
        return "Not Available";
    } else if (value === 254) {
        return "Reserved";
    } else if (value === 253) {
        return "Out of Range";
    } else if (value === 252) {
        return "Not Supported";
    } else if (value === 251) {
        return "Error";
    }

    // Sensor status bit field
    const statusBits = [];

    if (value & 0x01) statusBits.push("Temperature Valid");
    if (value & 0x02) statusBits.push("Humidity Valid");
    if (value & 0x04) statusBits.push("Dew Point Valid");
    if (value & 0x08) statusBits.push("Air Quality Valid");
    if (value & 0x10) statusBits.push("Sensor Calibrated");
    if (value & 0x20) statusBits.push("Sensor Fault");
    if (value & 0x40) statusBits.push("Low Battery");
    if (value & 0x80) statusBits.push("Communication Error");

    return statusBits.length > 0 ? statusBits.join(", ") : "Normal";
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
        // Handle specific THERMOSTAT_AMBIENT_STATUS parameter types
        if (param.name === 'instance') {
            return decodeThermostatInstance(value);
        }
        if (param.name === 'ambient temperature' || param.name.includes('temperature')) {
            return decodeTemperature(value);
        }
        if (param.name.includes('humidity')) {
            return decodeHumidity(value);
        }
        if (param.name === 'dew point' || param.name.includes('dew')) {
            return decodeDewPoint(value);
        }
        if (param.name === 'air quality' || param.name.includes('quality')) {
            return decodeAirQuality(value);
        }
        if (param.name === 'sensor status' || param.name.includes('status')) {
            return decodeSensorStatus(value);
        }

        // Default uint8 handling
        return value;

    } else if (param.type === 'uint16') {
        if (param.name.includes('temperature')) {
            return decodeTemperature(value);
        }

        // Default uint16 handling
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

function decodeThermostatAmbientMessage(dgn, data) {
    const result = {
        dgn: dgn,
        dgn_name: "THERMOSTAT_AMBIENT_STATUS"
    };

    // Decode based on THERMOSTAT_AMBIENT_STATUS format (8 bytes typical)
    if (data.length >= 8) {
        // Byte 0: Instance
        result.instance = decodeThermostatInstance(data[0]);

        // Byte 1: Ambient Temperature
        result.ambient_temperature = decodeTemperature(data[1]);

        // Byte 2: Humidity
        result.humidity = decodeHumidity(data[2]);

        // Byte 3: Dew Point
        result.dew_point = decodeDewPoint(data[3]);

        // Byte 4: Air Quality Index
        result.air_quality = decodeAirQuality(data[4]);

        // Byte 5: Sensor Status
        result.sensor_status = decodeSensorStatus(data[5]);

        // Bytes 6-7: Reserved/Future use
        // Currently set to 0xFF in most implementations

        // Raw values for debugging
        result.raw_instance = data[0];
        result.raw_ambient_temperature = data[1];
        result.raw_humidity = data[2];
        result.raw_dew_point = data[3];
        result.raw_air_quality = data[4];
        result.raw_sensor_status = data[5];
        if (data.length > 6) result.raw_byte_6 = data[6];
        if (data.length > 7) result.raw_byte_7 = data[7];
    }

    // Add convenience fields
    if (result.ambient_temperature !== undefined && typeof result.ambient_temperature === 'number') {
        result.temperature_fahrenheit = parseFloat(((result.ambient_temperature * 9/5) + 32).toFixed(1));
    }

    result.sensor_available = result.instance !== "Not Available" &&
                             result.ambient_temperature !== "Not Available";

    result.humidity_available = typeof result.humidity === 'number';
    result.air_quality_available = result.air_quality !== "Not Available" &&
                                   result.air_quality !== "Not Supported";

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

// Decode the THERMOSTAT_AMBIENT_STATUS message
const decodedData = decodeThermostatAmbientMessage(dgn, dataBytes);

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