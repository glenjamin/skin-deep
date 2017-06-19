#!/bin/sh

REACT=${REACT:-15.6}

echo "installing React $REACT"

npm prune

npm install react@$REACT \
    react-dom@$REACT \
    react-addons-test-utils@$REACT \
    react-addons-create-fragment@$REACT \
    @types/react

if (( $(echo "$REACT >= 15.5" | bc -l) )); then
    npm install create-react-class@$REACT \
        prop-types@15 \
        react-test-renderer@15
fi
