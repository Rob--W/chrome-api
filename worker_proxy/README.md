# Web Workers in content scripts

In a content script within a Chrome extension, Web Workers run in the page's
origin. This means that Web Worker packaged with your extension *cannot* be
used in a content script.
This limitation has been resolved before by patch-worker.js (available at
https://github.com/Rob--W/chrome-api/blob/master/patch-worker/). That patch
has some limitations though, mainly due to the fact that the Worker runs at
the page's origin:

- importScripts does not work.
- Origin-specific features such as IndexedDB or the FileSystem API use the
  web page's origin instead of the extension's.
- Cross-origin XMLHttpRequest is not possible because the extension's
  permissions are not available.

All of the previous issues are solved with this patch, because it runs
the Worker on the extension's origin. The patch has two constraints:

- It relies on the creation and availability of an `<iframe>`. If the page
  removes the `<iframe>`, then all existing Workers are terminated.
- Transferable messages must NOT be used until http://crbug.com/334408 is
  fixed.

This patch requires a background page or event page (used to negotiate an
authentication token to make sure that the frame only accept messages from
the content script). Further, `worker_proxy.html` must be declared in
`"web_accessible_resources"`.

## Example
The following example executes a content script on example.com. This
content script creates a Web Worker in the content script, performs
a cross-origin XMLHttpRequest (to example.net) and shows the result
in a dialog.

manifest.json

```js
{
    "name": "Example of Worker in content script",
    "version": "1",
    "manifest_version": 2,

    "background": {
        "persistent": false,
        "scripts": [ "worker_proxy.js" ]
    },
    "content_scripts": [{
        "matches": ["*://example.com/*"],
        "js": [
            "worker_proxy.js",
            "your-contentscript.js"
        ]
    }],
    "web_accessible_resources": [ "worker_proxy.html" ],
    "permissions": [ "*://example.net/*" ]
}
```

`worker_proxy.html` and `worker_proxy.js` can be found in this repository.

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
// Example: cross-origin XMLHttpRequest using permissions from the manifest file.
var x = new XMLHttpRequest();
x.open('GET', 'https://example.net/');
x.onload = function() {
    postMessage('Result\n' + x.responseText);
};
x.send();
```

## License

(c) 2014 Rob Wu <rob@robwu.nl> (https://robwu.nl)  
License: MIT/X11
