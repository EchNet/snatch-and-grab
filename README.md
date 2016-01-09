# snatch-and-grab #

Crawl a Web site.  Take what we want, discard the rest.  Build a search index.

## Install Base Software ##

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
- Crawler   (NodeJS)
- Scraper   (NodeJS)
- Master Control  (NodeJS)
- Query   (??)
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
  - Build an ElasticSearch index.

1: (Crawler)
  Create a list of all of the articles in Wikipedia.
    - Result is a MongoDB collection
  As new articles are added, they appear on the list regularly.
  As the software is improved, the quality of the list improves.
  The data lives in the cloud.
  The crawler runs in the cloud.

2: (Scraper)
  Extract content for each article in the list.
  Content remains fresh, within a set time period.
  Pages that go dead are eventually removed from the index.
  As the software is improved, the quality of the content improves.
  The scraper runs in the cloud.

3: (Indexer)
  Create a search index from the scraped content.
  Search engine answers the question "what's closest?"
  The search engine lives in the cloud.

4: (Query)
  Treat regions differently from points of interest
  UI design

