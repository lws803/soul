# TODO list

- Start documenting the API in Swagger
- redesign confirmation and password reset emails to look nicer
- create documentation for this that's deployed to github pages, maybe start work on the live platform site as well
- add funding button to the repository
  - set up paypal or patreon for funding
- validate all features of this backend service and see if there are any security flaws or unused endpoints
- Store datetime in utc on the db and do the conversion when we get to the endpoint
- build a simple feed posting social app that uses soul network

## Feature work

- add announcements endpoint that will let platform owners/ super admins announce a **verified message**
- create a tiny user storage for metadata or achievement purposes within the user table
- consider implementing a different login method where users can login using their crypto wallets public key instead
- consider using SRP as a method to login as well
- maybe allow users to login still but with limited access if they don't verify their acc
