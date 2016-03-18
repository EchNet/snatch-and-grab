#!/bin/bash

set -x

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUCKET=s3://whwh

[ -f ~/.whwh.env ] && source ~/.whwh.env

cd $DIR/.. || exit 1

FILES=$( find logs -maxdepth 1 -name '*-*.log.*' -print )
if [ "$FILES" != "" ]; then
  for f in $FILES; do
    echo pushing $f to $BUCKET...
    s3cmd put $f $BUCKET/$f || exit 1
    rm $f
  done
fi
