# StreamAMG
## StreamAMGApp

## Overview

Application for handling creation, editing, retrieval and deletion of metadata JSON objects

## How To Install

	npm install

## How To Configure

No configuration required.

## How To Run

This runs the application in "no persistence" mode, which starts with a completely fresh (ie. empty) data set, to ensure consistency of testing - and also protects against destructive changes to persistent data

	node StreamAMGApp -noPersistence true

## How To Stop

Press Ctrl+C in your terminal window

## How To Test

Please see README in parent 'StreamAMGTest' folder for details on running full suite of tests (and reasons for doing it this way). There is still a basic unit test, which can be expanded upon if Node.js were to actually be the chosen tech for this architecture going forward, and this can be run via

	npm test
