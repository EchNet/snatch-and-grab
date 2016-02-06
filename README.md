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

All commands log their output to the logs folder.

### Crawler ###

  node crawler --env=dev --out=outFileName --site=lang\_wikipedia

Creates a list of all target URIs on the site and writes it to the specified output
file (default=data/crawler.out), one entry per line.

### Indexer ###

  node indexer --env=dev --dest=url --site=lang\_wikipedia

## V1 TODO ##

Crawler

- Write cron-able crawl script including S3 upload
- Deploy regular crawl (English)
- Add additional regular crawls (Italian, German, Spanish, French)

Indexer

- Add categorization: city, monument, radio station, incident
- Drop MongoDB database!
- Scrape control is driven by URI list
- Condense the scraper and the indexer phases into one, bulking scrapes as well as index upserts.
- Run indexer on a schedule.
- Add indexer support for additional languages
- Figure out how dynamic system state is managed
- Indexer auto-switches to the new index on completion.

Query

- Query pulls index setting from dynamic system state
- Add query support for additional languages
- Filter query by category (point of interest, region, other)
- Add tiers to API results: close by, further, a short walk away.

Server
- Separate API from assets
- Bring in nginx, proxy API and assets
- Deploy HTTPS

Client
- Google Map integration
- UI supports a language setting.
- UI supports tiers.
- Test on Safari
- Test on IE
- UI beautification

Operations
- System monitoring
- Log aggregation

## V2 ##

Android app
iOS app

## BUGS ##

- Add a unit testing framework for bug fixing!
- BUG: Clean up geo scrape - ignore non-numbers.  Parse -.5
- BUG: Scraper control should not increase max if fewer than max were caught last time.
- BUG: Scraper control sometimes requeues pages.
- BUG: final "exiting" message is not output by winston in the abort case
- BUG: exclude Tempe Terra! (on Mars) and Taurus-Littow (on the moon)
- BUG: at lat 42 lon 30 there's https://en.wikipedia.org/wiki/MV_Mefk%C3%BCre which has no title, also one at 42,18
