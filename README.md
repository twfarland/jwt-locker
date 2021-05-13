# jwt-locker

### Secure and user-friendly client-side jwt storage.

I made this library because I've come into many projects that get browser side usage of jwt wrong, both in security and in UX. People are storing tokens
in localStorage, which is prone to xss attacks, and refresh token handling
is often fumbled. Even AWS's own Amplify library doesn't get it right
as of now.

I read this excellent article: [The Ultimate Guide to handling JWTs on frontend clients (GraphQL)](https://hasura.io/blog/best-practices-of-using-jwt-with-graphql) and have adapted its recommendations for a more traditional rest flow.

To use this library, you pass it your implementation of login, logout, signup, and refresh token functions, and specify your auth api, and and apis that consume the auth. jwt-locker will wire it all up so the correct auth state is in play, refreshing.

Certain assumptions about the serverside implementation are made. For example you will need the login endpoint to set a refresh token cookie, and the refresh token endpoint will need to read from it. See this reference server implementation for more info.

Features

- Token is stored in memory, no localStorage (for xss protection)
- Seamless silent refresh
- During token refresh, outbound calls will be delayed until refresh is finished
- Auth api can be separated from protected apis
- Support short-lived jwt tokens with long-lived refresh tokens

Examples

- Axios basic
- Axios / React
- Axios / Svelte

Related repos

- Reference server
- Axios adapter
