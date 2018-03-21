// Define types that will be used by web-walk consumers

/**
 * Exposed APIs
 */
declare module 'web-walk' {
  const walk: (config: WebWalkConfig) => Promise<any>;
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
interface WebWalkRequest extends RequestInit {
  url?: string;
  // Properties defined for convinence
  cookies?: StringPairs;
  formData?: StringPairs;
}

/**
 * Web walk step output
 */
interface WebWalkResponse {
  cookies: StringPairs;
  headers: StringPairs;
  text: string;
  output?: any;
}

/**
 * Web walk step configuration
 */
interface WebWalkStepConfig {
  url: string;
  request: WebWalkRequest;
  response?: WebWalkResponse;
  prepare?(lastStepResponse: WebWalkResponse, stepResponses: WebWalkResponse[]): Promise<WebWalkRequest>;
  process?(stepResponse: WebWalkResponse): Promise<any>;
}

/**
 * Web walk session configuration
 */
interface WebWalkConfig {
  headers?: StringPairs;
  cookies?: StringPairs;
  steps: WebWalkStepConfig[];
}