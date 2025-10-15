// INVERTER_STATUS Decoder (Updated with Flat Output) - Complete RV-C Implementation
// Decodes INVERTER_STATUS messages per RV-C specification
// Handles inverter operation status and control
// Input: msg.payload with {dgn, dataPayload, ...other fields}
// Output: msg.payload with decoded fields merged at top level

// === Helper Functions ===

function decodeBits(value, startBit, endBit) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit;
    return (value & mask) >> startBit;
}

// === INVERTER_STATUS Specific Decoders ===

function decodeInverterInstance(value) {
    // Inverter instance mapping
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
    // Inverter operating state mapping per RV-C specification
    const states = {
        0: "Off",
        1: "On",
        2: "Inverting",
        3: "Charging",
        4: "Passthrough",
        5: "Standby",
        6: "Fault",
        7: "Equalize",
        8: "Bulk Charge",
        9: "Absorption",
        10: "Float",
        11: "Search Mode",
        12: "Sleep Mode",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return states[value] || `Unknown State ${value}`;
}

function decodeInverterCommand(value) {
    // Inverter command mapping
    const commands = {
        0: "Off",
        1: "On",
        2: "Invert Only",
        3: "Charge Only",
        4: "Auto",
        5: "Search Mode",
        6: "Reset Fault",
        7: "Equalize",
        8: "Shore Power Priority",
        9: "Battery Priority",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return commands[value] || `Unknown Command ${value}`;
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
    // DC current in amperes (0.05A resolution, signed)
    const MAX_VALID = 2147483600;

    if (value <= MAX_VALID) {
        // Handle signed values for charging (positive) vs discharging (negative)
        const signedValue = value > 2147483647 ? value - 4294967296 : value;
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

function decodeFrequency(value) {
    // AC frequency in Hz (0.1Hz resolution)
    if (value <= 700) {
        return parseFloat((value * 0.1).toFixed(1)); // 0.1Hz per step
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

function decodeSystemStatus(value) {
    // System status bit field
    const statusBits = [];

    if (value & 0x01) statusBits.push("AC Output On");
    if (value & 0x02) statusBits.push("Charging Active");
    if (value & 0x04) statusBits.push("AC Input Available");
    if (value & 0x08) statusBits.push("Overload");
    if (value & 0x10) statusBits.push("Overtemperature");
    if (value & 0x20) statusBits.push("Low Battery");
    if (value & 0x40) statusBits.push("Service Required");
    if (value & 0x80) statusBits.push("System Fault");

    return statusBits.length > 0 ? statusBits.join(", ") : "Normal";
}

function decodeFaultCode(value) {
    // Fault code mapping
    const faultCodes = {
        0: "No Fault",
        1: "Overload",
        2: "Overvoltage Input",
        3: "Undervoltage Input",
        4: "Overvoltage Output",
        5: "Undervoltage Output",
        6: "Overtemperature",
        7: "Fan Failure",
        8: "Ground Fault",
        9: "DC Ripple",
        10: "AC Frequency Error",
        11: "Internal Fault",
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
        // Handle specific INVERTER_STATUS parameter types
        if (param.name === 'instance') {
            return decodeInverterInstance(value);
        }
        if (param.name === 'operating state' || param.name === 'state') {
            return decodeOperatingState(value);
        }
        if (param.name === 'command') {
            return decodeInverterCommand(value);
        }
        if (param.name === 'ac voltage' || param.name.includes('ac') && param.name.includes('voltage')) {
            return decodeACVoltage(value);
        }
        if (param.name === 'frequency') {
            return decodeFrequency(value);
        }
        if (param.name.includes('temperature')) {
            return decodeTemperature(value);
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
        if (param.name === 'ac current' || param.name.includes('ac') && param.name.includes('current')) {
            return decodeACCurrent(value);
        }
        if (param.name === 'dc voltage' || param.name.includes('dc') && param.name.includes('voltage')) {
            return decodeDCVoltage(value);
        }
        if (param.name.includes('temperature')) {
            return decodeTemperature(value);
        }

        // Default uint16 handling
        return value;

    } else if (param.type === 'uint32') {
        if (param.name === 'dc current' || param.name.includes('dc') && param.name.includes('current')) {
            return decodeDCCurrent(value);
        }

        // Default uint32 handling
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

function decodeInverterMessage(dgn, data) {
    const result = {
        dgn: dgn,
        dgn_name: "INVERTER_STATUS"
    };

    // Decode based on INVERTER_STATUS format (8 bytes typical)
    if (data.length >= 8) {
        // Byte 0: Instance
        result.instance = decodeInverterInstance(data[0]);

        // Byte 1: Operating State
        result.operating_state = decodeOperatingState(data[1]);

        // Byte 2: AC Voltage
        result.ac_voltage = decodeACVoltage(data[2]);

        // Bytes 3-4: AC Current (16-bit, little-endian)
        const acCurrent = data[3] | (data[4] << 8);
        result.ac_current = decodeACCurrent(acCurrent);

        // Bytes 5-6: DC Voltage (16-bit, little-endian)
        const dcVoltage = data[5] | (data[6] << 8);
        result.dc_voltage = decodeDCVoltage(dcVoltage);

        // Byte 7: Temperature or Frequency
        result.temperature = decodeTemperature(data[7]);

        // Raw values for debugging
        result.raw_instance = data[0];
        result.raw_operating_state = data[1];
        result.raw_ac_voltage = data[2];
        result.raw_ac_current_bytes = [data[3], data[4]];
        result.raw_dc_voltage_bytes = [data[5], data[6]];
        result.raw_temperature = data[7];
    }

    // Add convenience fields
    if (result.operating_state !== undefined) {
        const state = result.operating_state.toString().toLowerCase();
        result.inverter_active = state === "inverting";
        result.charger_active = state === "charging";
        result.inverter_available = !["fault", "error"].includes(state);
        result.is_in_fault = state.includes("fault") || state.includes("error");
        result.is_passthrough = state === "passthrough";
        result.is_in_standby = state === "standby" || state === "search mode" || state === "sleep mode";
    }

    // Power calculation if voltage and current are available
    if (typeof result.ac_voltage === 'number' && typeof result.ac_current === 'number') {
        result.ac_power = parseFloat((result.ac_voltage * result.ac_current).toFixed(2));
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

// Decode the INVERTER_STATUS message
const decodedData = decodeInverterMessage(dgn, dataBytes);

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