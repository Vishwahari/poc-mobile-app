// ============================================
// IndexedDB Local Database
// Stores all data on the device — no server needed
// ============================================

const DB_NAME = 'ProjectDashboardDB';
const DB_VERSION = 1;

// Open (or create) the database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create 'users' store
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', {
          keyPath: 'id',
          autoIncrement: true,
        });
        userStore.createIndex('username', 'username', { unique: true });
      }

      // Create 'items' store
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper: wrap an IDBRequest into a Promise
function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---- Initialization ----

export async function initDatabase() {
  const db = await openDB();

  // Seed the default admin user on first launch
  const tx = db.transaction('users', 'readwrite');
  const store = tx.objectStore('users');
  const index = store.index('username');

  const existing = await promisify(index.get('admin'));

  if (!existing) {
    store.add({ username: 'admin', password: 'password123' });
  }

  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });

  db.close();
}

// ---- Auth ----

export async function loginUser(username, password) {
  const db = await openDB();
  const tx = db.transaction('users', 'readonly');
  const store = tx.objectStore('users');
  const index = store.index('username');

  const user = await promisify(index.get(username));
  db.close();

  if (!user || user.password !== password) {
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
