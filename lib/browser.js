const chromeLauncher = require("chrome-launcher");
require("isomorphic-fetch");

async function init(options = {}) {
    try {
        console.log("Opening browser...");

        const chrome = await chromeLauncher.launch(options);
        const response = await fetch(
            `http://localhost:${chrome.port}/json/version`
        );
        const { webSocketDebuggerUrl } = await response.json();

        return webSocketDebuggerUrl;
    } catch (err) {
        console.log("Browser Error:", err);
    }
}

module.exports = init;
