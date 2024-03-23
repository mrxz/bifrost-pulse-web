import { PulseDevice } from "./pulse-device";

const VENDOR_ID = 0x1915;
const PRODUCT_ID_LEFT = 0xEEE3;
const PRODUCT_ID_RIGHT = 0xEEE2;
const HID_FILTERS: Array<HIDDeviceFilter> = [
    // Pulse (L)
    { vendorId: VENDOR_ID, productId: PRODUCT_ID_LEFT },
    // Pulse (R)
    { vendorId: VENDOR_ID, productId: PRODUCT_ID_RIGHT },
];

// Keep track of the connected pulse devices
const CONNECTED_PULSE_DEVICES: Array<PulseDevice> = [];
// Quick access to left/right
export let leftDevice: PulseDevice|null = null;
export let rightDevice: PulseDevice|null = null;

export function onDeviceConnect(device: HIDDevice) {
    // Verify the device is a Pulse
    if(device.vendorId !== VENDOR_ID || (device.productId !== PRODUCT_ID_LEFT && device.productId !== PRODUCT_ID_RIGHT)) {
        return;
    }

    const pulseDevice = new PulseDevice(device);
    CONNECTED_PULSE_DEVICES.push(pulseDevice);

    const isLeft = device.productId === PRODUCT_ID_LEFT;
    if(isLeft && !leftDevice) {
        leftDevice = pulseDevice;
    } else if(!isLeft && !rightDevice) {
        rightDevice = pulseDevice;
    }
}

export function onDeviceDisconnect(device: HIDDevice) {
    // Find matching pulse device, if any;
    const index = CONNECTED_PULSE_DEVICES.findIndex(x => x.hidDevice === device);
    const pulseDevice = CONNECTED_PULSE_DEVICES[index];
    if (pulseDevice) {
        if(leftDevice === pulseDevice) {
            leftDevice = null;
        } else if(rightDevice === pulseDevice) {
            rightDevice = null;
        }
        CONNECTED_PULSE_DEVICES.splice(index, 1);
    }
}

export async function requestDevice(filter = true) {
    const devices = await navigator.hid.requestDevice({ filters: filter ? HID_FILTERS : [] });
}