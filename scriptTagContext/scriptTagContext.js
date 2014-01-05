/**
 * (c) 2014 Rob Wu <gwnRob@gmail.com> (https://robwu.nl)
 * Released under the MIT license
 * https://github.com/Rob--W/chrome-api/scriptTagContext/
 *
 * Intercept appendChild and replaceChild calls in order to load scripts in
 * the current execution environment (content script) instead of the web page.
 *
 * This is useful when you're using third-party libraries which rely on <script>
 * tags for loading dependencies, or use web services with JSONP.
 *
 * Note: The extension has to declare permissions to access the external scripts.
 *
 * Note: The scripts will run in the context of the extension, so avoid loading
 * scripts from insecure sources or http-URLs.
 *
 * Note: This script is ONLY useful inside a content script.
 */
;(function() {
    /* globals Event, Node, setTimeout, window, XMLHttpRequest */
    'use strict';
    var orig_insertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function insertBefore(node, nextNode) {
        if (node && 'src' in node && /^script$/i.test(node.tagName) && !node.__isScriptIntercepted) {
            // Hook only once.
            node.__isScriptIntercepted = true;

            if (node.src || node.textContent) {
                if (node.getAttribute('context') !== 'page') {
                    // Script src is already set. Disable script, insert node, then load the script.
                    var contentType = node.type;
                    // Change content type to prevent script from being parsed
                    node.type = 'application/octet-stream';
                    var returnValue = orig_insertBefore.call(this, node, nextNode);
                    node.type = contentType;
                    loadScript(node);
                    return returnValue;
                }
            } else {
                // No src and no text content? The script source is not defined yet...
                // Intercept "src" setters.
                var orig_setAttribute = node.setAttribute;
                var isScriptSrcSet = false;
                node.setAttribute = function setAttribute(name, value) {
                    if (!isScriptSrcSet && /^src$/i.test(name) && value) {
                        isScriptSrcSet = true;
                        this.setAttribute = orig_setAttribute;

                        if (node.getAttribute('context') !== 'page') {
                            var contentType = node.type;
                            this.type = 'application/octet-stream';
                            var returnValue = this.setAttribute(name, value);
                            this.type = contentType;
                            loadScript(this);
                            return returnValue;
                        }
                    }
                    return orig_setAttribute.call(this, name, value);
                };
                Object.defineProperty(node, 'src', {
                    get: function() {
                        return this.getAttribute('src') || '';
                    },
                    set: function(src) {
                        this.setAttribute('src', src);
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        }
        return orig_insertBefore.call(this, node, nextNode);
    };
    Node.prototype.appendChild = function appendChild(node) {
        return this.insertBefore(node, null);
    };

    function loadScript(node) {
        // HTML5-compliant src checking (Chrome is a bit laxer, but let's be strict to be future-proof)
        if (!/^\s*(|application\/(x-)?(ecmascript|javascript|)|text\/(ecmascript|javascript(1\.[0-5])?|jscript|livescript|x-ecmascript|x-javascript))\s*$/.test(node.type)) {
            return;
        }
        var scriptSrc = node.src;
        if (!scriptSrc) {
            // No script set, assume that it's an inline script tag.
            try {
                /* jshint evil: true */
                window.eval(node.textContent);
            } catch (e) {
                // Asynchronously throw the error
                setTimeout(function() { throw e; });
            }
            return;
        }
        // scriptSrc is set, load script and run it.
        var x = new XMLHttpRequest();
        x.open('GET', scriptSrc);
        x.onload = function() {
            if (x.status === 200) {
                // Run script in the current global context.
                try {
                    /* jshint evil: true */
                    window.eval(x.responseText);
                } finally {
                    node.dispatchEvent(new Event('load'));
                }
            } else {
                node.dispatchEvent(new Event('error'));
            }
        };
        x.onerror = function() {
            node.dispatchEvent(new Event('error'));
        };
        x.send();
    }
})();
