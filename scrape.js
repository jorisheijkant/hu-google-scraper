const fetch = require('node-fetch');
const scraper = require('./scraper');

// this function fetches the filters from the VPS
let media = [];
let fetchFilters = async function() {
    let response = await fetch('https://api.jorisheijkant.nl/data/hu/legacy-filters.json');

    if (response.ok) {
        let json = await response.json();
        console.log(`fetched ${json.length} legacy media filters!`);
        media = json;
    } else {
        console.log("HTTP-Error: " + response.status);
    }
}

async function scrape() {
    await fetchFilters();
    await scraper.initialize(true);
    await scraper.agreeCookies();
    await scraper.searchTerm('sylvester eijffinger', 20, media);
    await scraper.end();
}

scrape();