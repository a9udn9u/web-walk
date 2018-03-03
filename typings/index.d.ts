/**
 * Declare node require method
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

/**
 * Represents header/cookie/formData
 */
interface StringPairs {
  [key: string]: string
}

/**
 * Web walk step input
 */
interface StepRequest extends RequestInit {
  // Properties defined for convinence
  cookies?: StringPairs;
  formData?: StringPairs;
}

/**
 * Web walk step output
 */
interface StepResponse {
  cookies: StringPairs;
  headers: StringPairs;
  text: string;
  output?: any;
}

/**
 * Web walk step configuration
 */
interface StepConfig {
  url: string;
  request: StepRequest;
  response?: StepResponse;
  prepare?(lastStepResponse: StepResponse, stepResponses: StepResponse[]): Promise<StepRequest>;
  process?(stepResponse: StepResponse): Promise<any>;
}

/**
 * Web walk session configuration
 */
interface WebWalkConfig {
  headers?: StringPairs;
  cookies?: StringPairs;
  steps: StepConfig[];
}