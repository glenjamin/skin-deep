#!/bin/sh

REACT=${REACT:-0.14}

echo "installing React $REACT"

npm prune
npm install react@$REACT \
            react-addons-test-utils@$REACT \
            react-addons-create-fragment@$REACT
