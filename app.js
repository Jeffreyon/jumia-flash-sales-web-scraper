let puppeteer = require("puppeteer-core");
let chromeLauncher = require("chrome-launcher");

require("isomorphic-fetch");

(async () => {
    let browser;
    try {
        console.log("Opening browser...");
        const chrome = await chromeLauncher.launch();

        const response = await fetch(
            `http://localhost:${chrome.port}/json/version`
        );

        const { webSocketDebuggerUrl } = await response.json();

        browser = await puppeteer.connect({
            browserWSEndpoint: webSocketDebuggerUrl,
        });

        const page = await browser.newPage();

        let baseUrl = "https://toxicwaps.com";

        await page.setRequestInterception(true);

        page.on("request", (req) => {
            if (
                req.resourceType() == "font" ||
                req.resourceType() == "image" ||
                req.resourceType() == "stylesheet"
            ) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto(`${baseUrl}/tv-series/2724C/suits/season-03.html`);

        let selector = "a.ui-btn.ui-btn-icon-right.ui-icon-carat-r";

        let link = await page.$eval(selector, (el) => el.getAttribute("href"));

        page.goto(`${baseUrl + link}`);

        selector = 'a[href^="/ddl.php"]';
        await page.waitForSelector(selector).then(async () => {
            link = await page.$eval(selector, (el) => el.getAttribute("href"));

            page.goto(`${baseUrl + link}`);

            selector = 'input[name="download"]';
            await page.waitForSelector(selector).then(async () => {
                page.click(selector);
            });
        });
    } catch (err) {
        console.log(err);
    }
})();
