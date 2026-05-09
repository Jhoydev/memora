export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const APP_ERROR_CODES = {
  FLASHCARD_NOT_FOUND: "FLASHCARD_NOT_FOUND",
  STORAGE_READ_ERROR: "STORAGE_READ_ERROR",
  STORAGE_WRITE_ERROR: "STORAGE_WRITE_ERROR",
  TOPIC_NOT_FOUND: "TOPIC_NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];
