-- Fix wrong actor IDs and update to correct community actors
UPDATE actors SET actor_id = 'streamers/youtube-scraper'           WHERE actor_id = 'apify/youtube-scraper';
UPDATE actors SET actor_id = 'apidojo/tweet-scraper'               WHERE actor_id = 'apify/twitter-scraper';
UPDATE actors SET actor_id = 'junglee/Amazon-crawler'              WHERE actor_id = 'apify/amazon-product-scraper';
UPDATE actors SET actor_id = 'voyager/booking-scraper'             WHERE actor_id = 'apify/booking-scraper';
UPDATE actors SET actor_id = 'maxcopell/tripadvisor'               WHERE actor_id = 'apify/tripadvisor-scraper';
UPDATE actors SET actor_id = 'curious_coder/facebook-profile-scraper' WHERE actor_id = 'apify/facebook-profile-scraper';
UPDATE actors SET actor_id = 'compass/crawler-google-places'       WHERE actor_id = 'apify/google-maps-scraper';

-- Disable actors that time out or fail (can be re-enabled later)
UPDATE actors SET is_active = false WHERE actor_id IN (
  'apify/playwright-scraper',
  'apify/facebook-ads-scraper',
  'apify/facebook-marketplace-scraper',
  'apify/facebook-events-scraper'
);
