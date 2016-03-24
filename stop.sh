#!/bin/sh
set -e

ELASTICSEARCH_PIDFILE="data/elasticsearch.pid"

for PIDFILE in $ELASTICSEARCH_PIDFILE; do
  if [ -f $PIDFILE ]; then
    kill -3 `cat $PIDFILE` || true
  fi
done
