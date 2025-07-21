export interface ServerResA<T extends object> {
  data?: T & {
    resultCode?: number;
  };
  signatureServer?: string;
}

export interface ServerResB<T extends object> {
  response?: T & {
    resultCode?: number;
  };
  signatureServer?: string;
}
