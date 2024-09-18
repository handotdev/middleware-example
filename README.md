# Docs Proxy

This repo contains the middleware setup to password protect your docs.

## Middleware

The custom vercel [middleware](middleware.ts) takes incoming requests, checks if a session cookie is present _& valid_ and then either forwards to the login page or proxies the request using some `fetch` trickery, where the Mintlify documentation is hosted.

