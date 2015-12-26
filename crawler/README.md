Crawler

This crawler looks for pages matching certain patterns and inserts empty records into MongoDB.

Parameters:
  starting URL
  wipe the collection or not

It runs until there are no jobs left.

It creates a log of all its activity.

It writes a summary file on exit.

Configuration:
  This crawler looks for links matching certain patterns and queues them.

Canonicalize the URL(?)

Data components:
  Redis / Kue
  MongoDB

How do I deal with errors?   Just report them, for now.
In future, maybe trigger re-run on high error rate.

Initial record written to MongoDB includes:
  uri
  created_at
  version of crawler
  crawl_error (if any)
