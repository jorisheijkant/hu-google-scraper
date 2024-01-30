const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const slugify = require('./utils/slugify');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin());

// Set variables
let browser = null;
let page = null;
const BASE_URL = 'https://google.nl';

const googleScraper = {
    initialize: async (headless = true) => {
        console.log('Initializing browser, headless', headless);

        browser = await puppeteer.launch({
            headless: headless,
            product: 'chrome',
            devtools: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu'
            ]
        });

        page = await browser.newPage();

        await page.setViewport({
            width: 1000,
            height: 500,
        });

        console.log(await browser.userAgent());

        // await page.goto('https://bot.sannysoft.com');
        // await page.waitFor(5000);

        await page.goto(BASE_URL);

        console.log(chalk.black.bgCyanBright(' Initialized, Going to —>" + BASE_URL'));
    },

    end: async () => {
        console.log('🚪 Closing browser');
        await browser.close();
    },

    agreeCookies: async() => {
        console.log('Looking for cookie button');
        const [button] = await page.$x("//div[text()='Ik ga akkoord']");
        if (button) {
            console.log('Cookie button found, agreeing to cookies');
            await button.click();
        } else {
            console.log('Cookie button not found');
        }
    },

    searchTerm: async(term, pages, media) => {
        // Set path-friendly version of term
        let slug = slugify(term);

        // Set results variable
        let resultsArray = [];
        let regularArray = [];

        // Go to page and start process
        console.log('searching term', term);
        await page.goto(`${BASE_URL}/search?q=${term}`);
        console.log('scraping results');

        for(let i = 0; i < pages; i++) {
            console.log('Now scraping page ', i + 1);
            let clickNext;
            if(i < pages - 1) {
                clickNext = true;
            }

            let results = await page.$x('//div[@id=\'search\']//div[@id=\'rso\']//div[@class=\'g\']');

            if(results) {
                console.log(results.length, 'results found');

                for (let result of results) {
                    // Parse results into JSON
                    let parsedResult = {};
                    parsedResult.title = await result.$eval('a h3', element => element.innerText);
                    parsedResult.urlText = await result.$eval('a cite', element => element.innerText);
                    parsedResult.url = await result.$eval('a', element => element.href);
                    parsedResult.text = await result.$eval(':scope > div > div > div:nth-of-type(2)', element => element.innerHTML);
                    // let textElement = await result.$x('//div//div//div[2]//div');
                    // console.log(textElement);
                    // parsedResult.text = textElement.$eval('div', element => element.innerHTML);
                    parsedResult.used = false;

                    let checkNews = (result) => {
                        // console.log(`Checking result`, result.url);
                        // Set link sub-elements
                        let link = result.url;
                        let isNews;

                        if(link) {
                            // Check whether this is a link to a legacy news site
                            for (let index = 0; index < media.length; index++) {
                                isNews = link.includes(media[index].url_pattern);
                                if(isNews) {
                                    console.log(link, 'is a news result!')
                                    return true;
                                }
                            }

                            return isNews;
                        }
                    }

                    parsedResult.news = checkNews(parsedResult);

                    if(parsedResult.news) {
                        resultsArray.push(parsedResult);
                    } else {
                        regularArray.push(parsedResult);
                    }
                }

            } else {
                console.log('no results found');
            }

            if(clickNext) {
                // Find next page button
                let link = await page.$eval("#pnnext", el => {
                    if(el) return el.href
                });

                if (link) {
                    console.log('Next page button found, going to next page', link);
                    // await page.waitForNavigation();
                    // FILTER ALSO INCLUDES SIMILAR RESULTS
                    await page.goto(`${link}`);
                } else {
                    console.log('Page does not exist, index');
                }
            }
        }

        //Set json directory and make one (including empty json file) if it does not exist
        let json_dir = path.join(__dirname, `./json/${slug}`);
        if (!fs.existsSync(json_dir)){
            fs.mkdirSync(json_dir);
            fs.writeFileSync(`${json_dir}/results.json`, JSON.stringify([]));
            fs.chmod(`${json_dir}/results.json`, 0o777, () => {console.log('chmod set to 777')});
        }

        //write files to the system
        console.log(`Total ${resultsArray.length} news results, writing them to file...`);

        fs.writeFile(`${json_dir}/news-results.json`, JSON.stringify(resultsArray), (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log(chalk.black.bgYellowBright('💾 The news results file has been saved!'));

                //Fix permissions
                fs.chmod(`${json_dir}/news-results.json`, 0o777, (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('💾 chmod set to 777')
                    }
                });
            }
        });

        console.log(`Total ${regularArray.length} regular results, writing them to file...`);

        fs.writeFile(`${json_dir}/regular-results.json`, JSON.stringify(regularArray), (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log(chalk.black.bgYellowBright('💾 The regular results file has been saved!'));

                //Fix permissions
                fs.chmod(`${json_dir}/regular-results.json`, 0o777, (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('💾 chmod set to 777')
                    }
                });
            }
        });
    }
}

module.exports = googleScraper;