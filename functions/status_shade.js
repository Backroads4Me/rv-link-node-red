// Assumes the input msg.payload is the decoded RV-C status message for a shade
// e.g., { instance: 5, motor_status: 1, forward_status: 1, reverse_status: 0 }
// NOTE: operating_status is motor duty cycle (power %), NOT physical position

const instance = msg.payload.instance;
const motorStatus = msg.payload.motor_status;
const forwardStatus = msg.payload.forward_status;
const reverseStatus = msg.payload.reverse_status;

// Ignore invalid instances
if (typeof instance !== 'number' || instance < 1 || instance > 250) {
    return null;
}

let haState;
let position;

if (motorStatus === 1 && forwardStatus === 1) {
    haState = "opening";
    position = 50; // Arbitrary position while moving
} else if (motorStatus === 1 && reverseStatus === 1) {
    haState = "closing";
    position = 50; // Arbitrary position while moving
} else {
    // Motor stopped - report as open with 50% position
    // This keeps both open and close buttons enabled in HA
    haState = "open";
    position = 50; // Always report 50% when stopped (keeps both buttons active)
}

msg.topic = `homeassistant/cover/shade_${instance}/state`;
msg.payload = JSON.stringify({
    state: haState,
    position: position
});
msg.retain = true;

return msg;