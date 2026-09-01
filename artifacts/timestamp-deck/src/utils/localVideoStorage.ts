const DATABASE_NAME = "timestamp-deck-media";
const STORE_NAME = "videos";
const DATABASE_VERSION = 1;

type StoredVideo = {
  id: string;
  blob: Blob;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("Local video storage is not available in this browser."));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Could not open local video storage."));
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveLocalVideo(file: File): Promise<string> {
  const id = `local-${crypto.randomUUID()}`;
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ id, blob: file } satisfies StoredVideo);
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save the local video."));
    transaction.oncomplete = () => resolve();
  });

  database.close();
  return id;
}

export async function getLocalVideoUrl(id: string): Promise<string> {
  const database = await openDatabase();
  const storedVideo = await new Promise<StoredVideo | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
    request.onerror = () => reject(request.error ?? new Error("Could not read the local video."));
    request.onsuccess = () => resolve(request.result as StoredVideo | undefined);
  });
  database.close();

  if (!storedVideo?.blob) {
    throw new Error("This local video is no longer available on this device.");
  }

  return URL.createObjectURL(storedVideo.blob);
}