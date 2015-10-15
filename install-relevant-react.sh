#!/bin/sh

REACT=${REACT:-0.14}

echo "installing React $REACT"

if [ "$REACT" = "0.13" ]; then
    npm remove react react-dom react-addons-test-utils react-addons-create-fragment
    npm install react
    exit
fi

npm prune
npm install
