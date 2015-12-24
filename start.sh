#!/bin/bash

command -v redis-server >/dev/null 2>&1 || { echo "redis-server required but not found.  Aborting."; exit 1; }

redis-server >>logs/redis-server.log 2>&1 &
