import { AppError, APP_ERROR_CODES } from "@/lib/errors/app-error";

export class LocalStorageClient {
  getItem<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") {
      return fallback;
    }

    try {
      const value = window.localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : fallback;
    } catch {
      throw new AppError(
        `No se pudo leer la clave "${key}" desde localStorage.`,
        APP_ERROR_CODES.STORAGE_READ_ERROR,
      );
    }
  }

  setItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      throw new AppError(
        `No se pudo guardar la clave "${key}" en localStorage.`,
        APP_ERROR_CODES.STORAGE_WRITE_ERROR,
      );
    }
  }

  removeItem(key: string): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.removeItem(key);
    } catch {
      throw new AppError(
        `No se pudo eliminar la clave "${key}" de localStorage.`,
        APP_ERROR_CODES.STORAGE_WRITE_ERROR,
      );
    }
  }
}
