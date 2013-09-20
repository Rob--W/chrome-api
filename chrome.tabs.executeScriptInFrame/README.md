# chrome.tabs.executeScriptInFrame

Adds the `chrome.tabs.executeScriptInFrame` method to the
[`chrome.tabs` API](https://developer.chrome.com/extensions/tabs.html).
This method allows one to run a content script in the context of a frame,
instead of all frames within a tab, via the frameId parameter.

The method follows the same syntax as[`chrome.tabs.executeScript`]
(https://developer.chrome.com/extensions/tabs.html#method-executeScript),
except that the first argument (specified by the [`InjectDetails` type]
(https://developer.chrome.com/extensions/tabs.html#type-InjectDetails))
is extended with the `frameId` property.

## Example
This repository contains a stand-alone example, which shows how to generally use the API.

The following code example is different, it shows how to get the cookie of a specific frame:

```javascript
function alertCookie(tabId, frameId) {
    chrome.tabs.executeScriptInFrame({
        frameId: frameId,
        tabId: tab.id,
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
        "webRequestBlocking",
        "*://robwu.nl/204*"
    ],
    ...
```

**Plus host permissions** for the sites where you want to be able to insert
content scripts. In practice, given the nature of the extensions that need to message specific frames,
you will need the `*://*/*` permission.

In addition, you usually need the `webNavigation` permission as well, in order to use
 [`chrome.webNavigation.getAllFrames`]
 (https://developer.chrome.com/extensions/webNavigation.html#method-getAllFrames).

`*://robwu.nl/204` is a location used for the determination of the frame ID.
This URL is **never** accessed, because the request to this URL is immediately
aborted, and redirected to a data-URL.

**This API cannot be used with [event pages](https://developer.chrome.com/extensions/event_pages.html),
because the `webRequest` API cannot be used with event pages.**

## Limitations
All limitations of the `chrome.tabs.executeScript` method apply: You cannot execute
the content script without sufficient [host permissions]
(https://developer.chrome.com/extensions/content_scripts.html#registration).

You cannot execute a content script in a frame if you don't have host permissions
for the top frame.

As said before, this API does not work on an event page. Use a background page instead.

## See also
- [Issue 63979 on Chromium's bug tracker](https://code.google.com/p/chromium/issues/detail?id=63979)
  "Should be able to use insertCSS and executeScript for a specific frame"

## License
(c) 2013 Rob Wu <gwnRob@gmail.com> (https://robwu.nl)  
Published under the MIT/X11 license.
