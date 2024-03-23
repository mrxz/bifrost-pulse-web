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
    splay: FingerState<number>;

    constructor(hidDevice: HIDDevice) {
        super();
        this.hidDevice = hidDevice;
        this.pull = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 };
        this.splay = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 };

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
            this.splay[finger] = splay;
        }

        this.dispatchEvent(new CustomEvent('input'));
    }
}