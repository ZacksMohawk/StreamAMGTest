#!/bin/bash
#chmod +x stop.sh

echo ==========[STOPPING STREAMAMGTEST]==========

#StreamAMGApp
pkill -f StreamAMGApp.js

#MessageConsumer
pkill -f MessageConsumer.js