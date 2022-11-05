# <img src="resources/logo-with-word.png" width="300px" />

![pr-merge](https://github.com/soul-project/soul/actions/workflows/pr-merge.yml/badge.svg)
![e2e](https://github.com/soul-project/soul/actions/workflows/e2e.yml/badge.svg)
[![codecov](https://codecov.io/gh/soul-project/soul/branch/main/graph/badge.svg?token=GKWK7V5837)](https://codecov.io/gh/soul-project/soul)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/lws803)

## What is Soul?

Soul is an **authentication** and a **user relationships** service built into one. It is meant to abstract some of the most important parts
of a social media platform (i.e. user connections, relationships and authentication) into a separate service so that it can be shared
across different social media platforms as long as they are using soul to authenticate and build user connections.

### The Philosophy

We believe that connections and reputation are what defines a person, user or a **soul** in the cyberspace (maybe in the real world too 🤔).

This service attempts to outsource some parts of a social media platform. Newer platforms can be created and maintained without having to start from a fresh
user base. On the other hand, Soul members would not have to start from scratch in an entirely new social media platform as they would be able to
transfer their connections across all platforms which uses Soul to authenticate. You'll be moving across different worlds/ dimensions while preserving your
soul!

### TLDR

Don't let Facebook, Twitter, TikTok and Reddit monopolize the social media space,
start your own platform!

## Installation

Set up node using nvm and use project specific npm (optional)

```bash
nvm use
```

```bash
npm -g install npm@8.12.1
```

run MySQL

```bash
docker run --name soul-mysql -e MYSQL_ROOT_PASSWORD=root_password -d -p 3306:3306 mysql:latest
```

set up database

```bash
docker exec -it soul-mysql mysql -u root -p
```

```bash
mysql> CREATE DATABASE soul_db_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
```

```bash
mysql> CREATE DATABASE soul_db_test CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
```

install npm packages

```bash
npm install
```

run migrations (on soul_db_dev database)

```bash
DATABASE_URL="<YOUR_DATABASE_URL>" npm run migration:run
```

run Mailhog

```bash
docker run -d -p 1025:1025 -p 8025:8025 --name mailhog mailhog/mailhog
```

run Redis

```bash
docker run -d -p 6379:6379 --name redis redis
```

## Running the service locally

### local development

```bash
npm run start
```

### watch mode

```bash
npm run start:dev
```

### production mode

```bash
npm run start:prod
```

### Repl mode

```bash
npm run start -- --entryFile repl
```

## Tests

### unit tests

```bash
npm run test
```

### e2e tests

```bash
npm run test:e2e
```

### test coverage

```bash
npm run test:cov
```

## Overriding env variables

Soul defaults to `.env.development` while running the app and `.env.test`
while running tests by default. To override these, please specify your overrides in
new `.env.development.local` and `.env.test.local` files.

## Troubleshooting

### Module can't be found despite being specified correctly

This can sometimes happen when the `dist` file is built incorrectly. To resolve this, simply delete
the `dist` file located in the root directory and run `npm run start` again.
