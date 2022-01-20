# TODO list

- add email verification for new sign ups
  - integrate with redis https://firxworx.com/blog/coding/nodejs/email-module-for-nestjs-with-bull-queue-and-the-nest-mailer/
  - create a new background job to send that email
  - encode userid and expiry in one string
  - create new (`/verify`) endpoint to accept that
  - set user to active
  - do not allow users to login if they're not active yet, but allow them to sign up again
  - create password reset endpoint
- implement helmet for security
- add expires in field in access token and refresh token payload
- add announcements endpoint that will let platform owners/ super admins announce a **verified message**
- add logging on each request
- validate all features of this backend service and see if there are any security flaws or unused endpoints
- create a tiny user storage for metadata or achievement purposes within the user table
- allow folks to download their connections and data in one big json blob
- Deal with some TODOs leftover
- Add test to ensure that user can only perform actions within the specific platform and not other platforms
- Store datetime in utc on the db and do the conversion when we get to the endpoint
