#!/bin/bash
#chmod +x deploy.sh

echo ==========[DEPLOYING STREAMAMGTEST]==========

#StreamAMGApp
cd StreamAMGApp
npm install
npm audit fix

#MessageConsumer
cd MessageConsumer
npm install
npm audit fix