#!/bin/bash

set -e
set -x

: ${NODE:="node"}

for CMD in $NODE; do
  command -v $CMD >/dev/null 2>&1 || { echo "$CMD required but not found.  Aborting."; exit 1; }
done

echo "Starting up crawler..."
$NODE crawler.js >>logs/crawler.log &
echo "Starting up scraper..."
$NODE scraper.js >>logs/scraper.log &
echo "Starting up scrape_control..."
$NODE scrape_control.js >>logs/scrape_control.log &
echo "Starting up server..."
$NODE server.js >>logs/server.log &
