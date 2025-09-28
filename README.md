# RV-Link Offline

## System Overview

RV-Link is an application for monitoring and controlling RV systems through the RV-C protocol. The system bridges RV CAN bus messages with MQTT for integration with Home Assistant.

## Architecture

### Hardware Stack

- **Raspberry Pi 5** - Main processing unit running Node-RED
- **Waveshare Isolated RS485 CAN HAT B** - Interfaces with RV-C CAN bus network
- **HA_CAN_MQTT_BRIDGE Add-on** - Required Home Assistant add-on for CAN bus communication

### Software Stack

- **Home Assistant OS** - Host environment
- **Node-RED** - Visual flow-based programming environment
- **MQTT Broker (Mosquitto)** - Message routing and communication hub
- **RV-C Network** - RV's internal CAN bus system connecting all devices

## Core Features

### 1. Bidirectional RV-C Communication

**RV to Home Assistant (Status Updates):**

- Real-time CAN bus message reception via HA_CAN_MQTT_BRIDGE
- Complete RV-C message parsing and DGN identification
- Automatic Home Assistant entity creation via MQTT Discovery
- Support for 23+ RV system types including:
  - DC power systems (batteries, chargers, inverters)
  - AC power systems (generators, shore power, ATS)
  - HVAC systems (thermostats, furnaces, floor heat)
  - Tank systems (fresh/gray/black water, autofill)
  - Lighting and controls (dimmers, switches, indicators)
  - Window shades and locks

**Home Assistant to RV (Commands):**

- HA command processing via `decode_ha_mqtt.js`
- Single-function command architecture with complete CAN encoding
- Direct CAN message transmission via HA_CAN_MQTT_BRIDGE
- Support for complex device operations (water pump modes, shade positioning, lock controls)

### 2. Advanced Message Processing

- **Standalone Decoder Architecture** - Each function implements complete RV-C specification logic
- **Instance-Based Device Identification** - Unique entity IDs based on actual RV configuration
- **Real-time Validation** - All decoders validated against actual RV CAN recordings
- **Comprehensive Error Handling** - Raw value debugging and validation

### 3. Home Assistant Integration

- **MQTT Discovery** - Automatic entity creation with appropriate component types
- **Entity Type Mapping**:
  - Window shades → `switch` component (open/close)
  - Locks → `lock` component (lock/unlock)
  - Indicators → `light` component (brightness/effects)
  - Water pumps → `switch` component (on/off/auto/manual)
  - Tanks → `sensor` component (level monitoring)
- **Meaningful Entity Names** - Based on actual RV device labels (e.g., "Driver Shade Day", "Door Lock")

## Implementation Status

### ✅ Completed Features

- **Core CAN Message Processing** - Complete RV-C CAN bus decoding pipeline
- **STATUS Message Decoders** - 23+ RV system types with full parameter decoding
- **Consolidated HA Integration** - Single-function architecture for status updates and commands
- **MQTT Discovery Integration** - Automatic HA entity creation with proper component mapping
- **Command Validation** - Tested against real RV CAN recordings

### ✅ Supported RV Systems

- Water pumps, generators, thermostats, floor heating
- DC/AC power systems, inverters, chargers, ATS
- Tank monitoring, autofill systems
- Window shades, locks, lighting controls
- And many more RV-C compliant devices

## Project Structure

```
functions/
├── decode_rvc_can.js              # Main CAN message parser
├── decode_*_status.js             # STATUS message decoders (23 types)
├── decode_ha_mqtt.js              # HA command decoder
├── mqtt_create_*.js               # HA entity creation functions
├── mqtt_ha_send_*.js              # Dual-purpose: status updates & commands
└── universal_ha_entity_creator.js # Universal entity creator

rvc/
└── dgn-summary-table.json         # DGN lookup table (387+ entries)

RVC_specification/                 # Official RV-C documentation
```

## Getting Started

### Prerequisites

1. Home Assistant OS with Node-RED add-on
2. HA_CAN_MQTT_BRIDGE add-on installed from: https://github.com/Backroads4Me/HA_CAN_MQTT_BRIDGE
3. CAN bus interface hardware (Waveshare RS485 CAN HAT B recommended)

### Installation

1. Import Node-RED flows for CAN message processing
2. Copy function code from `functions/` directory into Node-RED function nodes
3. Configure HA_CAN_MQTT_BRIDGE add-on for your CAN interface
4. Deploy flows and monitor debug output for incoming RV-C messages

## Development

All functions are standalone Node-RED function nodes with no external dependencies. Each decoder implements complete RV-C specification logic with comprehensive error handling and raw value debugging for troubleshooting.
