-- Remove actors that require paid Apify plan or have wrong IDs
DELETE FROM actors WHERE actor_id IN (
  'apify/website-content-crawler',
  'apify/google-search-scraper',
  'compass/crawler-google-places',
  'curious_coder/facebook-profile-scraper',
  'junglee/Amazon-crawler',
  'apify/linkedin-scraper'
);

-- Also remove the disabled ones (playwright, fb-ads, fb-marketplace, fb-events)
DELETE FROM actors WHERE actor_id IN (
  'apify/playwright-scraper',
  'apify/facebook-ads-scraper',
  'apify/facebook-marketplace-scraper',
  'apify/facebook-events-scraper'
);
