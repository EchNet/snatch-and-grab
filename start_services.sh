#!/bin/bash
#
# Start the data services that WHWH depends on, locally, for development.
#

set -e

: ${ELASTICSEARCH:="elasticsearch"}

for CMD in $ELASTICSEARCH; do
  command -v $CMD >/dev/null 2>&1 || { echo "$CMD required but not found.  Aborting."; exit 1; }
done

echo "Starting ElasticSearch..."
$ELASTICSEARCH -d -p data/elasticsearch.pid
