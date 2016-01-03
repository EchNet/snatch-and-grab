#!/bin/bash

set -e

: ${REDISD:="redis-server"}
: ${MONGOD:="mongod"}
: ${NODE:="node"}
: ${MONGO_PORT:="27017"}

command -v $REDISD >/dev/null 2>&1 || { echo "$REDISD required but not found.  Aborting."; exit 1; }
command -v $MONGOD >/dev/null 2>&1 || { echo "$MONGOD required but not found.  Aborting."; exit 1; }
command -v $NODE >/dev/null 2>&1 || { echo "$NODE required but not found.  Aborting."; exit 1; }

echo "Starting up Redis..."
(cd data; $REDISD >>../logs/$REDISD.log 2>&1 ) &

echo "Starting up MongoDB..."
$MONGOD --fork --port $MONGO_PORT --dbpath=data --logpath=logs/mongodb.log

echo "Starting up NodeJS processes..."
(cd crawler; $NODE crawler.js --env=dev --site=test >>../logs/crawler.log ) &
(cd crawler; $NODE scraper.js --env=dev --site=test >>../logs/scraper.log ) &
(cd crawler; $NODE master.js --env=dev --site=test >>../logs/master.log ) &
