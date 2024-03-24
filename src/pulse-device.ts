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
    // Input
    pull: FingerState<number>;
    pullNormalized: FingerState<number>;
    splay: FingerState<number>;

    // Calibration
    pullCalibration: FingerState<{min: number, max: number}>;

    // Output
    springs: FingerState<{one: number, two: number}>;
    vibration: FingerState<{intensity: number, frequency: number}>;
    private outputBuffer: Uint8Array = new Uint8Array(5*4);
    private outputBufferView: DataView = new DataView(this.outputBuffer.buffer);

    constructor(hidDevice: HIDDevice) {
        super();
        this.hidDevice = hidDevice;
        this.pull = initFingerState(() => 0);
        this.pullNormalized = initFingerState(() => 0);
        this.splay = initFingerState(() => 0);
        this.pullCalibration = initFingerState(() => ({ min: 0, max: 16383 }));
        this.springs = initFingerState(() => ({ one: 25, two: -25 }));
        this.vibration = initFingerState(() => ({ intensity: 0, frequency: 0 }));

        if(!this.hidDevice.opened) {
            this.hidDevice.open().then(_ => {
                // Send default output report
                this.sendOutputReport();
            });
        }
        this.hidDevice.addEventListener('inputreport', e => this.updateState(e.data))
    }

    sendOutputReport() {
        this.outputBuffer[0] = 2;
        for(let i = 0; i < 5; i++) {
            const finger = FINGERS[i];
            const springs = this.springs[finger];
            const vibration = this.vibration[finger];
            this.outputBuffer[i*4] = springs.one;
            this.outputBuffer[i*4 + 1] = springs.two;
            this.outputBuffer[i*4 + 2] = vibration.intensity;
            this.outputBuffer[i*4 + 3] = vibration.frequency;
        }

        this.hidDevice.sendReport(2, this.outputBufferView);
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