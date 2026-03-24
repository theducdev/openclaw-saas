INSERT INTO actors (name, actor_id, description, category, icon) VALUES
  ('Facebook Posts Scraper',      'apify/facebook-posts-scraper',      'Scrape posts, reactions, and shares from any Facebook page or profile URL.',            'facebook', '📝'),
  ('Facebook Groups Scraper',     'apify/facebook-groups-scraper',     'Scrape posts, comments, and members from Facebook groups (public & private with login).','facebook', '👥'),
  ('Facebook Comments Scraper',   'apify/facebook-comments-scraper',   'Extract all comments and replies from a specific Facebook post URL.',                    'facebook', '💬'),
  ('Facebook Ads Scraper',        'apify/facebook-ads-scraper',        'Scrape Facebook Ad Library — search ads by keyword, brand, or page name.',               'facebook', '📢'),
  ('Facebook Marketplace Scraper','apify/facebook-marketplace-scraper','Scrape product listings from Facebook Marketplace by keyword or category.',              'facebook', '🏪'),
  ('Facebook Profile Scraper',    'apify/facebook-profile-scraper',    'Extract info from Facebook personal/business profiles: bio, followers, posts.',          'facebook', '👤'),
  ('Facebook Events Scraper',     'apify/facebook-events-scraper',     'Scrape Facebook events: title, date, location, attendees, and description.',             'facebook', '📅')
ON CONFLICT (actor_id) DO NOTHING;
