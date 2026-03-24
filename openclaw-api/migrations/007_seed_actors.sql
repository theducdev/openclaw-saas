INSERT INTO actors (name, actor_id, description, category, icon) VALUES
  ('Web Scraper',             'apify/web-scraper',              'General-purpose scraper with JS support (Puppeteer). Best for most websites.',                          'general',  '🌐'),
  ('Cheerio Scraper',         'apify/cheerio-scraper',          'Ultra-fast HTML-only scraper. No JS rendering. Best for static pages.',                                  'general',  '⚡'),
  ('Puppeteer Scraper',       'apify/puppeteer-scraper',        'Full browser automation with Puppeteer. Best for heavy JS / SPA sites.',                                 'general',  '🎭'),
  ('Playwright Scraper',      'apify/playwright-scraper',       'Modern browser automation with Playwright. Supports Chromium, Firefox, WebKit.',                         'general',  '🎪'),
  ('Website Content Crawler', 'apify/website-content-crawler',  'Crawls entire websites and extracts clean text content. Best for articles, docs, blogs.',               'content',  '📄'),
  ('Google Search Scraper',   'apify/google-search-scraper',    'Scrapes Google Search results for any keyword query. Returns titles, URLs, snippets.',                   'search',   '🔍'),
  ('Google Maps Scraper',     'apify/google-maps-scraper',      'Extracts business listings, reviews, ratings, addresses from Google Maps.',                             'social',   '🗺️'),
  ('Instagram Scraper',       'apify/instagram-scraper',        'Scrapes Instagram profiles, posts, hashtags, reels. Returns media, likes, comments.',                   'social',   '📸'),
  ('Facebook Pages Scraper',  'apify/facebook-pages-scraper',   'Scrapes Facebook pages: posts, reactions, comments, page info.',                                        'social',   '👍'),
  ('YouTube Scraper',         'apify/youtube-scraper',          'Scrapes YouTube channels, videos, comments, metadata, view counts.',                                     'social',   '▶️'),
  ('Twitter / X Scraper',     'apify/twitter-scraper',          'Scrapes tweets, profiles, trends from Twitter/X. Supports search queries.',                             'social',   '🐦'),
  ('Amazon Product Scraper',  'apify/amazon-product-scraper',   'Extracts Amazon product data: title, price, rating, reviews, ASIN, images.',                            'ecommerce','🛒'),
  ('Booking.com Scraper',     'apify/booking-scraper',          'Scrapes hotel listings, prices, availability, reviews from Booking.com.',                               'travel',   '🏨'),
  ('TripAdvisor Scraper',     'apify/tripadvisor-scraper',      'Extracts TripAdvisor reviews, ratings, restaurant/hotel info.',                                         'travel',   '✈️'),
  ('LinkedIn Scraper',        'apify/linkedin-scraper',         'Scrapes LinkedIn profiles, company pages, job listings. Requires LinkedIn session cookie.', 'professional','💼')
ON CONFLICT (actor_id) DO NOTHING;
