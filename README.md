# Web Walk
A simple, easy to use web crawler.

### How It Works
Web Walk exports only one function: `walk()`, it takes a configuration object which contains a list of HTTP request descriptions, walks through each of the request, carries over cookies it collects along the way, and eventually returns the results (wrapped in a Promise) from the last request.

It's like creating a virtual browse session, but not in a browser window.

### Install

```bash
npm i web-walk
# or
yarn add web-walk
```

### Usage

###### Simply download a web page.

```javascript
const walk = require('web-walk').walk;

walk({
  steps: [
    { url: 'https://example.com' }
  ]
})
.then(function(html) {
  console.log(html);
};
```

###### Login before load a page.

```javascript
const walk = require('web-walk').walk;

walk({
  steps: [
    // Login by send form data
    {
      url: 'https://example.com',
      request: {
        formData: {
          username: 'admin',
          password: '123'
        }
      }
    },
    {
      url: 'https://example.com/secrets',
    }
  ]
})
.then(function(html) {
  console.log(html);
};
```

###### A slightly more complex, more realistic login session

Configuration is long, but mostly comments.

```javascript
const walk = require('web-walk').walk;

walk({
  steps: [
    // Get some random token the site requires for login
    {
      url: 'https://example.com',
      // The process() callback method will be called when response is received
      // Argument is the request response in the following format:
      // response.text - response in text form
      // response.headers - response headers
      // response.cookies - cookies in the Set-Cookie header
      process: function(response) {
        let token = someResponseParser(response);
        // You can return arbitrary data here. Your code will handle it in
        // following steps
        return { token };
      }
    },
    {
      url: 'https://example.com/login',
      // The prepare() callback method will be called before request is sent
      prepare: function(outputOfLastStep, outputOfAllPreviousSteps) {
        // prepare() can return a fetch Request-like object, see:
        // https://developer.mozilla.org/en-US/docs/Web/API/Request
        // In addition, it can return a cookie map and a formData map
        // Return value of the prepare() method will dictate following requests
        const token = outputOfLastStep.output.token;
        return {
          mode: !token ? 'GET' : 'POST',
          headers: {
            'referer': 'https://example.com/token=' + token
          },
          formData: { token }
        }
      },
      request: {
        cookies: {
          'some-cookie-name': 'some-static-value'
        },
        formData: {
          username: 'admin',
          password: '123'
        }
      }
      // Static configs in request will be merged with dynamic configs generated
      // by the prepare() method so final request will look like:
      // {
      //   mode: ...
      //   headers: { 'referer': 'https://example.com/token=...' },
      //   cookies: { 'some-cookie-name': 'some-static-value' },
      //   formData: { 'token': ..., username: 'admin', password: '123' }
      // }
    },
    {
      url: 'https://example.com/secrets',
      process: function(outputOfLastStep, outputOfAllPreviousSteps) {
        return JSON.parse(outputOfLastStep.text).someValue;
      }
    }
  ]
})
.then(function(results) {
  // If the last step has a process() method, walk() will return whatever the
  // process() method returns. Otherwise, it will return the response text from
  // the last step.
  console.log(results);
};
```

#### Advanced Usages

###### Upload file

Web walk uses [node-fetch](https://github.com/bitinn/node-fetch) in the background so you can pass whatever data it supports. The easiest way might be using [form-data](https://github.com/form-data/form-data).

```javascript
const walk = require('web-walk').walk;
const FormData = require('form-data');
const fs = require('fs');

let formData = new FormData();
formData.append('file', fs.createReadStream('/path/to/some/file.data'));

walk({
  steps: [
    {
      url: 'https://example.com',
      request: {
        body: formData
      }
    }
  ]
})
.then(function(html) {
  console.log(html);
};

```

#### API

There is only one exposed API: the `walk()` method. It's argument should be in the following format.

```javascript
{
  // Top level cookies and headers are applied in all requests
  cookies: { /* Key value pairs */ },
  headers: { /* Key value pairs */ },
  steps: [
    {
      url: ... // required
      request: {
        // A Request-like object that describes a request.
        // See: https://developer.mozilla.org/en-US/docs/Web/API/Request
        // In addition to properties in the Request interface, cookies and
        // formData can be set separately for conveniences.
        cookies: { /* Key value pairs */ },
        formData: { /* Key value pairs */ },
        // formData will be naively serialized and sent as
        // application/x-www-form-urlencoded type.
        // The request.body property should be used for sending more advanced
        // data types.
      },
      // Also returns a Request-like object, this method should be used to
      // generate request data from previous steps' respones.
      prepare: function(outputOfLastStep, outputOfAllPreviousSteps) {
        // outputOfLastStep.text - response in text form
        // outputOfLastStep.headers - response headers
        // outputOfLastStep.cookies - cookies in the Set-Cookie header
        // outputOfLastStep.output - output of the last step's process() method,
        //                           if last step doesn't have process(), this
        //                           will be the same as outputOfLastStep.text
        ...
      },
      // Post-processing on response
      process: function(response) {
        // response.text - response in text form
        // response.headers - response headers
        // response.cookies - cookies in the Set-Cookie header
        ...
      }
    },
    ...
  ]
}
```
Return value of the `prepare()` method will override values in the `request` object, which will override top level request properties (`cookies` and `headers`).

## License
MIT
