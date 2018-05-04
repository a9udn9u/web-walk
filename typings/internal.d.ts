// Define types used by the web-walk internally

/**
 * Node require method
 */
declare const require: {
  (id: string): any;
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

