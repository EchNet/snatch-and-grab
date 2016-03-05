#!/bin/bash
#
# scrape.sh
#

set -x

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SITE=${1:-phony_site}

[ -f ~/.whwh.env ] && source ~/.whwh.env

cd $DIR/.. || exit 1
npm install || exit 1
s3cmd get --force s3://whwh/lists/$SITE.list data/$SITE.list || exit 1
node scraper --site=$SITE --in=data/$SITE.list --out=data/$SITE.data || exit 1
s3cmd mv s3://whwh/data/$SITE.data s3://whwh/data/$SITE.data.`date +%F`
s3cmd put data/$SITE.data s3://whwh/data/$SITE.data
