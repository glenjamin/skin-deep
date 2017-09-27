#!/bin/sh

REACT=${REACT:-16.0}

echo "installing React $REACT"

npm prune

npm install react@$REACT \
    react-dom@$REACT \
    @types/react

if node_modules/.bin/semver -r '>= 15.5.0' "$REACT.0"; then
    npm install create-react-class@15 \
        prop-types@15 \
        react-addons-create-fragment@15 \
        react-test-renderer@$REACT
else
    npm install react-addons-test-utils@$REACT \
        react-addons-create-fragment@$REACT
fi
