# Soul

## Description

Soul is an **authentication service** and a **user relationships service** grouped into one.

## Installation

```bash
# Install MySQL
$ brew install mysql

# Set up database
$ sudo mysql
mysql> CREATE DATABASE soul_db_dev;
mysql> CREATE DATABASE soul_db_test;

# Install npm packages
$ npm install

# Run migrations (on soul_db_dev database)
$ npm run migration:run

```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
