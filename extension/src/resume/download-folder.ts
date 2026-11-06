// The folder the user picked for generated PDFs. Null means Chrome's default download folder.
//
// Kept in IndexedDB because a folder handle can't be stored in chrome.storage, which only takes JSON.

const DB_NAME = 'resume-tailor';
const STORE_NAME = 'settings';
const FOLDER_KEY = 'downloadFolder';

// ----------------------------------------------------------------------

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runInStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();

  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function getDownloadFolder(): Promise<FileSystemDirectoryHandle | null> {
  return (await runInStore('readonly', (store) => store.get(FOLDER_KEY))) ?? null;
}

export async function setDownloadFolder(folder: FileSystemDirectoryHandle | null) {
  if (folder) {
    await runInStore('readwrite', (store) => store.put(folder, FOLDER_KEY));
  } else {
    await runInStore('readwrite', (store) => store.delete(FOLDER_KEY));
  }
}

// ----------------------------------------------------------------------

/**
 * Chrome forgets the permission when the browser closes, unless the user chose to keep it, and only
 * asks again during a click. So call this first thing in the click, before any slow work.
 */
export async function ensureFolderPermission(folder: FileSystemDirectoryHandle) {
  const descriptor = { mode: 'readwrite' } as const;

  return (
    (await folder.queryPermission(descriptor)) === 'granted' ||
    (await folder.requestPermission(descriptor)) === 'granted'
  );
}

/** "Name.pdf", or "Name (1).pdf" if taken: resumes for different jobs mustn't overwrite each other. */
async function findFreeFileName(folder: FileSystemDirectoryHandle, fileName: string) {
  const stem = fileName.replace(/\.pdf$/, '');

  for (let copy = 0; ; copy += 1) {
    const candidate = copy ? `${stem} (${copy}).pdf` : fileName;

    try {
      await folder.getFileHandle(candidate);
    } catch (error) {
      if ((error as DOMException).name === 'NotFoundError') return candidate;

      throw error;
    }
  }
}

/**
 * Makes text from the resume JSON usable as a file or folder name on any OS. Both ways of saving
 * reject a bad name instead of fixing it. Empty if nothing usable is left.
 */
export function toSafeFileName(text: string) {
  const safe = text
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .slice(0, 100)
    .replace(/^[\s.]+|[\s.]+$/g, '');

  // Names Windows keeps for itself, whatever their case.
  return /^(con|prn|aux|nul|com\d|lpt\d)$/i.test(safe) ? `${safe}_` : safe;
}

/** Returns the file's path inside `folder`. `subfolder` may be empty, to save in `folder` itself. */
export async function saveToFolder(
  folder: FileSystemDirectoryHandle,
  subfolder: string,
  blob: Blob,
  fileName: string
) {
  const target = subfolder ? await folder.getDirectoryHandle(subfolder, { create: true }) : folder;

  const name = await findFreeFileName(target, fileName);

  const file = await target.getFileHandle(name, { create: true });
  const writable = await file.createWritable();

  await writable.write(blob);
  await writable.close();

  return subfolder ? `${subfolder}/${name}` : name;
}
