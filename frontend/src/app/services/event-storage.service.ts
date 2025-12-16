import { Injectable } from '@angular/core';
import { GateEvent } from './socket.service';

const DB_NAME = 'SmartGarageDB';
const DB_VERSION = 1;
const STORE_NAME = 'events';
const MAX_EVENTS = 500;

@Injectable({ providedIn: 'root' })
export class EventStorageService {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.initDB();
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async addEvent(event: GateEvent): Promise<void> {
    await this.dbReady;
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      // Add the event with timestamp as number for sorting
      const eventToStore = {
        ...event,
        timestamp: event.timestamp instanceof Date ? event.timestamp.getTime() : event.timestamp,
      };
      store.add(eventToStore);

      tx.oncomplete = async () => {
        await this.enforceLimit();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  private async enforceLimit(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const countReq = store.count();

      countReq.onsuccess = () => {
        const count = countReq.result;
        if (count > MAX_EVENTS) {
          const deleteCount = count - MAX_EVENTS;
          const index = store.index('timestamp');
          const cursor = index.openCursor();
          let deleted = 0;

          cursor.onsuccess = (e) => {
            const cur = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if (cur && deleted < deleteCount) {
              store.delete(cur.primaryKey);
              deleted++;
              cur.continue();
            }
          };
        }
      };

      tx.oncomplete = () => resolve();
    });
  }

  async getEvents(limit: number = 50): Promise<GateEvent[]> {
    await this.dbReady;
    if (!this.db) return [];

    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const events: GateEvent[] = [];

      // Open cursor in reverse (newest first)
      const cursor = index.openCursor(null, 'prev');

      cursor.onsuccess = (e) => {
        const cur = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cur && events.length < limit) {
          const event = cur.value;
          events.push({
            ...event,
            timestamp: new Date(event.timestamp),
          });
          cur.continue();
        } else {
          resolve(events);
        }
      };

      cursor.onerror = () => resolve([]);
    });
  }

  async clearEvents(): Promise<void> {
    await this.dbReady;
    if (!this.db) return;

    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
    });
  }

  async getEventCount(): Promise<number> {
    await this.dbReady;
    if (!this.db) return 0;

    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const countReq = store.count();
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => resolve(0);
    });
  }
}
