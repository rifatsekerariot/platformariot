/**
 * localStorage, sessionStorage operation class
 */
import { DEFAULT_CACHE_PREFIX } from './constant';

interface IStorage {
    /** The prefix of key name */
    prefix?: string;
    /** Maximum cache duration, unit `ms`（Default is `null`, do not clear the cache） */
    maxAge?: number | null;
    /** Storage type (localStorage | sessionStorage) */
    storage: Storage;
}

interface IData {
    /** Cache key */
    key: string;
    /** The latest update time */
    time: number;
    /** Maximum cache duration */
    maxAge?: IStorage['maxAge'];
    /** Cache value */
    value: any;
}

export class IotStorage implements IStorage {
    prefix: string;
    maxAge?: IStorage['maxAge'];
    storage: Storage;

    constructor({
        prefix = DEFAULT_CACHE_PREFIX,
        maxAge,
        storage = window.localStorage,
    }: IStorage) {
        this.prefix = prefix;
        this.maxAge = maxAge;
        this.storage = storage;
    }

    /** Set item */
    setItem(key: IData['key'], value: IData['value'], maxAge: IData['maxAge'] = this.maxAge) {
        const k = `${this.prefix}${key}`;
        const data: IData = {
            key: k,
            maxAge,
            time: Date.now(),
            value,
        };

        this.storage.setItem(k, JSON.stringify(data));
    }

    /** Get item */
    getItem<T = any>(key: IData['key']): T | undefined {
        const k = `${this.prefix}${key}`;
        const dataStr = this.storage.getItem(k) || '';
        let data: IData | undefined;

        try {
            data = JSON.parse(dataStr);
            // eslint-disable-next-line no-empty
        } catch (e) {}

        if (!dataStr || !data) return;

        let isExpired = false;
        if (data?.maxAge) {
            const expiredTime = data.time + data.maxAge;
            isExpired = expiredTime < Date.now();
        }

        if (isExpired) {
            this.storage.removeItem(k);
            return;
        }

        return data.value as T;
    }

    /** Remove item */
    removeItem(key: IData['key']) {
        const k = `${this.prefix}${key}`;
        this.storage.removeItem(k);
    }

    /** Batch remove items */
    removeItems(regex: RegExp) {
        const data = { ...this.storage };

        Object.keys(data).forEach(key => {
            const tempKey = key.replace(`${this.prefix}`, '');
            if (regex.test(tempKey)) this.removeItem(tempKey);
        });
    }

    /** Clear cache (Clear all caches that prefixed with `mos.`) */
    clear() {
        const data = { ...this.storage };

        Object.keys(data).forEach(key => {
            const regex = new RegExp(`^${this.prefix}`);
            if (regex.test(key)) this.removeItem(key);
        });
    }
}
