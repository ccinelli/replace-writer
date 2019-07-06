module.export = class Cache {
    // h is an optional hash function
    constructor({ h = (k) => k }) {
        this.cache = {};
        this.h = h;
    }
    // Please return promisified object so this can be sync
    getOrElse(key, valueFunction) {
        const _key = this.h(key);
        const cachedValue = this.cache[_key];
        if (cachedValue) return cachedValue;
        const pV = valueFunction();
        this.cache[_key] = pV;
        return pV;
    }
};
