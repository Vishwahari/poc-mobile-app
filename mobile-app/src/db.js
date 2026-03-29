// ============================================
// IndexedDB Local Database
// Seeds initial data from Python-generated JSON
// Stores all data on the device — no server needed
// ============================================

import seedData from './seed-data.json';

const DB_NAME = 'TaskFlowDB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', {
          keyPath: 'id',
          autoIncrement: true,
        });
        userStore.createIndex('username', 'username', { unique: true });
      }

      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---- Initialization (uses Python-generated seed data) ----

export async function initDatabase() {
  const db = await openDB();

  // Seed users from Python-generated data
  const userTx = db.transaction('users', 'readwrite');
  const userStore = userTx.objectStore('users');
  const userIndex = userStore.index('username');

  for (const user of seedData.users) {
    const existing = await promisify(userIndex.get(user.username));
    if (!existing) {
      userStore.add(user);
    }
  }

  await new Promise((resolve, reject) => {
    userTx.oncomplete = resolve;
    userTx.onerror = reject;
  });

  // Seed config from Python
  const configTx = db.transaction('config', 'readwrite');
  const configStore = configTx.objectStore('config');
  configStore.put({ key: 'app_config', ...seedData.config });

  await new Promise((resolve, reject) => {
    configTx.oncomplete = resolve;
    configTx.onerror = reject;
  });

  // Seed sample items (only on first launch)
  const itemTx = db.transaction('items', 'readwrite');
  const itemStore = itemTx.objectStore('items');
  const existingItems = await promisify(itemStore.getAll());

  if (existingItems.length === 0) {
    for (const item of seedData.items) {
      itemStore.add(item);
    }
  }

  await new Promise((resolve, reject) => {
    itemTx.oncomplete = resolve;
    itemTx.onerror = reject;
  });

  db.close();
}

// ---- Auth (uses Python-hashed passwords) ----

export async function loginUser(username, password) {
  const db = await openDB();
  const tx = db.transaction('users', 'readonly');
  const store = tx.objectStore('users');
  const index = store.index('username');

  const user = await promisify(index.get(username));
  db.close();

  if (!user) {
    throw new Error('Invalid username or password');
  }

  // Hash the entered password and compare with Python-generated hash
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (user.password !== hashHex) {
    throw new Error('Invalid username or password');
  }

  return { username: user.username };
}

// ---- Items CRUD ----

export async function getItems() {
  const db = await openDB();
  const tx = db.transaction('items', 'readonly');
  const store = tx.objectStore('items');
  const items = await promisify(store.getAll());
  db.close();
  return items;
}

export async function createItem(item) {
  const db = await openDB();
  const tx = db.transaction('items', 'readwrite');
  const store = tx.objectStore('items');
  const id = await promisify(store.add(item));
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
  db.close();
  return { ...item, id };
}

export async function updateItem(id, item) {
  const db = await openDB();
  const tx = db.transaction('items', 'readwrite');
  const store = tx.objectStore('items');
  await promisify(store.put({ ...item, id }));
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
  db.close();
  return { ...item, id };
}

export async function deleteItem(id) {
  const db = await openDB();
  const tx = db.transaction('items', 'readwrite');
  const store = tx.objectStore('items');
  await promisify(store.delete(id));
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
  db.close();
}

// ---- Config (Python-generated) ----

export async function getAppConfig() {
  const db = await openDB();
  const tx = db.transaction('config', 'readonly');
  const store = tx.objectStore('config');
  const config = await promisify(store.get('app_config'));
  db.close();
  return config;
}
