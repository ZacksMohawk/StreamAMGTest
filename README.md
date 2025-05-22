# StreamAMG
## StreamAMGTest

## Overview

Application architecture for managing metadata

## Prerequisites

If you intend to run the applications with persistence enabled, you will need a local instance of MongoDB, running on port 27017. If you have one running on a different port, or in a different location, this can be set in the config.ini file. You will also need a local instance of Redis running (if caching is enabled in config.ini), and a local instance of RabbitMQ

## How To Install

	./deploy.sh

## How To Configure

No mandatory configuration needed. The config.ini of each component can be tweaked if required, but everything will run straight out of the box

## How To Run

This runs all applications in "no persistence" mode, which starts with a completely fresh (ie. empty) data set, to ensure consistency of testing - and also protects against destructive changes to persistent data

	./start.sh noPersistence

To start all applications with persistence enabled, use the following

	./start.sh

## How To Stop

Since the applications are run as background processes, just stopping with Ctrl-C in the terminal is not enough. You will need to run the stop script to terminate all relevant application instances

	./stop.sh

## How To Test

You will need to install TestNet (https://github.com/ZacksMohawk/TestNet). Please follow the quick installation intructions in the TestNet README file. Once installed, open a fresh terminal and navigate to your StreamAMGTest root folder, then run the following

	testnet

This will give you the option to run the tests. Please make sure you are running the application(s) in "no persistence" mode - as outlined above - before continuing with the tests

There is also a Postman collection in the root folder of this repo, allowing you to play around with the API endpoints manually



## Architecture

Please see 'Architecture Diagram' image in the root folder of this repo

For ease of demonstrating functionality, and promoting a rapid local development environment, the deploy.sh script is there to be expanded upon when deployments to the cloud are to be made. In early incarnations of this architecture, perhaps without CI/CD pipelines fully built, this script might include AWS CLI commands for efficient remote deployment

The main StreamAMGApp could be deployed in an EC2 container, or multiple instances, according to the number of requests being handled, all managed by a load balancer

Alternatively, the functionality contained within could be broken down into individual Lambda functions, although careful consideration of how this would affect the development lifecycle would need to be given. This would be a tidy solution in terms of scalability though

With regards to the scalability of the other components in the architecture, we can take advantage of the autoscaling of Mongo, Redis etc. in AWS


## Notes

The reason for choosing Node.js as the tech for this task is the speed at which prototypes can be rapidly spun up. Also, the number of instances of Node.js apps that can be run simultaneously on any given laptop is very high, which is crucial when trying to produce a proof of concept for a potentially large architecture

The reason for skipping the more basic unit tests within the Node.js application at this point, and going straight to automated testing with an external application, is that it guarantees consistent testing against an API that is likely to be refactored or removed entirely in favour of a different tech. Also, running tests externally makes more sense when testing an entire architecture

The choice of MongoDB was for its flexibility in storing and handling data of varying sizes (eg. holding arrays of all different sizes in the categories field), and also its availability on multiple cloud platforms

Note also that I have not Dockerised any of the architecture because, from a speed-of-development perspective, it's preferred at this stage to be able to run and re-run things immediately

In the config.ini of StreamAMGApp, the Redis caching can be toggled on/off, so that performance gains during load testing can be measured

To observe that messages are being consumed by MessageConsumer application, view the log MessageConsumer.log, or tail it in realtime:

	tail -f MessageConsumer/MessageConsumer.log