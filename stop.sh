#!/bin/sh
set -e

MONGO_PIDFILE="data/mongod.lock"
ELASTICSEARCH_PIDFILE="data/elasticsearch.pid"

for PIDFILE in $MONGO_PIDFILE $ELASTICSEARCH_PIDFILE; do
  if [ -f $PIDFILE ]; then
    kill -3 `cat $PIDFILE` || true
  fi
done

sleep 3  # TODO: find a better way to wait for mongod to shut down 
