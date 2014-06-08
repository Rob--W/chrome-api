# patch-worker.js

Because of http://crbug.com/357664, it is not possible to use `new Worker(chrome.runtime.getURL('worker.js'));` in content scripts.  
patch-worker.js modifies the Worker constructor in a transparent way, so that you *can* use this method to load workers in a content script.

**NOTE**: This patch has some limitations:

- importScripts does not work.
- Origin-specific features such as IndexedDB or the FileSystem API use the
  web page's origin instead of the extension's.
- Cross-origin XMLHttpRequest is not possible because the extension's
  permissions are not available.

If these limitations are significant, take a look at https://github.com/Rob--W/chrome-api/blob/master/worker_proxy,
which offers the same functionality without these limitations.

## Example

manifest.json:

```js
{
    ...
    "content_scripts": [{
        "matches": ["*://example.com/*"],
        "js": [
            "patch-worker.js",
            "your-contentscript.js"
        ]
    }],
    "web_accessible_resources": [
        "worker.js"
    ]
}
```

your-contentscript.js:

```js
var worker = new Worker(chrome.runtime.getURL('worker.js'));
worker.onmessage = function(event) {
    alert('Message from worker: ' + event.data);
};
```

worker.js:

```js
postMessage('Hello from worker!');
```

## License
(c) 2014 Rob Wu <rob@robwu.nl> (https://robwu.nl)  
License: MIT/X11
