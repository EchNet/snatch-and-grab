# What Have We Here? #

Crawl a Web site and build a geographical search index.

Version 1.0 crawls only Wikipedia sites!  Supported languages:

- English (en.wikipedia.com)
- Italian (it.wikipedia.com)
- German (de.wikipedia.com)

## Base Software ##

NodeJS 5.2.0 and NPM

ElasticSearch 2.1.1

Amazon Web Services

## Architecture ##

There is an active indexing pipeline for each supported language.  Pipeline code is
found in the `pipeline` folder.

### Crawler

The Crawler runs daily.  Its role is to create an up-to-date list of all target pages
(articles) on the site (wikipedia), which feeds the Indexer.  It creates a list of all
target URIs on the site and writes it to the specified output file
(default=data/crawler.out), one entry per line.

  node crawler --env=dev --out=outFileName --site=lang\_wikipedia

### Scraper / Indexer

The Scraper and Indexer run weekly.  Their combined role is to create a new ElasticSearch
index containing target pages that have geographical coordinates.  The Scraper reads 
the list of target URIs put out by the Crawler, and puts out a file containing JSON entries,
one per line, describing those pages that have geographical coordinates.  The Indexer
reads the preceding file and loads the information into ElasticSearch.

Once a new index is ready, it may become the new current index, which powers the Query API.

  node scraper --env=dev --in=inputFile --out=outputFile --site=lang\_wikipedia

  node indexer --env=dev --in=inputFile --site=lang\_wikipedia

### Server

The server serves a Web UI and the Query API.

The server is a NodeJS Express server, sitting behind an nginx and a load balancer. 

### Logging

All commands log their output to the logs folder.  Logs roll over daily.

## Development

To run unit tests: `node_modules/mocha/bin/mocha`

To start/stop ElasticSearch: `start_services.sh` and `stop_services.sh`

### TODO 

Operations
- Dockerize
- Save HTTP access logs
- What level of monitoring/alerting is necessary?

Web Site
- Choose a website hosting service
- Register a better domain name!
- Deploy HTTPS

Non-english Wikipedias
- Add query support for additional languages

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

### Known bugs 

- BUG: exclude Tempe Terra! (on Mars) and Taurus-Littow (on the moon)

### Wish list

Android app

iOS app

Implement an asset deployment scheme - proxy assets from S3?

Additional languages:
- Spanish (en.wikipedia.com)
- French (fr.wikipedia.com)
- Portuguese (pt.wikipedia.com)
