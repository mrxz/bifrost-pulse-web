import { PulseDevice } from "./pulse-device";
import { onDeviceConnect, onDeviceDisconnect } from "./connect";

export async function init() {
    // Register for connection and disconnection events.
    navigator.hid.addEventListener('connect', e => onDeviceConnect(e.device));
    navigator.hid.addEventListener('disconnect', e => onDeviceDisconnect(e.device));

    // Check connected devices
    const devices = await navigator.hid.getDevices();
    for(let device of devices) {
        onDeviceConnect(device);
    }
}

export { leftDevice, rightDevice } from "./connect";