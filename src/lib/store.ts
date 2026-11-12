import { useSyncExternalStore } from "react";
import { createSeed, DB_VERSION } from "./domain/seed";
import type { Db } from "./domain/types";

/**
 * Local data store (demo mode). Persists to localStorage so changes survive
 * reloads on the same device. Swap the internals for backend queries once the
 * real database tables are available — components only use useDb() + commit().
 */
const STORAGE_KEY = "masir-noor-db-v1";
const SERVER_SNAPSHOT: Db = createSeed();

let state: Db | null = null;
const listeners = new Set<() => void>();

function load(): Db {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Db;
      if (parsed?.version === DB_VERSION) return parsed;
    }
  } catch {
    /* corrupted storage – fall back to seed */
  }
  return createSeed();
}

function getSnapshot(): Db {
  if (!state) state = typeof window === "undefined" ? SERVER_SNAPSHOT : load();
  return state;
}

function persist(db: Db) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* storage full / private mode – keep in memory */
  }
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = load();
      emit();
    }
  };
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useDb(): Db {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}

export function readDb(): Db {
  return getSnapshot();
}

/** Apply a pure update. Throws (without changing state) if the update throws. */
export function commit(update: (db: Db) => Db): Db {
  const next = update(getSnapshot());
  state = next;
  persist(next);
  emit();
  return next;
}

export function resetDemoData() {
  state = createSeed();
  persist(state);
  emit();
}