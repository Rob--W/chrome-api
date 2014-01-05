# scriptTagContext.js

With `scriptTagContext.js`, you do not have to worry about the two different execution environments
in content scripts, because this script changes the execution environment of dynamically generated
`<script>` tags to the content script. If you want to force a script to run in the context of the
web page, use `scriptTag.setAttribute('context', 'page')`.

With `scriptTagContext.js`, you can easily write Chrome extensions that use:

- JSONP.
- Asynchronous JavaScript module loaders that use `<script>` tags to load dependencies (e.g. RequireJS).

Without `scriptTagContext.js`, scripts that use either of the previous methods will not work, because
they run in the context of the page, while they're expected to run in the context of the content script.

## Permission requirements

The source of external scripts are loaded using `XMLHttpRequest`, so you need to declare the script URL or host at the "permissions" section of the manifest file.
If the external script is packaged with the extension (i.e. the URL starts with `chrome-extension://...`), then you need to declare this script in the
[`"web_accessible_resources"`](https://developer.chrome.com/extensions/manifest/web_accessible_resources.html) section of the manifest file.

Obviously, **only load external scripts from trusted sources!** If you run an untrusted script in the
context of your content script, your extension's permissions can be abused. If possible, bundle the
external JavaScript files with your extension.

## Example
This repository contains a short example that demonstrates the value of `scriptTagContext.js`.
The demo extension runs on all websites, and shows a dialog box if the code completed successfully.

* See `manifest.json` to learn more about the required `"permissions"` and `"web_accessible_resources"`.
* See `demo-files/contentscript.js` to see a simple script that uses [RequireJS](http://requirejs.org)
  for JavaScript module management, and JSONP for getting data from the Github API.  
  The script also demonstrates the use of the "context" attribute on the `<script>` tag.

## License
(c) 2014 Rob Wu <gwnRob@gmail.com> (https://robwu.nl)  
Released under the [MIT license](http://opensource.org/licenses/MIT)
