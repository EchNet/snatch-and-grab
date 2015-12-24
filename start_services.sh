#!/bin/bash
#
# Start the data services that WHWH depends on, locally, for development.
#

set -e

: ${REDISD:="redis-server"}
: ${MONGOD:="mongod"}
: ${MONGO_PORT:="27017"}
: ${ELASTICSEARCH:="elasticsearch"}

for CMD in $REDISD $MONGOD $ELASTICSEARCH; do
  command -v $CMD >/dev/null 2>&1 || { echo "$CMD required but not found.  Aborting."; exit 1; }
done

echo "Starting Redis..."
(cd data; $REDISD >>../logs/$REDISD.log 2>&1 ) &

echo "Starting MongoDB..."
$MONGOD --fork --port $MONGO_PORT --dbpath=data --logpath=logs/mongodb.log

echo "Starting ElasticSearch..."
$ELASTICSEARCH -d -p data/elasticsearch.pid
