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

## Overriding env variables

Soul defaults to `.env.development` while running the app and `.env.test`
while running tests by default. To override these, please specify your overrides in
new `.env.development.local` and `.env.test.local` files.

## Troubleshooting

### Module can't be found despite being specified correctly

This can sometimes happen when the `dist` file is built incorrectly. To resolve this, simply delete
the `dist` file located in the root directory and run `npm run start` again.
