// ---------- Array.prototype.at / String.prototype.at ----------
/**
 * Polyfill for Array.prototype.at and String.prototype.at methods
 */
function at<T extends any[] | string>(this: T, n: number): any {
    const integerN = Math.trunc(n) || 0;
    const len = this.length;

    let adjustedN = integerN;
    if (integerN < 0) {
        adjustedN += len;
    }

    if (typeof this === 'string') {
        return adjustedN >= 0 && adjustedN < len ? (this as string).charAt(adjustedN) : undefined;
    }

    return adjustedN >= 0 && adjustedN < len ? this[adjustedN] : undefined;
}

/**
 * Installs the 'at' method polyfill on a constructor's prototype
 * @param ctor - Constructor function (Array, String, etc.)
 */
const installAtMethod = (ctor: new (...args: any[]) => object) => {
    if (ctor.prototype && !Object.prototype.hasOwnProperty.call(ctor.prototype, 'at')) {
        Object.defineProperty(ctor.prototype, 'at', {
            value: at,
            writable: true,
            enumerable: false,
            configurable: true,
        });
    }
};

// Apply polyfill to core types
[Array, String].forEach(installAtMethod);
