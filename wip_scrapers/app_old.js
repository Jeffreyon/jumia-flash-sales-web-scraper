let puppeteer = require("puppeteer-core");
let browserConnectionUrl = require("./lib/browser.js")({
    chromeFlags: ["--headless"],
});

(async () => {
    let baseUrl = "https://toxicwaps.com";
    let seasonUrl = "/tv-series/2724C/suits/season-03.html";

    try {
        const browser = await puppeteer.connect({
            browserWSEndpoint: await browserConnectionUrl,
        });

        const page = await browser.newPage();

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

        await page.goto(baseUrl + seasonUrl);

        let paginationSelector = "ul.pagination a.ui-link";

        let episodePages = await page.$$eval(paginationSelector, (pages) => {
            return pages.slice(2).map((p) => p.getAttribute("href"));
        });

        page.close();

        let allEpisodes = await getEpisodeLinks(episodePages);

        async function getEpisodeLinks(episodePages) {
            let allLinks = [];
            episodePages.forEach(async (p) => {
                let batchLinks = await openPage(p);
                allLinks.push(...batchLinks);
            });

            async function openPage(p) {
                let newPage = await browser.newPage();

                // open each page in the pagination
                newPage.goto(baseUrl + p);

                let selector = 'a[href^="/download/"]';

                return newPage.waitForSelector(selector).then(() => {
                    // get links for all episodes on the page
                    let links = newPage.$$eval(selector, (elems) =>
                        elems.map((el) => el.getAttribute("href"))
                    );

                    return links;
                });
            }

            return allLinks;
        }

        console.log(allEpisodes);

        /* page.goto(baseUrl + link);

        selector = 'a[href^="/ddl.php"]';
        await page.waitForSelector(selector).then(async () => {
            link = await page.$eval(selector, (el) => el.getAttribute("href"));

            page.goto(`${baseUrl + link}`);

            selector = 'input[name="download"]';
            await page.waitForSelector(selector).then(async () => {
                page.click(selector);
            });
        }); */
    } catch (err) {
        console.log(err);
    }
})();
