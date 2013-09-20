/* globals chrome, console, alert */
'use strict';
chrome.contextMenus.removeAll(function() {
    chrome.contextMenus.create({
        contexts: ['all'],
        title: 'alert(location.href)'
    });
});
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    var url = info.frameUrl || info.pageUrl;
    chrome.webNavigation.getAllFrames({
        tabId: tab.id
    }, function(details) {
        if (!details) {
            console.error('webNavigation.getAllFrames: No result.');
            return;
        }
        details = details.filter(function(detail) { return detail.url === url; });
        if (details.length === 0) {
            console.error('Did not find any frame with URL ' + url);
            return;
        }
        if (details.length > 1) {
            console.warn('Found more than one frame with URL ' + url);
        }
        var frameId = details[0].frameId;
        chrome.tabs.executeScriptInFrame({
            frameId: frameId,
            tabId: tab.id,
            code: 'document.body.style.backgroundColor="red";' +
                  'alert(location.href);' +
                  'document.body.style.backgroundColor = "";' +
                  '"some return value";'
        }, function(results) {
            if (!results) {
                console.info('executeScriptInFrame: Failed to execute code.');
                alert('Failed to execute code. See background page for details.');
                return;
            }
            if (results[0] !== 'some return value') {
                console.error('Unexpected return value from executeScriptInFrame. ' +
                              'Expected "some return value", got "' + results[0] + '"');
            }
        });
    });
});
