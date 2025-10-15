// GENERATOR_STATUS Decoder (Updated with Flat Output) - Complete RV-C Implementation
// Decodes GENERATOR_STATUS messages per RV-C specification
// Handles generator operation status and control
// Input: msg.payload with {dgn, dataPayload, ...other fields}
// Output: msg.payload with decoded fields merged at top level

// === Helper Functions ===

function decodeBits(value, startBit, endBit) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit;
    return (value & mask) >> startBit;
}

// === GENERATOR_STATUS Specific Decoders ===

function decodeGeneratorInstance(value) {
    // Generator instance mapping
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
    // Generator operating state mapping per RV-C specification (extended)
    const states = {
        0: "Off",
        1: "Starting",
        2: "Running",
        3: "Stopping",
        4: "Cool Down",
        5: "Prime/Pre-Heat",
        6: "Exercise",
        7: "Test",
        8: "Fault",
        9: "Maintenance Required",
        10: "Remote Start",
        11: "Warm Up",
        12: "Load Test",
        13: "Safety Shutdown",
        14: "Over Temperature",
        15: "Low Oil Pressure",
        16: "Over Speed",
        17: "Under Speed",
        18: "Over Voltage",
        19: "Under Voltage",
        20: "Over Current",
        21: "Under Current",
        22: "Auto Start",
        23: "Manual Start",
        24: "Scheduled Start",
        25: "Emergency Start",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return states[value] || `Unknown State ${value}`;
}

function decodeGeneratorCommand(value) {
    // Generator command mapping
    const commands = {
        0: "Stop",
        1: "Start",
        2: "Exercise",
        3: "Test",
        4: "Prime",
        5: "Pre-Heat",
        6: "Reset Fault",
        7: "Clear Maintenance",
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
        1: "Gasoline",
        2: "Diesel",
        3: "Propane",
        4: "Natural Gas",
        5: "Dual Fuel",
        251: "Error",
        252: "Not Supported",
        253: "Out of Range",
        254: "Reserved",
        255: "Not Available"
    };

    return fuelTypes[value] || `Unknown Fuel ${value}`;
}

function decodeEngineRPM(value) {
    // Engine RPM (4 RPM resolution)
    if (value <= 16000) {
        return value * 4; // 4 RPM per step
    } else if (value === 65533) {
        return "Out of Range";
    } else if (value === 65534) {
        return "Reserved";
    } else if (value === 65535) {
        return "Not Available";
    }
    return "Invalid";
}

function decodeRunTime(value) {
    // Run time in hours (0.1 hour resolution)
    if (value <= 655300) {
        return parseFloat((value * 0.1).toFixed(1)); // 0.1 hour per step
    } else if (value === 4294967293) {
        return "Out of Range";
    } else if (value === 4294967294) {
        return "Reserved";
    } else if (value === 4294967295) {
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

function decodeFuelLevel(value) {
    // Fuel level as percentage
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

function decodeOilPressure(value) {
    // Oil pressure in kPa (0.5 kPa resolution)
    if (value <= 500) {
        return parseFloat((value * 0.5).toFixed(1)); // 0.5 kPa per step
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
    // AC voltage for single-byte generator status (simplified)
    if (value <= 250) {
        return parseFloat((value * 1.2).toFixed(1)); // 1.2V per step, 0-300V range
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
    // AC current for single-byte generator status (simplified)
    if (value <= 250) {
        return parseFloat((value * 0.4).toFixed(1)); // 0.4A per step, 0-100A range
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

function decodeFaultStatus(value) {
    // Fault status bit field
    const faults = [];

    if (value & 0x01) faults.push("Low Oil Pressure");
    if (value & 0x02) faults.push("High Temperature");
    if (value & 0x04) faults.push("Low Fuel");
    if (value & 0x08) faults.push("Overcurrent");
    if (value & 0x10) faults.push("Overvoltage");
    if (value & 0x20) faults.push("Undervoltage");
    if (value & 0x40) faults.push("Service Required");
    if (value & 0x80) faults.push("System Fault");

    return faults.length > 0 ? faults.join(", ") : "No Faults";
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
        // Handle specific GENERATOR_STATUS parameter types
        if (param.name === 'instance') {
            return decodeGeneratorInstance(value);
        }
        if (param.name === 'operating state' || param.name === 'state') {
            return decodeOperatingState(value);
        }
        if (param.name === 'command') {
            return decodeGeneratorCommand(value);
        }
        if (param.name === 'fuel type') {
            return decodeFuelType(value);
        }
        if (param.name.includes('temperature')) {
            return decodeTemperature(value);
        }
        if (param.name === 'fuel level') {
            return decodeFuelLevel(value);
        }
        if (param.name === 'oil pressure') {
            return decodeOilPressure(value);
        }
        if (param.name === 'fault status' || param.name === 'faults') {
            return decodeFaultStatus(value);
        }

        // Default uint8 handling
        return value;

    } else if (param.type === 'uint16') {
        if (param.name === 'engine rpm' || param.name === 'rpm') {
            return decodeEngineRPM(value);
        }

        // Default uint16 handling
        return value;

    } else if (param.type === 'uint32') {
        if (param.name === 'run time' || param.name === 'runtime') {
            return decodeRunTime(value);
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

function decodeGeneratorMessage(dgn, data) {
    const result = {
        dgn: dgn,
        dgn_name: "GENERATOR_STATUS"
    };

    // Decode based on GENERATOR_STATUS format (8 bytes typical)
    if (data.length >= 8) {
        // Byte 0: Instance
        result.instance = decodeGeneratorInstance(data[0]);

        // Byte 1: Operating State
        result.operating_state = decodeOperatingState(data[1]);

        // Byte 2: Fuel Type
        result.fuel_type = decodeFuelType(data[2]);

        // Bytes 3-4: Engine RPM (16-bit, little-endian)
        const engineRPM = data[3] | (data[4] << 8);
        result.engine_rpm = decodeEngineRPM(engineRPM);

        // Byte 5: AC Voltage (single byte for generators)
        result.ac_voltage = decodeACVoltage(data[5]);

        // Byte 6: AC Current (single byte approximation)
        result.ac_current = decodeACCurrent(data[6]);

        // Byte 7: Temperature
        result.temperature = decodeTemperature(data[7]);

        // Raw values for debugging
        result.raw_instance = data[0];
        result.raw_operating_state = data[1];
        result.raw_fuel_type = data[2];
        result.raw_engine_rpm_bytes = [data[3], data[4]];
        result.raw_ac_voltage = data[5];
        result.raw_ac_current = data[6];
        result.raw_temperature = data[7];
    }

    // Add convenience fields
    if (result.operating_state !== undefined) {
        const state = result.operating_state.toString().toLowerCase();
        result.generator_running = state === "running";
        result.generator_available = !["fault", "maintenance required", "error"].includes(state);
        result.is_in_fault = state.includes("fault") || state.includes("error");
        result.is_exercising = state === "exercise";
        result.needs_maintenance = state === "maintenance required";
    }

    // Power calculation if voltage and current are available
    if (typeof result.ac_voltage === 'number' && typeof result.ac_current === 'number') {
        result.ac_power = parseFloat((result.ac_voltage * result.ac_current).toFixed(2));
    }

    // Engine status
    result.engine_running = typeof result.engine_rpm === 'number' && result.engine_rpm > 0;

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

// Decode the GENERATOR_STATUS message
const decodedData = decodeGeneratorMessage(dgn, dataBytes);

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