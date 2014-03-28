# patch-worker.js

Because of http://crbug.com/357664, it is not possible to use `new Worker(chrome.runtime.getURL('worker.js'));` in content scripts.  
patch-worker.js modifies the Worker constructor in a transparent way, so that you *can* use this method to load workers in a content script.

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


