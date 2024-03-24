export interface FingerState<T> {
    thumb: T;
    index: T;
    middle: T;
    ring: T;
    pinky: T;
}
export type Fingers = keyof FingerState<any>;
const FINGERS: Array<Fingers> = ['thumb', 'index', 'middle', 'ring', 'pinky'];

export class PulseDevice extends EventTarget {
    hidDevice: HIDDevice;
    pull: FingerState<number>;
    pullNormalized: FingerState<number>;
    splay: FingerState<number>;

    // Calibration
    pullCalibration: FingerState<{min: number, max: number}>;

    constructor(hidDevice: HIDDevice) {
        super();
        this.hidDevice = hidDevice;
        this.pull = initFingerState(() => 0);
        this.pullNormalized = initFingerState(() => 0);
        this.splay = initFingerState(() => 0);
        this.pullCalibration = initFingerState(() => ({ min: 0, max: 16383 }));

        if(!this.hidDevice.opened) {
            this.hidDevice.open();
        }
        this.hidDevice.addEventListener('inputreport', e => this.updateState(e.data))
    }

    private updateState(data: DataView) {
        for(let i = 0; i < 5; i++) {
            const finger = FINGERS[i];

            const a = data.getUint8(i*3);
            const b = data.getUint8(i*3+1);
            const c = data.getUint8(i*3+2);

            const pull = (a << 6) | (b >> 2);
            const splay = ((b & 0b00000011) << 8) | c;
            this.pull[finger] = pull;
            const calibration = this.pullCalibration[finger];
            this.pullNormalized[finger] = (pull - calibration.min) / (calibration.max - calibration.min);
            this.splay[finger] = splay;
        }

        this.dispatchEvent(new CustomEvent('input'));
    }
}

function initFingerState<T>(defaultValueFn: () => T): FingerState<T> {
    return {
        thumb: defaultValueFn(),
        index: defaultValueFn(),
        middle: defaultValueFn(),
        ring: defaultValueFn(),
        pinky: defaultValueFn(),
    };
}