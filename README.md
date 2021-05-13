# jwt-locker

### For secure and user-friendly client-side jwt auth flows.

I made this library because I've come into many projects that get browser side usage of jwt wrong, both in security and in UX. People are storing tokens in localStorage, which is prone to xss attacks, and refresh token handling is often fumbled. Even AWS's own Amplify library doesn't get it right as of now.

I read this excellent article: [The Ultimate Guide to handling JWTs on frontend clients (GraphQL)](https://hasura.io/blog/best-practices-of-using-jwt-with-graphql) and have adapted its recommendations to be transport layer agnostic.

To use this library, you pass it your implementation of login, logout, signup, and refresh token functions, and specify your auth api, and and apis that consume the auth. jwt-locker will wire it all up so the correct auth state is in play, refreshed silently behind the scenes.

Certain assumptions about the serverside implementation are made. For example you will need the login endpoint to set a refresh token cookie, and the refresh token endpoint will need to read from it. See this reference server implementation for more info (@todo).

Features

- Token is stored in memory, not localStorage (for xss protection).
- Seamless silent refresh. Token is refreshed just ahead of expiry, on new page load, and on 401 responses from protected apis.
- During token refresh, outbound calls will be delayed until refresh is finished.
- Auth api instance is separated from protected apis instances.
- Supports short-lived jwt tokens with long-lived refresh tokens (safe practice).
- Logout is synched across multiple tabs.

Examples @todo

- Axios basic
- Axios / React
- Axios / Svelte

Related repos @todo

- Reference server
- Axios adapter
