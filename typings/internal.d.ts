// Define types used by the web-walk internally

/**
 * Node require method
 */
declare const require: {
  (id: string): any;
}

/**
 * A stripped-down version of tough-cookie's CookieJar interface
 */
interface CookieJar {
  setCookieSync(cookies: string, url: string): void;
  getCookieStringSync(url: string): string;
}

/**
 * Response of node-fetch
 */
interface FetchResponseHeaders extends Headers {
  raw(): { [key: string]: string[] }
}

interface FetchResponse extends Response {
  headers: FetchResponseHeaders
}

