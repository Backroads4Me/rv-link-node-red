// FURNACE_STATUS Decoder (Updated with Flat Output) - Complete RV-C Implementation
// Decodes FURNACE_STATUS messages per RV-C specification
// Handles gas/diesel furnace operation status and control
// Input: msg.payload with {dgn, dataPayload, ...other fields}
// Output: msg.payload with decoded fields merged at top level

// === Helper Functions ===

function decodeBits(value, startBit, endBit) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit;
    return (value & mask) >> startBit;
}

// === FURNACE_STATUS Specific Decoders ===

function decodeFurnaceInstance(value) {
    // Furnace instance mapping
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
    // Furnace operating state mapping per RV-C specification
    const states = {
        0: "Off",
        1: "Starting",
        2: "Pre-Purge",
        3: "Ignition",
        4: "Flame Established",
        5: "Running",
        6: "Post-Purge",
        7: "Shutdown",
        8: "Lockout",
        9: "Fault",
        10: "Safety Check",
        11: "Cool Down",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return states[value] || `Unknown State ${value}`;
}

function decodeFurnaceCommand(value) {
    // Furnace command mapping
    const commands = {
        0: "Stop",
        1: "Start",
        2: "Reset Fault",
        3: "Test",
        4: "Service Mode",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return commands[value] || `Unknown Command ${value}`;
}

function decodeFuelType(value) {
    // Fuel type mapping
    const fuelTypes = {
        0: "Unknown",
        1: "Propane",
        2: "Diesel",
        3: "Gasoline",
        4: "Natural Gas",
        5: "Electric",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return fuelTypes[value] || `Unknown Fuel ${value}`;
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

function decodeFanSpeed(value) {
    // Fan speed as percentage
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

function decodeAirFlow(value) {
    // Air flow in CFM (Cubic Feet per Minute)
    if (value <= 65000) {
        return value; // Direct CFM value
    } else if (value === 65533) {
        return "Out of Range";
    } else if (value === 65534) {
        return "Reserved";
    } else if (value === 65535) {
        return "Not Available";
    }
    return "Invalid";
}

function decodeFaultCode(value) {
    // Fault code mapping
    const faultCodes = {
        0: "No Fault",
        1: "Ignition Failure",
        2: "Flame Loss",
        3: "High Temperature",
        4: "Low Gas Pressure",
        5: "High Gas Pressure",
        6: "Fan Failure",
        7: "Igniter Failure",
        8: "Flame Sensor Failure",
        9: "Control Board Fault",
        10: "Safety Lockout",
        11: "Overheat",
        12: "Airflow Problem",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return faultCodes[value] || `Unknown Fault ${value}`;
}

function decodeSystemStatus(value) {
    // System status bit field
    const statusBits = [];

    if (value & 0x01) statusBits.push("Flame Present");
    if (value & 0x02) statusBits.push("Igniter On");
    if (value & 0x04) statusBits.push("Gas Valve Open");
    if (value & 0x08) statusBits.push("Fan Running");
    if (value & 0x10) statusBits.push("Safety Circuit OK");
    if (value & 0x20) statusBits.push("High Limit OK");
    if (value & 0x40) statusBits.push("Service Required");
    if (value & 0x80) statusBits.push("System Fault");

    return statusBits.length > 0 ? statusBits.join(", ") : "Standby";
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
        // Handle specific FURNACE_STATUS parameter types
        if (param.name === 'instance') {
            return decodeFurnaceInstance(value);
        }
        if (param.name === 'operating state' || param.name === 'state') {
            return decodeOperatingState(value);
        }
        if (param.name === 'command') {
            return decodeFurnaceCommand(value);
        }
        if (param.name === 'fuel type') {
            return decodeFuelType(value);
        }
        if (param.name.includes('temperature')) {
            return decodeTemperature(value);
        }
        if (param.name === 'fan speed') {
            return decodeFanSpeed(value);
        }
        if (param.name === 'fault code') {
            return decodeFaultCode(value);
        }
        if (param.name === 'system status' || param.name === 'status') {
            return decodeSystemStatus(value);
        }

        // Default uint8 handling
        return value;

    } else if (param.type === 'uint16') {
        if (param.name === 'air flow' || param.name.includes('flow')) {
            return decodeAirFlow(value);
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

function decodeFurnaceMessage(dgn, data) {
    const result = {
        dgn: dgn,
        dgn_name: "FURNACE_STATUS"
    };

    // Decode based on FURNACE_STATUS format (8 bytes typical)
    if (data.length >= 8) {
        // Byte 0: Instance
        result.instance = decodeFurnaceInstance(data[0]);

        // Byte 1: Operating State
        result.operating_state = decodeOperatingState(data[1]);

        // Byte 2: Fuel Type
        result.fuel_type = decodeFuelType(data[2]);

        // Byte 3: Exhaust Temperature
        result.exhaust_temperature = decodeTemperature(data[3]);

        // Byte 4: Intake Temperature
        result.intake_temperature = decodeTemperature(data[4]);

        // Byte 5: Fan Speed
        result.fan_speed = decodeFanSpeed(data[5]);

        // Bytes 6-7: Air Flow (16-bit, little-endian)
        const airFlow = data[6] | (data[7] << 8);
        result.air_flow = decodeAirFlow(airFlow);

        // Raw values for debugging
        result.raw_instance = data[0];
        result.raw_operating_state = data[1];
        result.raw_fuel_type = data[2];
        result.raw_exhaust_temperature = data[3];
        result.raw_intake_temperature = data[4];
        result.raw_fan_speed = data[5];
        result.raw_air_flow_bytes = [data[6], data[7]];
    }

    // Add convenience fields
    if (result.operating_state !== undefined) {
        const state = result.operating_state.toString().toLowerCase();
        result.furnace_running = state === "running";
        result.furnace_heating = ["flame established", "running"].includes(state);
        result.furnace_available = !["fault", "lockout", "error"].includes(state);
        result.is_in_fault = state.includes("fault") || state.includes("lockout") || state.includes("error");
        result.is_starting = ["starting", "pre-purge", "ignition"].includes(state);
        result.is_shutting_down = ["post-purge", "shutdown", "cool down"].includes(state);
    }

    // Temperature status
    result.exhaust_temp_available = typeof result.exhaust_temperature === 'number';
    result.intake_temp_available = typeof result.intake_temperature === 'number';

    // Fan status
    result.fan_running = typeof result.fan_speed === 'number' && result.fan_speed > 0;

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

// Decode the FURNACE_STATUS message
const decodedData = decodeFurnaceMessage(dgn, dataBytes);

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