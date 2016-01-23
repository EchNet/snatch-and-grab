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
 - Register the URLs of the target pages (articles) on the site (wikipedia) in the scraper data store.

Scraper
  - Scraper is fed by the output of the crawler.
  - Scraper extracts content for each unscraped article.

Indexer
  - Create a search index from the scraped content.
  - Search index supports geo queries.

Server
  - Queries the search index for closest points of interest
  - Offers admin queries

UI 
  - Web page, using navigator.geolocation if available, manual input if not.
  - Shows best matches

## Development Plan ##

0: Prototype
  Get the whole thing working end to end in some form.
  - Get to a minimal deployment.
  - Test in the field!
  - Logging

1: Refine the Crawler
  Crawler runs steadily and doesn't get stuck.
  As new articles are added, they appear on the list regularly.
  Crawler is always non-destructive.
  Crawler and its data are deployed in the cloud.
  Crawler supports multiple languages

2: Refine the Scraper
  Scraper re-extracts content for each article that is no longer "fresh".
  Scraper runs steadily and doesn't get stuck.
  Scraper control doesn't requeue pages that the scraper simply hasn't caught up to.
  Pages that go dead are eventually have their content removed from the database.
  Scraper and its data are deployed in the cloud.
  Scraper supports multiple languages

3: Refine the Indexer
  Indexer records general type of article: city, monument, radio station, incident
  Indexer and search engine are deployed to the cloud.
  Indexer creates one index per language.

4: Refine the server
  Regions are also shown in some cases.
  Distance and direction are shown for each
  Query takes language parameter.

5: Refine the UI
  vary presentation for clustering factors
  support multiple languages
