// storage.service.ts
import { Injectable } from '@angular/core';
import Dexie from 'dexie';

@Injectable({
  providedIn: 'root'
})
export class StorageService extends Dexie {
  collections: Dexie.Table<any, [string, any]>; // [collectionKey, primaryKey]
  offlineMutations: Dexie.Table<any, number>;

  constructor() {
    super('MyAppDB');
    this.version(1).stores({
      collections: '[collectionKey+primaryKey]', // Compound primary key
      offlineMutations: '++id'
    });
    this.collections = this.table('collections');
    this.offlineMutations = this.table('offlineMutations');
  }

  // Methods for handling collections
  async getCollectionData(collectionKey: string): Promise<any[]> {
    const items = await this.collections
      .where('collectionKey')
      .equals(collectionKey)
      .toArray();
    return items.map(entry => entry.item);
  }

  async saveCollectionData(collectionKey: string, data: any[]) {
    // Assume data is an array of items, each with a unique primaryKey (e.g., 'id')
    const items = data.map(item => ({
      collectionKey,
      primaryKey: item.id, // Adjust 'id' based on your data
      item
    }));
    await this.collections.bulkPut(items);
  }

  async getCollectionItem(collectionKey: string, primaryKey: any): Promise<any> {
    const entry = await this.collections
      .where('[collectionKey+primaryKey]')
      .equals([collectionKey, primaryKey.toString()])
      .first();

    return entry ? entry.item : null;
  }

  async clearCollection(collectionKey: string) {
    await this.collections
      .where('collectionKey')
      .equals(collectionKey)
      .delete();
  }

  async clearAllCollections() {
    await this.collections.clear();
  }

  // Methods for handling offline mutations
  async storeOfflineMutation(mutation: any) {
    await this.offlineMutations.add(mutation);
  }

  async getOfflineMutations(): Promise<any[]> {
    return this.offlineMutations.toArray();
  }

  async deleteOfflineMutation(id: number) {
    await this.offlineMutations.delete(id);
  }

  async deleteAllOfflineMutation() {
    await this.offlineMutations.clear();
  }

  // Method to apply changes to a collection or offlineMutation table
  async applyMutation(collectionKey: string, primaryKey: string, method: string, item: any) {

    if (method === 'DELETE') {
      // Delete item
      await this.collections
        .where('[collectionKey+primaryKey]')
        .equals([collectionKey, primaryKey])
        .delete();
    } else {
      // Add or Update existing item
      await this.collections.put({
        collectionKey,
        primaryKey,
        item
      });
    }
  }
}

