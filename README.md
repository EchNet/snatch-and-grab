# snatch-and-grab #

Crawl a Web site.  Take what we want, discard the rest.  Build a search index.

## Base Software ##

NodeJS 5.2.0 and NPM

Redis  http://redis.io/download    tested using version 2.6   latest is 3.0

MongoDB    tested using 3.0.8

ElasticSearch  2.1.1

## Architecture ##

Data components
- Redis for queueing 
- MongoDB for database
    - Indexed by URI
    - Indexed by last update time
- ElasticSearch for search

Functional components
- Crawler   (NodeJS / MongoDB)
- Scraper   (NodeJS / MongoDB)
- Indexer (NodeJS / MongoDB / ElasticSearch)
- Query   (NodeJS / ElasticSearch)
- UI   (plain jQuery)

Configuration:
- installed NodeJS modules

Deployment
- ???

Operations
- Logging ... want access to detailed logs
- Error tracking and response

## Development Plan ##

0: (Prototype)
  Get the whole thing working end to end in some form.
  - Add a UI
  - Get it ready for deployment
  - Deploy it.

1: (Crawler)
  Create a list of all of the articles in Wikipedia.
  Crawler runs steadily and doesn't get stuck.
  Crawler is always non-destructive.
  As new articles are added, they appear on the list regularly.
  Crawler and its data are deployed in the cloud.
  Crawler supports multiple languages

2: (Scraper)
  Scraper is fed by the output of the crawler.
  Scraper extracts content for each unscraped article.
  Scraper re-extracts content for each article that is no longer "fresh".
  Scraper runs steadily and doesn't get stuck.
  Pages that go dead are eventually have their content removed from the database.
  Scraper and its data are deployed in the cloud.
  Scraper supports multiple languages

3: (Indexer)
  Create a search index from the scraped content.
  Search engine schema supports geo queries.
  Indexer records general type of article: city, monument, radio station, incident
  Indexer and search engine are deployed to the cloud.
  Indexer creates one index per language.

4: (Query)
  API server queries ElasticSearch for closest points of interest
  Regions are also shown in some cases.
  Distance and direction are shown for each
  Query takes language parameter.

5: (UI)
  Use geo if available, web service if not.
  show up to N matches
  vary presentation for clustering factors
  support multiple languages
