let puppeteer = require("puppeteer-core");
let cheerio = require("cheerio");
let browserConnectionUrl = require("./lib/browser.js")({
    //chromeFlags: ["--headless"],
});

(async () => {
    let baseUrl = "https://toxicwaps.com";
    let seasonUrl = "/tv-series/2724C/suits/season-03.html";

    const browser = await puppeteer.connect({
        browserWSEndpoint: await browserConnectionUrl,
    });

    try {
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

        await page.setDefaultNavigationTimeout(0);

        // start automation

        await page.goto(baseUrl + seasonUrl, { timeout: 180000 });

        const pageData = await page.evaluate(() => {
            return {
                html: document.documentElement.innerHTML,
            };
        });

        const $ = cheerio.load(pageData.html);

        const links = $("ul.pagination li")
            .slice(2)
            .map((index, el) => {
                return $(el).find("a.ui-link").attr("href");
            })
            .toArray();
        //

        page.close();

        console.log("Opening pages...");

        let allEpisodes = [];

        for (let i = 0; i < links.length; i++) {
            // open a new page and scrape the episodes
            let newPage = await browser.newPage();

            await newPage.goto(baseUrl + links[i]);

            const pageData = await newPage.evaluate(() => {
                return {
                    html: document.documentElement.innerHTML,
                };
            });

            const $ = cheerio.load(pageData.html);

            const episodes = $('a[href^="/download/"]')
                .map((index, episode) => {
                    return $(episode).attr("href");
                })
                .toArray();
            //

            allEpisodes.push(...episodes);

            await newPage.close();
        }

        allEpisodes = allEpisodes.map((e) => {
            return {
                episode: e.split("/")[3].split(".")[0],
                link: baseUrl + e,
            };
        });

        console.log(allEpisodes);

        await browser.close();
    } catch (err) {
        console.log(err);

        await browser.close();
    }
})();
