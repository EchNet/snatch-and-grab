#!/bin/bash

set -e
set -x

: ${NODE:="node"}
: ${ENV:="dev"}

for CMD in $NODE; do
  command -v $CMD >/dev/null 2>&1 || { echo "$CMD required but not found.  Aborting."; exit 1; }
done

echo "Starting up crawler..."
$NODE crawler.js --env=$ENV >>logs/crawler.log &
echo "Starting up scraper..."
$NODE scraper.js --env=$ENV >>logs/scraper.log &
echo "Starting up scrape_control..."
$NODE scrape_control.js --env=$ENV >>logs/scraper.log &
echo "Starting up server..."
$NODE server.js --env=$ENV >>logs/server.log &
