export class HisenseApiError extends Error {
  response: unknown;
  constructor(endpoint: string, response: unknown) {
    super(`HisenseServerError: ${endpoint}`);
    this.response = response;
  }
}
