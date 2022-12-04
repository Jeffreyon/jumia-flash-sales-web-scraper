/**
 * This script scrapes product data from amazon's top products category and stores it into a json file
 */

let puppeteer = require("puppeteer-core");
let cheerio = require("cheerio");
let browserConnectionUrl = require("./lib/browser.js")({
    chromeFlags: ["--headless"],
});
let fs = require("fs");

// set up async function
async function runScraper() {
    let url = "https://www.jumia.com.ng/flash-sales/";

    // connect puppeteer to broser from chrome launcher
    let browser = await puppeteer.connect({
        browserWSEndpoint: await browserConnectionUrl,
    });

    try {
        // create new page
        let page = await browser.newPage();

        // set up page optimization and timeout
        page.setRequestInterception(true);

        page.on("request", (req) => {
            if (
                req.resourceType() == "image" ||
                req.resourceType() == "stylesheet" ||
                req.resourceType() == "font"
            ) {
                req.abort();
            } else {
                req.continue();
            }
        });

        page.setDefaultNavigationTimeout(180000);

        // navigate to url
        await page.goto(url);

        // get flash sales items
        let selector = "article.prd._fb._p.col.c-prd";

        await page.waitForSelector(selector, { timeout: 0 });

        // get resulting html
        let pageData = await page.evaluate(() => {
            return document.documentElement.innerHTML;
        });

        // load the html as cheerio object
        let $ = cheerio.load(pageData);

        let items = $(selector)
            .map((i, item) => {
                return {
                    name: $(item).find("h3.name").text(),
                    price: $(item).find(".prc").text(),
                    dsc_price: "-" + $(item).find(".s-prc-w .old").text(),
                    discount: $(item).find(".s-prc-w .bdg._dsct._sm").text(),
                    items_left: $(item).find(".ft .stk").text().split(" ")[0],
                    ratings: $(item).find(".stars._s").text(),
                    /* no_of_reviews: $(item)
                        .find(".rev")
                        .text()
                        .match(/(?<=\()\d*(?=\))/), */
                    image_url: $(item).find(".img-c .img").attr("data-src"),
                    item_link:
                        "https://jumia.com/" +
                        $(item).find("a.core").attr("href"),
                };
            })
            .toArray();

        console.log(items);

        fs.writeFile("./flash-sale.json", JSON.stringify(items), (err) => {
            if (err) console.err(err);
            else console.log("Products on sale written to `flash-sale.json`");
        });

        await browser.close();
    } catch (error) {
        console.log("Scraper Error:\n", error);
        await browser.close();
    }
}

runScraper();
