#!/bin/sh

REACT=${REACT:-0.14}

echo "installing React $REACT"

packages=$(cat <<-END
  react@$REACT
  react-dom@$REACT
  react-addons-test-utils@$REACT
  react-addons-create-fragment@$REACT
  @types/react
END
)

if [[ $REACT = "15.5" ]]; then
  packages=$(cat <<-END
  $packages
  create-react-class@$REACT
  prop-types@$REACT
  react-test-renderer@$REACT
END
)
fi

npm prune
npm install $packages
