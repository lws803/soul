# TODO list

- add redis and mailhog to e2e test yml
- add tests for new email confirmation system
  - maybe skip the validation process for e2e tests
- add expires in field in access token and refresh token payload
- add announcements endpoint that will let platform owners/ super admins announce a **verified message**
- add logging on each request
- validate all features of this backend service and see if there are any security flaws or unused endpoints
- create a tiny user storage for metadata or achievement purposes within the user table
- allow folks to download their connections and data in one big json blob
- Deal with some TODOs leftover
- Add test to ensure that user can only perform actions within the specific platform and not other platforms
- Store datetime in utc on the db and do the conversion when we get to the endpoint
