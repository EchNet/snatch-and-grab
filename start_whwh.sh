#!/bin/bash

set -e

: ${REDISD:="redis-server"}
: ${MONGOD:="mongod"}
: ${MONGO_PORT:="27017"}
: ${NODE:="node"}
: ${ELASTICSEARCH:="elasticsearch"}

for CMD in $REDISD $MONGOD $NODE $ELASTICSEARCH; do
  command -v $CMD >/dev/null 2>&1 || { echo "$CMD required but not found.  Aborting."; exit 1; }
done

echo "Starting up Redis..."
(cd data; $REDISD >>../logs/$REDISD.log 2>&1 ) &

echo "Starting up MongoDB..."
$MONGOD --fork --port $MONGO_PORT --dbpath=data --logpath=logs/mongodb.log

# echo "Starting up NodeJS processes..."
# $NODE crawler.js --env=dev --site=test >>logs/crawler.log &
# $NODE scraper.js --env=dev --site=test >>logs/scraper.log &
# $NODE scrape_control.js --env=dev --site=test >>logs/scraper.log &
# $NODE master.js --env=dev --site=test >>logs/master.log &

$ELASTICSEARCH -d -p data/elasticsearch.pid
