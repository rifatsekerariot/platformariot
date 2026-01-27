/**
 * indexDB operation class
 */
interface OptionsType {
    /** DB name */
    dbName?: string;
    /** Store name */
    storeName: string;
    /** version (must be 64-bit integer) */
    version?: number;
    /** Primary key，default is `id` */
    keyPath?: string | string[];
    /** Index */
    indexs?: Record<
        string,
        IDBIndexParameters & {
            keyPath?: string | string[];
        }
    >;
}

export class IndexedDBStorage {
    private dbName: OptionsType['dbName'];
    private storeName?: OptionsType['storeName'];
    private db: IDBDatabase | null = null;

    constructor(dbName: string) {
        this.dbName = dbName;
    }

    /**
     * Init IndexedDB
     */
    async init({
        dbName = this.dbName,
        storeName,
        version = 1,
        keyPath = 'id',
        indexs,
    }: OptionsType): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dbName = dbName;
            this.storeName = storeName;
            const request = window.indexedDB.open(dbName!, version);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(storeName)) {
                    const store = db.createObjectStore(storeName, { keyPath });

                    Object.entries(indexs || {}).forEach(([key, config]) => {
                        store.createIndex(key, config.keyPath || key, config);
                    });
                } else {
                    const store = request.transaction?.objectStore(storeName);

                    Object.entries(indexs || {}).forEach(([key, config]) => {
                        if (store?.indexNames.contains(key)) {
                            store?.deleteIndex(key);
                        }
                        store?.createIndex(key, config.keyPath || key, config);
                    });
                }
            };

            request.onsuccess = (event: Event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    async addItem<T extends Record<string, any>>(data: T, ttl?: number): Promise<void> {
        const { db, storeName } = this;
        if (!db || !storeName) {
            console.warn('Please init the IndexedDBStorage first');
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            if (ttl) {
                data = { ...data, expiry: Date.now() + ttl };
            }

            const request = store.add(data);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBRequest).error);
            };
        });
    }

    /**
     * Update data
     */
    async putItem<T extends Record<string, any>>(
        data: T,
        key: string,
        ttl?: number,
    ): Promise<void> {
        const { db, storeName } = this;
        if (!db || !storeName) {
            console.warn('Please init the IndexedDBStorage first');
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            if (ttl) {
                data = { ...data, expiry: Date.now() + ttl };
            }

            const request = store.put(data, key);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBRequest).error);
            };
        });
    }

    /**
     * Delete a single data (only supports deleting by primary key)
     * @param keyValue Primary key value
     */
    async removeItem(keyValue: ApiKey): Promise<boolean> {
        const { db, storeName } = this;
        if (!db || !storeName) {
            console.warn('Please init the IndexedDBStorage first');
            return false;
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(keyValue);

            request.onsuccess = (_: Event) => {
                resolve(true);
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBRequest).error);
            };
        });
    }

    /**
     * Delete multiple data
     * @param key Search key
     * @param values Search key values (If the values is not empty, all the data will be deleted)
     */
    async removeItems(key: string, values: ApiKey | ApiKey[]): Promise<boolean> {
        const { db, storeName } = this;
        if (!db || !storeName) {
            console.warn('Please init the IndexedDBStorage first');
            return false;
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.index(key).openCursor();
            const query = Array.isArray(values) ? values : [values];

            request.onsuccess = (event: Event) => {
                const cursor = (event.target as IDBRequest).result;

                if (cursor) {
                    const value = cursor.value?.[key];

                    if (query.includes(value)) cursor.delete();
                    cursor.continue();
                } else {
                    // No more matching records
                    resolve(true);
                }
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBRequest).error);
            };
        });
    }

    /**
     * Get all data under the current Store with the specified conditions
     * @param key Search key
     * @param query Search query
     * @param direction The cursor's direction（ Default is `prev`）
     */
    async getItems<T extends Record<string, any>[]>(
        key = 'id',
        query?: IDBValidKey | IDBKeyRange | null,
        direction?: IDBCursorDirection,
    ): Promise<T | null> {
        const { db, storeName } = this;
        if (!db || !storeName) {
            console.warn('Please init the IndexedDBStorage first');
            return null;
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.index(key).openCursor(query, direction);
            const result = [] as unknown as T;

            request.onsuccess = (event: Event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    result.push(cursor.value);
                    cursor.continue();
                } else {
                    // No more matching records
                    resolve(result);
                }
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBRequest).error);
            };
        });
    }

    /**
     * Clear all data under the current Store, return `true` when the clear is successful
     */
    async clear(): Promise<boolean> {
        const { db, storeName } = this;
        if (!db || !storeName) {
            console.warn('Please init the IndexedDBStorage first');
            return false;
        }

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = (event: Event) => {
                console.log(event);
                reject((event.target as IDBRequest).error);
            };
        });
    }
}
