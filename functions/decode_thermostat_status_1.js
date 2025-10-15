// THERMOSTAT_STATUS_1 Decoder (Updated with Flat Output) - Complete RV-C Implementation
// Decodes THERMOSTAT_STATUS_1 messages per RV-C specification
// Handles primary thermostat control and status information
// Input: msg.payload with {dgn, dataPayload, ...other fields}
// Output: msg.payload with decoded fields merged at top level

// === Helper Functions ===

function decodeBits(value, startBit, endBit) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit;
    return (value & mask) >> startBit;
}

// === THERMOSTAT_STATUS_1 Specific Decoders ===

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

function decodeOperatingMode(value) {
    // Operating mode mapping per RV-C specification (extended)
    const modes = {
        0: "Off",
        1: "Auto",
        2: "Heat",
        3: "Cool",
        4: "Furnace",
        5: "Fan Only",
        6: "Dry",
        7: "Emergency Heat",
        8: "Heat Pump",
        9: "Defrost",
        10: "Aux Heat",
        11: "Eco Mode",
        12: "Sleep Mode",
        13: "Away Mode",
        14: "Manual Override",
        15: "Vacation Mode",
        16: "Schedule Mode",
        17: "Temperature Hold",
        18: "Energy Save",
        19: "Quick Heat",
        20: "Quick Cool",
        21: "System Test",
        22: "Calibration",
        23: "Service Mode",
        24: "Installation Mode",
        25: "Demo Mode",
        26: "Lock Mode",
        27: "Filter Mode",
        28: "Humidity Control",
        29: "Dehumidify",
        30: "Humidify",
        31: "Air Quality Mode",
        32: "Zone Control",
        33: "Multi-Stage Heat",
        34: "Multi-Stage Cool",
        35: "Heat Recovery",
        36: "Ventilation Mode",
        37: "Fresh Air Mode",
        38: "Recirculate Mode",
        39: "Purge Mode",
        40: "Startup Mode",
        41: "Shutdown Mode",
        42: "Fault Recovery",
        43: "Performance Test",
        44: "Efficiency Mode",
        45: "Comfort Mode",
        46: "Advanced Auto",
        47: "Smart Mode",
        48: "Remote Control",
        49: "Mobile App Control",
        50: "Voice Control",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return modes[value] || `Unknown Mode ${value}`;
}

function decodeFanMode(value) {
    // Fan mode mapping
    const fanModes = {
        0: "Auto",
        1: "On",
        2: "Low",
        3: "Medium",
        4: "High",
        5: "Variable",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return fanModes[value] || `Unknown Fan Mode ${value}`;
}

function decodeTemperature(value, isCelsius = false) {
    // Temperature decoding with offset (-40°C to +170°C range)
    if (value <= 210) {
        const temp = value - 40; // Offset by 40 degrees
        if (isCelsius) {
            return parseFloat(temp.toFixed(1));
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

function decodeSystemStatus(value) {
    // System status bit field
    if (value === 255) {
        return "Not Available";
    } else if (value === 254) {
        return "Reserved";
    } else if (value === 253) {
        return "Out of Range";
    }

    const statusBits = [];

    if (value & 0x01) statusBits.push("Heating Active");
    if (value & 0x02) statusBits.push("Cooling Active");
    if (value & 0x04) statusBits.push("Fan Running");
    if (value & 0x08) statusBits.push("Aux Heat Active");
    if (value & 0x10) statusBits.push("Defrost Active");
    if (value & 0x20) statusBits.push("System Fault");
    if (value & 0x40) statusBits.push("Filter Change Required");
    if (value & 0x80) statusBits.push("Service Required");

    return statusBits.length > 0 ? statusBits.join(", ") : "Standby";
}

function decodeFanSpeed(value) {
    // Fan speed as percentage (0-100%)
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

function decodeUint16(data, startByte) {
    // Decode 16-bit value (little-endian)
    if (!data || startByte + 1 >= data.length) {
        return 65535; // Not available
    }
    return data[startByte] | (data[startByte + 1] << 8);
}

// === Main Decode Function ===

function decodeThermostatStatus1Message(dgn, data) {
    const result = {
        dgn: dgn,
        dgn_name: "THERMOSTAT_STATUS_1"
    };

    // Decode based on THERMOSTAT_STATUS_1 format (8 bytes typical)
    if (data.length >= 8) {
        // Byte 0: Instance (Zone)
        result.instance = decodeThermostatInstance(data[0]);

        // Byte 1: Operating Mode
        result.operating_mode = decodeOperatingMode(data[1]);

        // Byte 2: Fan Mode
        result.fan_mode = decodeFanMode(data[2]);

        // Byte 3: Set Point Temperature
        result.set_point_temperature = decodeTemperature(data[3]);

        // Byte 4: Ambient Temperature
        result.ambient_temperature = decodeTemperature(data[4]);

        // Byte 5: System Status
        result.system_status = decodeSystemStatus(data[5]);

        // Byte 6: Fan Speed
        result.fan_speed = decodeFanSpeed(data[6]);

        // Byte 7: Reserved/Future use
        // Typically 0xFF in current implementations

        // Raw values for debugging
        result.raw_instance = data[0];
        result.raw_operating_mode = data[1];
        result.raw_fan_mode = data[2];
        result.raw_set_point_temperature = data[3];
        result.raw_ambient_temperature = data[4];
        result.raw_system_status = data[5];
        result.raw_fan_speed = data[6];
        if (data.length > 7) result.raw_byte_7 = data[7];
    }

    // Add convenience fields
    result.thermostat_available = result.instance !== "Not Available" &&
                                  result.operating_mode !== "Not Available";

    result.temperature_available = typeof result.ambient_temperature === 'number' &&
                                   typeof result.set_point_temperature === 'number';

    // Calculate temperature difference if both temps available
    if (result.temperature_available) {
        result.temperature_difference = parseFloat((result.ambient_temperature - result.set_point_temperature).toFixed(1));
        result.needs_heating = result.temperature_difference < -1; // More than 1°F below setpoint
        result.needs_cooling = result.temperature_difference > 1;  // More than 1°F above setpoint
    }

    // System operating status
    if (typeof result.system_status === 'string' && result.system_status !== "Not Available") {
        result.heating_active = result.system_status.includes("Heating Active");
        result.cooling_active = result.system_status.includes("Cooling Active");
        result.fan_running = result.system_status.includes("Fan Running");
        result.aux_heat_active = result.system_status.includes("Aux Heat Active");
        result.defrost_active = result.system_status.includes("Defrost Active");
        result.system_fault = result.system_status.includes("System Fault");
        result.filter_change_required = result.system_status.includes("Filter Change Required");
        result.service_required = result.system_status.includes("Service Required");
        result.system_active = result.heating_active || result.cooling_active || result.defrost_active;
    } else {
        result.heating_active = false;
        result.cooling_active = false;
        result.fan_running = false;
        result.aux_heat_active = false;
        result.defrost_active = false;
        result.system_fault = false;
        result.filter_change_required = false;
        result.service_required = false;
        result.system_active = false;
    }

    // Operating mode status
    result.is_off = result.operating_mode === "Off";
    result.is_auto_mode = result.operating_mode === "Auto";
    result.is_heating_mode = result.operating_mode === "Heat" || result.operating_mode === "Furnace" ||
                             result.operating_mode === "Heat Pump" || result.operating_mode === "Emergency Heat";
    result.is_cooling_mode = result.operating_mode === "Cool";

    // Fan status
    result.fan_auto_mode = result.fan_mode === "Auto";
    result.fan_on_mode = result.fan_mode === "On";

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

// Decode the THERMOSTAT_STATUS_1 message
const decodedData = decodeThermostatStatus1Message(dgn, dataBytes);

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