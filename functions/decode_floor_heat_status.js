// FLOOR_HEAT_STATUS Decoder (Updated with Flat Output) - Complete RV-C Implementation
// Decodes FLOOR_HEAT_STATUS messages per RV-C specification
// Handles floor heating system control and status
// Input: msg.payload with {dgn, dataPayload, ...other fields}
// Output: msg.payload with decoded fields merged at top level

// === Helper Functions ===

function decodeBits(value, startBit, endBit) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit;
    return (value & mask) >> startBit;
}

// === FLOOR_HEAT_STATUS Specific Decoders ===

function decodeFloorHeatInstance(value) {
    // Floor heat instance mapping
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

function decodeOperatingState(value) {
    // Operating state mapping per RV-C specification
    const states = {
        0: "Off",
        1: "On",
        2: "Heating",
        3: "Standby",
        4: "Test",
        5: "Fault",
        6: "Maintenance Required",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return states[value] || `Unknown State ${value}`;
}

function decodeHeatingLevel(value) {
    // Heating level as percentage
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

function decodeTemperature(value, isCelsius = false) {
    // Temperature decoding for FLOOR_HEAT_STATUS uint16 values
    // RV-C spec: 0.03125°C resolution with -273°C offset
    // Special cases: 0 = Not Available, very low values likely invalid
    if (value === 0) {
        return "Not Available";
    } else if (value <= 65530) {
        const tempK = value * 0.03125; // Kelvin
        const tempC = tempK - 273.15; // Convert to Celsius

        // Sanity check: if temperature is extremely low, likely invalid data
        if (tempC < -100) {
            return "Invalid Reading";
        }

        if (isCelsius) {
            return parseFloat(tempC.toFixed(1));
        } else {
            // Convert to Fahrenheit: F = C * 9/5 + 32
            return parseFloat(((tempC * 9/5) + 32).toFixed(1));
        }
    } else if (value === 65533) {
        return "Out of Range";
    } else if (value === 65534) {
        return "Reserved";
    } else if (value === 65535) {
        return "Not Available";
    }
    return "Invalid";
}

function decodeSetpoint(value, isCelsius = false) {
    // Temperature setpoint - same format as measured temperature
    // RV-C spec: 0.03125°C resolution with -273°C offset
    // Special cases: 0 = Not Available, very low values likely invalid
    if (value === 0) {
        return "Not Available";
    } else if (value <= 65530) {
        const tempK = value * 0.03125; // Kelvin
        const tempC = tempK - 273.15; // Convert to Celsius

        // Sanity check: if temperature is extremely low, likely invalid data
        if (tempC < -100) {
            return "Invalid Reading";
        }

        if (isCelsius) {
            return parseFloat(tempC.toFixed(1));
        } else {
            // Convert to Fahrenheit
            return parseFloat(((tempC * 9/5) + 32).toFixed(1));
        }
    } else if (value === 65533) {
        return "Out of Range";
    } else if (value === 65534) {
        return "Reserved";
    } else if (value === 65535) {
        return "Not Available";
    }
    return "Invalid";
}

function decodeTimer(value) {
    // Timer in minutes
    if (value <= 600) {
        return value; // Minutes
    } else if (value === 65533) {
        return "Out of Range";
    } else if (value === 65534) {
        return "Reserved";
    } else if (value === 65535) {
        return "Not Available";
    }
    return "Invalid";
}

function decodePower(value) {
    // Power consumption in watts
    if (value <= 65000) {
        return value; // Watts
    } else if (value === 65533) {
        return "Out of Range";
    } else if (value === 65534) {
        return "Reserved";
    } else if (value === 65535) {
        return "Not Available";
    }
    return "Invalid";
}

function decodeSystemStatus(value) {
    // System status bit field
    // Handle special values first
    if (value === 255) {
        return "Not Available";
    } else if (value === 254) {
        return "Reserved";
    } else if (value === 253) {
        return "Out of Range";
    } else if (value === 0) {
        return "Normal";
    }

    const statusBits = [];

    if (value & 0x01) statusBits.push("Heating Active");
    if (value & 0x02) statusBits.push("Timer Active");
    if (value & 0x04) statusBits.push("Temperature Sensor OK");
    if (value & 0x08) statusBits.push("Overtemperature");
    if (value & 0x10) statusBits.push("Overcurrent");
    if (value & 0x20) statusBits.push("Communication Fault");
    if (value & 0x40) statusBits.push("Service Required");
    if (value & 0x80) statusBits.push("System Fault");

    return statusBits.length > 0 ? statusBits.join(", ") : "Normal";
}


// === Main Decode Function ===

function decodeFloorHeatMessage(dgn, data) {
    const result = {
        dgn: dgn,
        dgn_name: "FLOOR_HEAT_STATUS"
    };

    // Decode based on floor heat format (8 bytes)
    if (data.length >= 8) {
        // Byte 0: Instance
        result.instance = decodeFloorHeatInstance(data[0]);

        // Byte 1: Operating State
        result.operating_state = decodeOperatingState(data[1]);

        // Byte 2: Heating Level
        result.heating_level = decodeHeatingLevel(data[2]);

        // Bytes 3-4: Measured Temperature (uint16, little-endian)
        const tempRaw = data[3] | (data[4] << 8);
        result.measured_temperature = decodeTemperature(tempRaw);

        // Bytes 5-6: Set Point (uint16, little-endian)
        const setpointRaw = data[5] | (data[6] << 8);
        result.set_point = decodeSetpoint(setpointRaw);

        // Byte 7: System Status
        if (data.length > 7) {
            result.system_status = decodeSystemStatus(data[7]);
        }

        // Raw values for debugging
        result.raw_instance = data[0];
        result.raw_operating_state = data[1];
        result.raw_heating_level = data[2];
        result.raw_temperature = tempRaw;
        result.raw_setpoint = setpointRaw;
        if (data.length > 7) {
            result.raw_system_status = data[7];
        }
    }

    // Add convenience fields
    result.floor_heat_active = result.operating_state &&
                              (result.operating_state.includes("On") || result.operating_state.includes("Heating"));
    result.floor_heat_available = result.system_status &&
                                 !result.system_status.includes("System Fault") &&
                                 result.system_status !== "Not Available";
    result.heating_active = result.operating_state && result.operating_state.includes("Heating");

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

// Decode the FLOOR_HEAT_STATUS message
const decodedData = decodeFloorHeatMessage(dgn, dataBytes);

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