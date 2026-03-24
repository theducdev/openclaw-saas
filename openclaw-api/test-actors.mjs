/**
 * OpenClaw Actor Test Suite — Round 2 (fixed actor IDs)
 */

const API_BASE = 'http://127.0.0.1:3000/api/v1';
const CUSTOMER_KEY = 'oc_4Cne6Dbt3VhRkQCW2yZR6ENIuSFp_wfV';
const TIMEOUT_MS = 200_000;

const TESTS = [
  // General
  { actor_id: 'apify/web-scraper',                      url: 'https://books.toscrape.com',               task: 'Get book titles and prices',    maxPages: 1 },
  { actor_id: 'apify/cheerio-scraper',                  url: 'https://books.toscrape.com',               task: 'Get book titles and prices',    maxPages: 1 },
  { actor_id: 'apify/puppeteer-scraper',                url: 'https://books.toscrape.com',               task: 'Get page title',                maxPages: 1 },
  // Content
  { actor_id: 'apify/website-content-crawler',          url: 'https://apify.com/blog',                   task: 'Extract article content',       maxPages: 1 },
  // Search
  { actor_id: 'apify/google-search-scraper',            url: 'https://www.google.com',                   task: 'apify web scraping',            maxPages: 1 },
  // Google Maps (fixed ID)
  { actor_id: 'compass/crawler-google-places',          url: 'https://www.google.com/maps',              task: 'coffee shop Hanoi Vietnam',     maxPages: 1 },
  // Social
  { actor_id: 'apify/instagram-scraper',                url: 'https://www.instagram.com/apify/',         task: 'Get recent posts',              maxPages: 1 },
  { actor_id: 'streamers/youtube-scraper',              url: 'https://www.youtube.com/@Apify',           task: 'Get channel videos',            maxPages: 1 },
  { actor_id: 'apidojo/tweet-scraper',                  url: 'https://twitter.com/apify',                task: 'apify scraping',                maxPages: 1 },
  // Facebook
  { actor_id: 'apify/facebook-pages-scraper',           url: 'https://www.facebook.com/apifytech',       task: 'Get page posts',                maxPages: 1 },
  { actor_id: 'apify/facebook-posts-scraper',           url: 'https://www.facebook.com/apifytech',       task: 'Get recent posts',              maxPages: 1 },
  { actor_id: 'apify/facebook-groups-scraper',          url: 'https://www.facebook.com/groups/816227471896150', task: 'Get group posts',        maxPages: 1 },
  { actor_id: 'apify/facebook-comments-scraper',        url: 'https://www.facebook.com/apifytech/posts/660891709469984', task: 'Get comments', maxPages: 1 },
  { actor_id: 'curious_coder/facebook-profile-scraper', url: 'https://www.facebook.com/apifytech',       task: 'Get profile info',              maxPages: 1 },
  // E-commerce (fixed ID)
  { actor_id: 'junglee/Amazon-crawler',                 url: 'https://www.amazon.com/s?k=laptop',        task: 'Get product listings',          maxPages: 1 },
  // Travel (fixed IDs)
  { actor_id: 'voyager/booking-scraper',                url: 'https://www.booking.com/searchresults.html?ss=Hanoi', task: 'Get hotels',        maxPages: 1 },
  { actor_id: 'maxcopell/tripadvisor',                  url: 'https://www.tripadvisor.com/Restaurants-g293924-Hanoi.html', task: 'Restaurants', maxPages: 1 },
  // Professional (fixed ID)
  { actor_id: 'apify/linkedin-scraper',                 url: 'https://www.linkedin.com/company/apify/',  task: 'Get company info',              maxPages: 1 },
];

async function testActor(test) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(`${API_BASE}/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_KEY}` },
      body: JSON.stringify({ url: test.url, task: test.task, actor_id: test.actor_id, options: { maxPages: test.maxPages } }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const data = await res.json();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (data.success) {
      const firstResult = data.data.results[0] || {};
      const keys = Object.keys(firstResult).filter(k => !['#error','#debug'].includes(k));
      const hasError = firstResult.error || firstResult.errorDescription;
      return {
        actor: test.actor_id, status: hasError ? 'AUTH_NEEDED' : 'PASS', elapsed,
        results: data.data.results.length, pages: data.data.pages_crawled,
        sample: keys.slice(0, 5).join(', ') || '—',
        note: hasError ? String(firstResult.error || firstResult.errorDescription).slice(0, 60) : '',
      };
    } else {
      return { actor: test.actor_id, status: 'FAIL', elapsed, results: 0, pages: 0, error: data.error?.message || '?', note: '' };
    }
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return { actor: test.actor_id, status: err.name === 'AbortError' ? 'TIMEOUT' : 'ERROR', elapsed, results: 0, pages: 0, error: err.message, note: '' };
  }
}

async function runBatches(tests, batchSize = 4) {
  const results = [];
  for (let i = 0; i < tests.length; i += batchSize) {
    const batch = tests.slice(i, i + batchSize);
    console.log(`\nBatch ${Math.floor(i/batchSize)+1}/${Math.ceil(tests.length/batchSize)}: ${batch.map(t=>t.actor_id.split('/')[1]).join(', ')}`);
    const batchResults = await Promise.all(batch.map(testActor));
    batchResults.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : r.status === 'AUTH_NEEDED' ? '🔐' : r.status === 'TIMEOUT' ? '⏱' : '❌';
      const detail = r.status === 'PASS' ? `${r.results} items, fields: ${r.sample}` : r.note || r.error || r.status;
      console.log(`  ${icon} ${r.actor.padEnd(44)} ${r.elapsed}s — ${detail}`);
    });
    results.push(...batchResults);
  }
  return results;
}

console.log('=== OpenClaw Actor Test Suite (Round 2) ===');
const results = await runBatches(TESTS, 4);

const pass = results.filter(r => r.status === 'PASS');
const auth = results.filter(r => r.status === 'AUTH_NEEDED');
const fail = results.filter(r => r.status === 'FAIL');
const timeout = results.filter(r => r.status === 'TIMEOUT');

console.log('\n\n══════════════════════════════════════════════════');
console.log('FINAL REPORT');
console.log('══════════════════════════════════════════════════');
console.log(`Total: ${results.length}  ✅ PASS: ${pass.length}  🔐 AUTH_NEEDED: ${auth.length}  ❌ FAIL: ${fail.length}  ⏱ TIMEOUT: ${timeout.length}`);

console.log('\n✅ WORKING (returns real data):');
pass.forEach(r => console.log(`   ${r.actor.padEnd(44)} ${r.elapsed}s | ${r.results} items | ${r.sample}`));

console.log('\n🔐 RUNS BUT NEEDS LOGIN/SESSION (Facebook blocked without auth):');
auth.forEach(r => console.log(`   ${r.actor.padEnd(44)} ${r.elapsed}s | ${r.note}`));

console.log('\n❌ FAILED (wrong input or not available on this plan):');
fail.forEach(r => console.log(`   ${r.actor.padEnd(44)} ${r.elapsed}s | ${r.error}`));

console.log('\n⏱ TIMEOUT:');
timeout.forEach(r => console.log(`   ${r.actor.padEnd(44)} ${r.elapsed}s`));
