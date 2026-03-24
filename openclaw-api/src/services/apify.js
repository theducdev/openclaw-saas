import { config } from '../config.js';

const APIFY_BASE = 'https://api.apify.com/v2';

// Build input for each actor type
function buildInput(actorId, { url, task, maxPages = 10, waitForSelector, options = {} }) {
  const genericPageFunction = `async function pageFunction(context) {
    const { $, request, log } = context;
    const title = $('title').text().trim();
    const h1 = $('h1').first().text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    const links = [];
    $('a[href]').each((i, el) => {
      if (i < 30) links.push({ text: $(el).text().trim(), href: $(el).attr('href') });
    });
    const bodyText = $('body').text().replace(/\\s+/g, ' ').trim().slice(0, 3000);
    return { url: request.url, title, h1, description, links, bodyText };
  }`;

  switch (actorId) {
    case 'apify/cheerio-scraper':
      return {
        startUrls: [{ url }],
        maxCrawlPages: maxPages,
        maxConcurrency: 5,
        pageFunction: genericPageFunction,
      };

    case 'apify/puppeteer-scraper':
      return {
        startUrls: [{ url }],
        maxCrawlPages: maxPages,
        maxConcurrency: 3,
        pageFunction: `async function pageFunction(context) {
          const { page, request } = context;
          const title = await page.title();
          const h1 = await page.$eval('h1', el => el.innerText).catch(() => '');
          const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
          const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 3000));
          return { url: request.url, title, h1, description, bodyText };
        }`,
      };

    case 'apify/playwright-scraper':
      return {
        startUrls: [{ url }],
        maxCrawlPages: maxPages,
        maxConcurrency: 3,
        pageFunction: `async function pageFunction({ page, request }) {
          const title = await page.title();
          const h1 = await page.locator('h1').first().textContent().catch(() => '');
          const description = await page.locator('meta[name="description"]').getAttribute('content').catch(() => '');
          const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 3000));
          return { url: request.url, title, h1, description, bodyText };
        }`,
      };

    case 'apify/website-content-crawler':
      return {
        startUrls: [{ url }],
        maxCrawlPages: maxPages,
        maxCrawlDepth: 2,
        crawlerType: 'playwright:firefox',
      };

    case 'apify/google-search-scraper':
      return {
        queries: task ? [task] : ['web scraping'],
        maxPagesPerQuery: Math.min(maxPages, 5),
        resultsPerPage: 10,
        countryCode: 'vn',
        languageCode: 'vi',
        saveHtml: false,
      };

    case 'compass/crawler-google-places':
      return {
        searchStringsArray: task ? [task] : ['coffee shop'],
        maxCrawledPlacesPerSearch: maxPages * 5,
        language: 'en',
        countryCode: 'VN',
      };

    case 'apify/instagram-scraper':
      return {
        directUrls: [url],            // plain string, not object
        resultsType: 'posts',
        resultsLimit: maxPages * 10,
      };

    case 'apify/facebook-pages-scraper':
      return {
        startUrls: [{ url }],         // only field this actor accepts
      };

    case 'apify/facebook-posts-scraper':
      return {
        startUrls: [{ url }],
        resultsLimit: maxPages * 10,  // correct field name (not maxPosts)
        captionText: false,
      };

    case 'apify/facebook-groups-scraper':
      return {
        startUrls: [{ url }],
        resultsLimit: maxPages * 10,  // correct field name
        viewOption: 'CHRONOLOGICAL',
      };

    case 'apify/facebook-comments-scraper':
      return {
        startUrls: [{ url }],
        resultsLimit: maxPages * 20,  // correct field name
        includeNestedComments: true,
        viewOption: 'RANKED_UNFILTERED',
      };

    case 'apify/facebook-ads-scraper':
      return {
        searchTerms: task ? [task] : [url],
        maxAds: maxPages * 10,
        adType: 'all',
        countryCode: 'VN',
        publisherPlatform: ['facebook', 'instagram'],
      };

    case 'apify/facebook-marketplace-scraper':
      return {
        searchQueries: task ? [task] : [''],
        startUrls: task ? [] : [{ url }],
        maxItems: maxPages * 10,
        location: task ? undefined : undefined,
      };

    case 'apify/facebook-profile-scraper':
      return {
        startUrls: [{ url }],
        maxPosts: maxPages * 5,
        scrapeAbout: true,
        scrapeFriends: false,
        scrapePhotos: false,
      };

    case 'apify/facebook-events-scraper':
      return {
        startUrls: [{ url }],
        maxEvents: maxPages * 10,
        scrapeAttendees: false,
      };

    case 'streamers/youtube-scraper':
      return {
        startUrls: [{ url }],
        maxResults: maxPages * 5,
        downloadSubtitles: false,
        includeStatistics: true,
      };

    case 'apidojo/tweet-scraper':
      return {
        startUrls: url.includes('twitter.com') || url.includes('x.com') ? [{ url }] : [],
        searchTerms: task ? [task] : [url],
        maxItems: maxPages * 10,
        addUserInfo: true,
        twitterHandles: [],
      };

    case 'junglee/Amazon-crawler':
      return {
        startUrls: [{ url }],
        maxItems: maxPages * 5,
        scrapeProductDetails: true,
      };

    case 'voyager/booking-scraper':
      return {
        startUrls: [{ url }],
        maxItems: maxPages * 5,
        scrapeReviews: true,
      };

    case 'maxcopell/tripadvisor':
      return {
        startUrls: [{ url }],
        maxItems: maxPages * 5,
        includeReviews: true,
      };

    case 'curious_coder/facebook-profile-scraper':
      return {
        startUrls: [{ url }],
        maxPosts: maxPages * 5,
      };

    default: // apify/web-scraper and fallback
      return {
        startUrls: [{ url }],
        maxCrawlPages: maxPages,
        maxConcurrency: 5,
        pageFunction: genericPageFunction,
      };
  }
}

export async function runCrawl({ url, task, maxPages = 10, waitForSelector, actorId, options = {} }) {
  const actor = actorId || config.apifyActorId;
  const encodedActor = actor.replace('/', '~');
  const apiUrl = `${APIFY_BASE}/acts/${encodedActor}/run-sync-get-dataset-items?timeout=180&memory=256`;

  const input = buildInput(actor, { url, task, maxPages, waitForSelector, options });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apifyToken}`,
  };

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(190000),
      });

      if (res.status === 429) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 5000)); lastError = new Error('RATE_LIMITED'); continue; }
        throw new Error('RATE_LIMITED');
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`APIFY_HTTP_${res.status}: ${text}`);
      }

      const items = await res.json();
      return { success: true, items: Array.isArray(items) ? items : [items], runId: null };
    } catch (err) {
      lastError = err;
      if (err.name === 'TimeoutError') throw new Error('APIFY_TIMEOUT');
      if (attempt < 2 && !err.message.startsWith('APIFY_HTTP')) {
        await new Promise(r => setTimeout(r, 2000)); continue;
      }
      throw err;
    }
  }
  throw lastError;
}
