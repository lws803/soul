# TODO list

- revoke a user's refresh token when changing roles
  - fix tests and add more tests
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
- create a way to validate TXT records for host urls provided during platform creation time
  - https://stackoverflow.com/questions/23495352/site-verification-through-dns-txt-record-in-node-js
  - turn this into a background task with a few attempts
  - only make platform active once TXT record is found
  - prevent users from logging in via platform if its not active yet
  - send an email letting the platform creator know once the record is found
- add unique constraint for platform host url
