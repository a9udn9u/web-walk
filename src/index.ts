import fetch from 'node-fetch';
import * as tough from 'tough-cookie';

const requestInit: RequestInit = {
  cache: 'no-store',
  // Currently node-fetch doesn't support this, it's a problem when page is redirected but cookies set by the page
  // are required. A workaround is setting redirect to 'manual' so that web-walk can catch cookies.
  credentials: 'include',
  mode: 'cors',
  redirect: 'follow',
  headers: {
    'accept': '*/*',
    'accept-encoding': 'gzip,deflate,br',
    'connection': 'close',
    'user-agent': `web-walk/${require('../package.json').version}`,
  }
}

const getCookieHeader = (siteCookies: string, mandatoryCookies: StringPairs): string => {
  let override = Object.keys(mandatoryCookies)
      .map(key => new tough.Cookie({ key, value: mandatoryCookies[key] }).cookieString())
      .join(';');
  return [siteCookies, override].filter(v => !!v).join(';');
}

const getFormData = (formDataPairs: StringPairs): string => {
  const keys = Object.keys(formDataPairs);
  if (!keys.length) return;
  return keys
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(formDataPairs[key]))
      .join('&');
}

const injectCookieHeader = (headers: StringPairs, cookieHeader: string): StringPairs => {
  let mergedCookieHeader = [headers['cookie'], cookieHeader]
      .filter(v => !!v)
      .map(v => v.trim())
      .join(';');
  if (!!mergedCookieHeader) {
    headers = Object.assign({}, headers, { 'cookie': mergedCookieHeader });
  }
  return headers;
}

const transformHeaders = (headers: Headers): StringPairs => {
  let pairs: StringPairs = {};
  headers.forEach((value, key) => {
    let lower = key.toLowerCase();
    if ('set-cookie' !== lower) {
      pairs[lower] = value;
    }
  });
  return pairs;
}

const extractCookies = (setCookies: string[]): StringPairs => {
  let pairs: StringPairs = {};
  if (setCookies && setCookies.length) {
    setCookies.forEach(line => {
      let parsed = tough.parse(line);
      Object.assign(pairs, { [parsed.key]: parsed.value });
    });
  }
  return pairs;
}

const mergeHeaders = (...headersArgs: any[]): StringPairs => {
  let flattened = Object.assign.apply(Object, [{}].concat(headersArgs));
  let merged: StringPairs = {};
  Object.keys(flattened).forEach(key => merged[key.toLowerCase()] = flattened[key]);
  return merged;
}

const prepare = async (step: StepConfig, stepResponses: StepResponse[]): Promise<StepRequest> => {
  const lastStepResponse = stepResponses.length ? stepResponses[stepResponses.length - 1] : undefined;
  return step.prepare ? step.prepare(lastStepResponse, stepResponses) : {};
}

const process = async (step: StepConfig, stepResponse: StepResponse): Promise<any> => {
  return step.process ? step.process(stepResponse) : stepResponse.text;
}

/**
 * Generate request
 * @param config
 * @param step
 * @param responses
 */
const getRequest = (config: WebWalkConfig, step: StepConfig, prepared: StepRequest, siteCookies: string): StepRequest => {
  if (!step.request) {
    step.request = {};
  }

  let headers = mergeHeaders(requestInit.headers, config.headers, step.request.headers, prepared.headers);
  let cookies = getCookieHeader(siteCookies, Object.assign({}, config.cookies, step.request.cookies, prepared.cookies));
  let formData = getFormData(Object.assign({}, step.request.formData, prepared.formData));

  let request = Object.assign({}, requestInit, step.request, prepared);
  request.headers = injectCookieHeader(headers, cookies);

  if (!request.body && formData) {
    request.body = formData;
    if (!request.headers['content-type']) {
      request.headers['content-type'] = 'application/x-www-form-urlencoded'
    }
  }

  if (!request.method && request.body) {
    request.method = 'POST';
  }

  delete request.cookies;
  delete request.formData;

  return request;
}

export const walk = async (config: WebWalkConfig): Promise<any> => {
  if (!config || !config.steps) return;

  let stepResponses: StepResponse[] = [];
  let stepResponse: StepResponse;
  let cookieJar: CookieJar = new tough.CookieJar();

  for (let i = 0; i < config.steps.length; ++i) {
    const step = config.steps[i];
    const prepared = await prepare(step, stepResponses);
    const siteCookies = cookieJar.getCookieStringSync(step.url);
    const request = getRequest(config, step, prepared, siteCookies);
    const response: FetchResponse = await fetch(step.url, request);
    const setCookieHeader = response.headers.raw()['set-cookie'] || [];
    stepResponse = {
      headers: transformHeaders(response.headers),
      cookies: extractCookies(setCookieHeader),
      text: await response.text()
    }
    stepResponse.output = await process(step, stepResponse);
    stepResponses.push(stepResponse);
    setCookieHeader.forEach(line => cookieJar.setCookieSync(line, response.url));
  }
  return stepResponse.output;
}
