#!/bin/bash
#chmod +x start.sh

echo ==========[STARTING STREAMAMGTEST]==========

#StreamAMGApp
cd StreamAMGApp
if [ "$1" = noPersistence ] ; then
	node StreamAMGApp.js -port 3000 -noPersistence true &
else
	node StreamAMGApp.js -port 3000 &
fi

#MessageConsumer
cd ../MessageConsumer
node MessageConsumer.js -port 4000 &