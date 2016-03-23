# What Have We Here? #

Crawl a Web site and build a geographical search index.

Version 1.0 crawls only Wikipedia sites!  Supported languages:

- English (en.wikipedia.com)
- Italian (it.wikipedia.com)
- German (de.wikipedia.com)
- Spanish (en.wikipedia.com)
- French (fr.wikipedia.com)
- Portuguese (pt.wikipedia.com)

## Base Software ##

Platform: NodeJS 5.2.0 and NPM

ElasticSearch 2.1.1

Amazon Web Services

Redis (for queueing)  [http://redis.io/download](http://redis.io/download)
 - tested using version 2.6  
 - latest is 3.0

Nginx

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

### Scraper ###

  node scraper --env=dev --in=inputFile --out=outputFile --site=lang\_wikipedia

## V1 TODO ##

Operations
- Implement a git pull strategy?
- Save AMIs
- Save HTTP access logs
- What level of monitoring/alerting is necessary?

Web Site
- Choose a website hosting service
- Register a better domain name!
- Implement an asset deployment scheme - proxy assets from S3?
- Deploy HTTPS

Non-english Wikipedias
- Add indexer support for additional languages
- Add query support for additional languages

Indexing
- Add the indexing phase to the scraper script.
- Upsert index, don't destroy and recreate.

Categorization
- Add categorization: city, monument, radio station, incident
- Drop some categories from the index.
- Filter query by category (point of interest, region, other)

Client
- Google Map integration
- UI supports a which-wikipedia setting.
- Add enablement instructions.
- Test on IE
- UI beautification

## V2 ##

Android app
iOS app

## BUGS ##

- BUG: exclude Tempe Terra! (on Mars) and Taurus-Littow (on the moon)
