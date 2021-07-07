const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

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

    searchTerm: async(term) => {
        console.log('searching term', term);
        await page.goto(`${BASE_URL}/search?q=${term}`);
        // await page.waitForTimeout(2000);
        console.log('scraping results');

        //$$ works exactly as a document.querySelectorAll() would in the browser console
        let results = await page.$x('//div[@id=\'search\']//div[@id=\'rso\']//div[@class=\'g\']');

        if(results) {
            console.log(results.length, 'results found');
            // console.log(results);
        } else {
            console.log('no results found');
        }
    }
}

module.exports = googleScraper;