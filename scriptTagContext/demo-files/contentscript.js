/**
 * Demonstrates that JSONP and RequireJS work out of the box when scriptTagContext.js
 * is used.
 *
 * Load this demo extension, and visit any website. An alert should popup, showing the
 * response to a JSONP request.
 *
 * To see what happens when scriptTagContext.js is NOT loaded, edit the manifest file
 * and remove "scriptTagContext.js",
 *
 */
require.config({
    baseUrl: chrome.extension.getURL('/demo-files/')
});
require(['jquery'], function($) {
    $.getJSON('https://api.github.com/users/Rob--W?callback=?', function(apiResponse) {
        alert('If you see this message, the request succeeded!\n' +
              'According to Github, @Rob--W\'s website is: ' +
              (apiResponse && apiResponse.data && apiResponse.data.blog));
    });
});


// Example: Run in the context of the page
var s = document.createElement('script');
var variableInContentScript = true;
s.textContent = 'alert("Should run in page, and be \'undefined\': " + typeof variableInContentScript);';
s.setAttribute('context', 'page');
(document.head||document.documentElement).appendChild(s);

// Example: Run in the context of the content script
var t = document.createElement('script');
t.textContent = 'alert("Should run in content script, and be \'boolean\': " + typeof variableInContentScript);';
(document.head||document.documentElement).appendChild(t);
