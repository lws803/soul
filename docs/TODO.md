# TODO list

- add `description` to the env config `Joi` schema
- use `async afterAll` in tests so we don't need the `done` and `promise`
- add type strict enforcements for configService
- make ormconfig more dynamic - have it load overrides from *.local files if present
- use jest mock extended to mock proxy for some of the tests
  - install this lib https://www.npmjs.com/package/jest-mock-extended
- create documentation for this that's deployed to github pages, maybe start work on the live platform site as well
- add funding button to the repository
  - set up paypal or patreon for funding
- validate all features of this backend service and see if there are any security flaws or unused endpoints
- Store datetime in utc on the db and do the conversion when we get to the endpoint

## Feature work

- maybe allow users to login still but with limited access if they don't verify their acc
- add announcements endpoint that will let platform owners/ super admins announce a **verified message**
- create a tiny user storage for metadata or achievement purposes within the user table
- allow folks to download their connections and data in one big json blob
- build an admin dashboard for soul (self-hosted)
- consider implementing a different login method where users can login using their crypto wallets public key instead
- consider using SRP as a method to login as well
