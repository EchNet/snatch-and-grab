# What Have We Here? #

Crawl a Web site and build a geographical search index.

Version 1.0 crawls only Wikipedia sites!  Supported languages:

- English (en.wikipedia.com)
- Italian (it.wikipedia.com)

## Base Software ##

Platform: NodeJS 5.2.0 and NPM

ElasticSearch 2.1.1

Redis (for queueing)  [http://redis.io/download](http://redis.io/download)
 - tested using version 2.6  
 - latest is 3.0

Nginx (coming soon)

## Architecture ##

There is an active indexing pipeline for each supported language.

The Crawler runs daily.  Its role is to create an up-to-date list of all target pages
(articles) on the site (wikipedia), which feeds the Indexer.

The Indexer runs weekly.  Its role is to create a new ElasticSearch index containing only
target pages that have geographical coordinates.  Once the new index is ready, it 
becomes the new current index, which powers the Query API.

The Query API is served by a NodeJS Express server, sitting behind an nginx and a load 
balancer. 

There's also a Web UI.

## Commands ## 

### Crawler ###

  node crawler --env=dev --out=outFileName --site=lang\_wikipedia

Creates a list of all target URIs on the site and writes it to the specified output
file (default=data/crawler.out), one entry per line.

Logs files are identified by the pattern logs/crawler.log.X.

### Indexer ###

TBD

## V1 TODO ##

- Figure out how dynamic system state is stored.
- Apply a consistent logging pattern throughout.
- Rotate log files
- Crawler uploads to S3
- List is downloadable through website
- Figure out how to do system alerts.
- Bring in nginx
- Run crawler on a schedule.
- Scraper is driven by URI list
- Condense the scraper and the indexer phases into one, bulking scrapes as well as index upserts.
- Add crash recovery to crawler.
- Eradicate MongoDB code.
- Run indexer on a schedule.
- Add scraper support for Italian
- Add query support for Italian
- Drop Redis from the picture
- BUG: Scraper control should not increase max if fewer than max were caught last time.
- BUG: Scraper control sometimes requeues pages.
- Add support for German
- Add a unit testing framework
- BUG: Clean up geo scrape - ignore non-numbers.  Parse -.5
- Add categorization: city, monument, radio station, incident
- Filter query by category (point of interest, region, other)
- Refine query: show distance and direction for each match
- Add tiers to API results: close by, further, a short walk away.
- Query takes language parameter.
- Query refreshes dynamic configuration periodically.
- UI supports a language setting.
- UI supports tiers.
- UI enables manual input.
