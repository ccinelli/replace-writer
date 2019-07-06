module.export = class Cache {
    // h is an optional hash function
    constructor({ h = (k) => k }) {
        this.cache = new WeakMap();
        this.h = h;
    }
    // Please return promisified object so this can be sync
    getOrElse(key, valueFunction) {
        const _key = this.h(key);
        const cachedValue = this.cache.get(key);
        if (cachedValue) return cachedValue;
        const pV = valueFunction();
        this.cache.set(_key, pV);
        return pV;
    }
};
