const scraper = require('./scraper');

async function scrape() {
    await scraper.initialize();
    await scraper.agreeCookies();
    await scraper.searchTerm('sylvester eijffinger', 20);
    await scraper.end();
}

scrape();