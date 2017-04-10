#!/bin/sh

REACT=${REACT:-0.14}

echo "installing React $REACT"

npm prune

npm install react@$REACT \
react-dom@$REACT \
react-addons-test-utils@$REACT \
react-addons-create-fragment@$REACT \
@types/react

if [[ $REACT = "15.5" ]]; then
  npm install create-react-class@$REACT \
  prop-types@$REACT \
  react-test-renderer@$REACT
fi
