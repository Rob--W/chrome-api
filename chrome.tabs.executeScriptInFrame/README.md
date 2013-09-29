# chrome.tabs.executeScriptInFrame

Adds the `chrome.tabs.executeScriptInFrame` method to the
[`chrome.tabs` API](https://developer.chrome.com/extensions/tabs.html).
This method allows one to run a content script in the context of a frame,
instead of all frames within a tab, via the frameId parameter.

The method follows the same syntax as[`chrome.tabs.executeScript`]
(https://developer.chrome.com/extensions/tabs.html#method-executeScript),
except that the first argument (specified by the [`InjectDetails` type]
(https://developer.chrome.com/extensions/tabs.html#type-InjectDetails))
is extended with the `frameId` property. Since `frameId` makes no sense
without a tabId, the `tabId` parameter is required.

## Example
This repository contains a stand-alone example, which shows how to generally use the API.

The following code example is different, it shows how to get the cookie of a specific frame:

```javascript
function alertCookie(tabId, frameId) {
    chrome.tabs.executeScriptInFrame(tabId, {
        frameId: frameId,
        code: '// This code runs in one frame, specified via frameId \n' +
              'alert(location.href);' +
              'document.cookie;'
    }, function(results) {
        if (!results) {
            alert('Failed to execute code. See background page for details.');
            return;
        }
        var cookie = results[0];
        alert('Found cookie: ' + cookie);
    });
}
```

To use the method, you need a `tabId` and `frameId`. The `tabId` is provided by many Chrome APIs,
including but not limited to
[`chrome.contextMenus`](https://developer.chrome.com/extensions/contextMenus.html),
[`chrome.tabs`](https://developer.chrome.com/extensions/tabs.html),
[`chrome.runtime`](https://developer.chrome.com/extensions/runtime.html),
[`chrome.browserAction`](https://developer.chrome.com/extensions/browserAction.html), ....

The `frameId` is only provided by two APIs:

- [`chrome.webNavigation`](https://developer.chrome.com/extensions/webNavigation.html)
- [`chrome.webRequest`](https://developer.chrome.com/extensions/webRequest.html)

`chrome.tabs.executeScriptInFrame` requires a `frameId` parameter. If you don't have a
frameId, but you do have the URL of the frame, then you can use the webNavigation API
to get a frame ID, as follows:

```javascript
    // TODO: define tabId
    // TODO: define url
    chrome.webNavigation.getAllFrames({
        tabId: tabId
    },function(details) {
        if (!details) {
            // Invalid tabId
            // TODO: Handle invalid tab ID
            return;
        }
        details = details.filter(function(detail) { return detail.url === url; });
        if (details.length === 0) {
            // TODO: No frame found for given URL?
        } else if (details.length === 1) {
            var frameId = details[0].frameId;
            // TODO: Do something with frameId;
        } else {
            // More than one frame found...
            // TODO: Do something. For example, take the first frame that matches the frame ID.
        }
    });
```

## Requirements
The following permissions are required, and needs to be declared in your
[manifest](https://developer.chrome.com/extensions/manifest.html) file:

```json
    ...
    "permissions": [
        "webRequest",
        "webRequestBlocking"
    ],
    "web_accessible_resources": [
        "getFrameId"
    ],
    ...
```

**Plus host permissions** for the sites where you want to be able to insert
content scripts. In practice, given the nature of the extensions that need to message specific frames,
you will need the `*://*/*` permission.

In addition, you usually need the `webNavigation` permission as well, in order to use
 [`chrome.webNavigation.getAllFrames`]
 (https://developer.chrome.com/extensions/webNavigation.html#method-getAllFrames).

`"getFrameId"` needs to be whitelisted, because this **non-existent** URL is used to detect the frameId.
This URL is **never** accessed, because the request to this URL is immediately
aborted, and redirected to a data-URL.

**This API cannot be used with [event pages](https://developer.chrome.com/extensions/event_pages.html),
because the `webRequest` API cannot be used with event pages.**

Do not forget to copy this file to your extension's directory, and load the script. For example using:

```json
    ...
    "background": {
        "scripts": [
            "chrome.tabs.executeScriptInFrame.js",
            "background.js"
        ],
        "persistent": true
    },
    ...
```

## Limitations
All limitations of the `chrome.tabs.executeScript` method apply: You cannot execute
the content script without sufficient [host permissions]
(https://developer.chrome.com/extensions/content_scripts.html#registration).

You cannot execute a content script in a frame if you don't have host permissions
for the top frame.

As said before, this API does not work on an event page. Use a background page instead.

## How does it work?
You can take a look at the source code of `chrome.tabs.executeScriptInFrame.js` to see how it works.
In short:

1. If `frameId` is `0`, then `chrome.tabs.executeScript` is used directly, because it's possible
   to restrict the content script to the top-level frame using `allFrames:false`.
2. If the content script is specified by file name, then the contents of the file is fetched.
3. A content script, composed of the following items is executed in all frames:
   - Frame ID
   - Serialized code
   - Dummy URL

4. **This is the magic to get the frame ID within a content script**.  
   An `<img>` object is created, and its `src` is set to the dummy URL.
5. The dummy URL is intercepted by the `webRequest` API in the background page, and redirected
   to a GIF image whose width is equal to `frame ID + 1` (the frame ID is provided by the webRequest event).
6. The `onload` event of the image is triggered. In this event, the `frameId` is read from the `naturalWidth`
   property and cached for future calls.
7. Step 4-7 is repeated recursively for each frame whose protocol is not http, https or file. This is done
   to catch `about:blank` and `javascript:` frames.
8. One of the scripts in the previous steps will find a matching frameId. When the frame ID matches, the code
   is executed, and the result is sent back to the background script using the message passing API.
9. The callback of `executeScriptInFrame` is called once step 8 has run, or when too much time has passed.

## See also
- [Issue 63979 on Chromium's bug tracker](https://code.google.com/p/chromium/issues/detail?id=63979)
  "Should be able to use insertCSS and executeScript for a specific frame"
- [Issue 264286 on Chromium's bug tracker](https://code.google.com/p/chromium/issues/detail?id=264286)
  "Chrome extensions: Ability to message a specific frame"

## License
(c) 2013 Rob Wu <gwnRob@gmail.com> (https://robwu.nl)  
Published under the MIT/X11 license.
