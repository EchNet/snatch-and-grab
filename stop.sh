#!/bin/sh
set -e

PIDFILE="data/mongod.lock"

if [ -f $PIDFILE ]; then
    kill -3 `cat $PIDFILE` || true
    sleep 3  # TODO: find a better way to wait for mongod to shut down 
fi
