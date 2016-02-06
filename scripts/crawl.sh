#!/bin/bash

set -x

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SITE=${1:-phony_site}

[ -f ~/.whwh.env ] && source ~/.whwh.env

cd $DIR/.. || exit 1
npm install || exit 1
date
node crawler --site=$SITE --out=data/$SITE.list || exit 1
date
s3cmd mv s3://whwh/lists/$SITE.list s3://whwh/lists/$SITE.list.`date +%F`
s3cmd put data/$SITE.list s3://whwh/lists/$SITE.list
