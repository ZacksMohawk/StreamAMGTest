# StreamAMG
## StreamAMGTest

## Overview

Application architecture for managing metadata

## How To Install

	./deploy.sh

## How To Configure

No mandatory configuration needed. The config.ini of each component can be tweaked if required, but everything will run straight out of the box

## How To Run

This runs all applications in "no persistence" mode, which starts with a completely fresh (ie. empty) data set, to ensure consistency of testing - and also protects against destructive changes to persistent data

	./start.sh noPersistence

## How To Stop

Since the applications are run as background processes, just stopping with Ctrl-C in the terminal is not enough. You will need to run the stop script to terminate all relevant application instances

	./stop.sh

## How To Test

You will need to install TestNet (https://github.com/ZacksMohawk/TestNet). Please follow the quick installation intructions in the TestNet README file. Once installed, open a fresh terminal and navigate to your StreamAMGTest root folder, then run the following

	testnet

This will give you the option to run the tests. Please make sure you are running the application(s) in "no persistence" mode - as outlined above - before continuing with the tests



## Architecture

Please see 'Architecture Diagram' image in the root folder of this repo

For ease of demonstrating functionality, and promoting a rapid local development environment, the deploy.sh script is there to be expanded upon when deployments to the cloud are to be made. In early incarnations of this architecture, perhaps without CI/CD pipelines fully built, this script might include AWS CLI commands for efficient remote deployment

The main StreamAMGApp could be deployed in an EC2 container, or multiple instances, according to the number of requests being handled, all managed by a load balancer

Alternatively, the functionality contained within could be broken down into individual Lambda functions, although careful consideration of how this would affect the development lifecycle would need to be given


## Notes

The reason for choosing Node.js as the tech for this task is the speed at which prototypes can be rapidly spun up. Also, the number of instances of Node.js apps that can be run simultaneously on any given laptop is very high, which is crucial when trying to produce a proof of concept for a potentially large architecture

The reason for skipping the more basic unit tests within the Node.js application at this point, and going straight to automated testing with an external application, is that it guarantees consistent testing against an API that is likely to be refactored or removed entirely in favour of a different tech. Also, running tests externally makes more sense when testing an entire architecture