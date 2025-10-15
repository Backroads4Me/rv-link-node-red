// CHARGER_STATUS Decoder (Updated with Flat Output) - Complete RV-C Implementation
// Decodes CHARGER_STATUS messages per RV-C specification
// Handles battery charger operation status and control
// Input: msg.payload with {dgn, dataPayload, ...other fields}
// Output: msg.payload with decoded fields merged at top level

// === Helper Functions ===

function decodeBits(value, startBit, endBit) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit;
    return (value & mask) >> startBit;
}

// === CHARGER_STATUS Specific Decoders ===

function decodeChargerInstance(value) {
    // Charger instance mapping
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
    // Charger operating state mapping per RV-C specification
    const states = {
        0: "Off",
        1: "Bulk",
        2: "Absorption",
        3: "Overcharge",
        4: "Equalize",
        5: "Float",
        6: "No Charge",
        7: "Constant Voltage",
        8: "Constant Current",
        9: "Fault",
        10: "Unavailable",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return states[value] || `Unknown State ${value}`;
}

function decodeChargerCommand(value) {
    // Charger command mapping
    const commands = {
        0: "Off",
        1: "On",
        2: "Bulk",
        3: "Absorption",
        4: "Overcharge",
        5: "Equalize",
        6: "Float",
        7: "Auto",
        8: "Reset Fault",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return commands[value] || `Unknown Command ${value}`;
}

function decodeChargerType(value) {
    // Charger type mapping
    const chargerTypes = {
        0: "Unknown",
        1: "AC-DC Converter",
        2: "Solar Controller",
        3: "Wind Generator",
        4: "Alternator",
        5: "DC-DC Converter",
        6: "Fuel Cell",
        7: "Shore Power",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return chargerTypes[value] || `Unknown Type ${value}`;
}

function decodeDCVoltage(value) {
    // DC voltage in volts (0.05V resolution)
    if (value <= 6400) {
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
    // DC current in amperes (0.05A resolution)
    if (value <= 6400) {
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

function decodeACVoltage(value) {
    // AC voltage in volts (1V resolution)
    if (value <= 300) {
        return value; // Direct voltage value
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

function decodeACCurrent(value) {
    // AC current in amperes (0.1A resolution)
    if (value <= 6400) {
        return parseFloat((value * 0.1).toFixed(1)); // 0.1A per step
    } else if (value === 65533) {
        return "Out of Range";
    } else if (value === 65534) {
        return "Reserved";
    } else if (value === 65535) {
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

function decodeEfficiency(value) {
    // Efficiency as percentage
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

function decodeSystemStatus(value) {
    // System status bit field
    const statusBits = [];

    if (value & 0x01) statusBits.push("Charging Active");
    if (value & 0x02) statusBits.push("AC Input Available");
    if (value & 0x04) statusBits.push("Battery Connected");
    if (value & 0x08) statusBits.push("Equalize Mode");
    if (value & 0x10) statusBits.push("Overtemperature");
    if (value & 0x20) statusBits.push("Reverse Polarity");
    if (value & 0x40) statusBits.push("Service Required");
    if (value & 0x80) statusBits.push("System Fault");

    return statusBits.length > 0 ? statusBits.join(", ") : "Normal";
}

function decodeFaultCode(value) {
    // Fault code mapping
    const faultCodes = {
        0: "No Fault",
        1: "Overvoltage Input",
        2: "Undervoltage Input",
        3: "Overtemperature",
        4: "Fan Failure",
        5: "Communication Error",
        6: "Battery Fault",
        7: "Ground Fault",
        8: "Current Limit",
        9: "Internal Fault",
        10: "Reverse Polarity",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return faultCodes[value] || `Unknown Fault ${value}`;
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
        // Handle specific CHARGER_STATUS parameter types
        if (param.name === 'instance') {
            return decodeChargerInstance(value);
        }
        if (param.name === 'operating state' || param.name === 'state') {
            return decodeOperatingState(value);
        }
        if (param.name === 'command') {
            return decodeChargerCommand(value);
        }
        if (param.name === 'charger type' || param.name === 'type') {
            return decodeChargerType(value);
        }
        if (param.name === 'ac voltage' || param.name.includes('ac') && param.name.includes('voltage')) {
            return decodeACVoltage(value);
        }
        if (param.name.includes('temperature')) {
            return decodeTemperature(value);
        }
        if (param.name === 'efficiency') {
            return decodeEfficiency(value);
        }
        if (param.name === 'system status' || param.name === 'status') {
            return decodeSystemStatus(value);
        }
        if (param.name === 'fault code') {
            return decodeFaultCode(value);
        }

        // Default uint8 handling
        return value;

    } else if (param.type === 'uint16') {
        if (param.name === 'dc voltage' || param.name.includes('dc') && param.name.includes('voltage')) {
            return decodeDCVoltage(value);
        }
        if (param.name === 'dc current' || param.name.includes('dc') && param.name.includes('current')) {
            return decodeDCCurrent(value);
        }
        if (param.name === 'ac current' || param.name.includes('ac') && param.name.includes('current')) {
            return decodeACCurrent(value);
        }
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

function decodeChargerMessage(dgn, data) {
    const result = {
        dgn: dgn,
        dgn_name: "CHARGER_STATUS"
    };

    // Decode based on CHARGER_STATUS format (8 bytes typical)
    if (data.length >= 8) {
        // Byte 0: Instance
        result.instance = decodeChargerInstance(data[0]);

        // Byte 1: Operating State
        result.operating_state = decodeOperatingState(data[1]);

        // Byte 2: Charger Type
        result.charger_type = decodeChargerType(data[2]);

        // Bytes 3-4: DC Voltage (16-bit, little-endian)
        const dcVoltage = data[3] | (data[4] << 8);
        result.dc_voltage = decodeDCVoltage(dcVoltage);

        // Bytes 5-6: DC Current (16-bit, little-endian)
        const dcCurrent = data[5] | (data[6] << 8);
        result.dc_current = decodeDCCurrent(dcCurrent);

        // Byte 7: Temperature
        result.temperature = decodeTemperature(data[7]);

        // Raw values for debugging
        result.raw_instance = data[0];
        result.raw_operating_state = data[1];
        result.raw_charger_type = data[2];
        result.raw_dc_voltage_bytes = [data[3], data[4]];
        result.raw_dc_current_bytes = [data[5], data[6]];
        result.raw_temperature = data[7];
    }

    // Add convenience fields
    if (result.operating_state !== undefined) {
        const state = result.operating_state.toString().toLowerCase();
        result.charger_active = !["off", "no charge", "fault", "unavailable", "error"].includes(state);
        result.charger_charging = ["bulk", "absorption", "float", "equalize"].includes(state);
        result.charger_available = !["fault", "unavailable", "error"].includes(state);
        result.is_in_fault = state.includes("fault") || state.includes("error");
    }

    // Power calculation if voltage and current are available
    if (typeof result.dc_voltage === 'number' && typeof result.dc_current === 'number') {
        result.dc_power = parseFloat((result.dc_voltage * result.dc_current).toFixed(2));
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

// Decode the CHARGER_STATUS message
const decodedData = decodeChargerMessage(dgn, dataBytes);

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