# What Have We Here? #

Crawl a Web site and build a geographical search index.

Version 1.0 crawls only the Wikipedia sites (en.wikipedia.com, it.wikipedia.com, ...)!

## Base Software ##

Platform: NodeJS 5.2.0 and NPM

Redis (for queueing)  [http://redis.io/download](http://redis.io/download)
 - tested using version 2.6  
 - latest is 3.0

MongoDB (for persistence of scraped data) 
 - tested using 3.0.8

ElasticSearch (for geo-search)  2.1.1

## Functional components ##

Crawler
 - Create a list of all target page (articles) on the site (wikipedia)
 - Writes it to a file
 - Uploads the file to S3

Indexer
 - Creates or continues an ES index
 - Fetches the latest target page list from S3
 - Loads target page list into a work queue
 - Launches scrapers
 - When scraping is done, makes the new index current.
 - Destroys the work queue
 - Uploads scraper log file to S3

Scraper
  - Grabs 5000 items from the work queue
  - For each, scraper extracts geo location.
  - Formats entries having geo and bulk-loads them into new ES index.

Server
  - Queries the search index for closest points of interest
  - Proxies some ES queries

UI 
  - Web page, using navigator.geolocation if available, manual input if not.
  - Shows best matches

## V1 Development Plan ##

0: Systems
  - Dynamic state - the data structures in use, those that are being built
  - Logging
  - Alerts
  - Nginx runs as service, proxies to Node

1: Refine the Crawler
  - Crawler runs on a schedule.
  - Crawler runs from start to finish 
  - Crawler supports English, Italian, and German.

2: Refine the Scraper
  Scraper control doesn't increase max if fewer than max were caught last time.
  Scraper control doesn't requeue pages that the scraper simply hasn't caught up to.
  Scraper runs steadily and doesn't get stuck.
  Scraper re-extracts content for each article that is no longer "fresh".
  Pages that go dead are eventually have their content removed from the database.
  Scraper and its data are deployed in the cloud.
  Scraper supports multiple languages
  Clean up geo scrape - ignore non-numbers.  Parse -.5

3: Refine the Indexer
  Indexer records general type of article: city, monument, radio station, incident
  Indexer and search engine are deployed to the cloud.
  Indexer creates one index per language.

4: Refine the Query
  Show tiers - close by, further, a short walk away.
  Show Distance and direction for each item
  Filter by page type (point of interest, region, other)
  Query takes language parameter.

5: Refine the UI
  vary presentation for clustering factors
  Support language setting
