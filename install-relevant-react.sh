#!/bin/sh

REACT=${REACT:-0.13}

echo "installing React $REACT"

if [ "$REACT" = "0.13" ]; then
    npm prune
    npm install
    exit
fi

npm install 'react@>0.14.0-beta.0 <=0.14'
npm install 'react-dom@>0.14.0-beta.0 <=0.14'
npm install 'react-addons-test-utils@>0.14.0-beta.0 <=0.14'
npm install 'react-addons-create-fragment@>0.14.0-beta.0 <=0.14'
