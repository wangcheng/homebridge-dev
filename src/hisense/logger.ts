/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Logger {
  debug: (message: string, ...parameters: any[]) => void;
  error: (message: string, ...parameters: any[]) => void;
  info: (message: string, ...parameters: any[]) => void;
  success: (message: string, ...parameters: any[]) => void;
  warn: (message: string, ...parameters: any[]) => void;
}

export const defaultLogger: Logger = {
  debug: console.debug,
  error: console.error,
  info: console.info,
  success: console.log,
  warn: console.warn,
} as const;
