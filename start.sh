#!/bin/bash

set -e

: ${REDISD:="redis-server"}
: ${MONGOD:="mongod"}
: ${MONGO_PORT:="27017"}

command -v $REDISD >/dev/null 2>&1 || { echo "$REDISD required but not found.  Aborting."; exit 1; }
command -v $MONGOD >/dev/null 2>&1 || { echo "$MONGOD required but not found.  Aborting."; exit 1; }

echo "Starting up Redis..."
(cd data; $REDISD >>../logs/$REDISD.log 2>&1 ) &

echo "Starting up MongoDB..."
$MONGOD --fork --port $MONGO_PORT --dbpath=data --logpath=logs/mongodb.log
