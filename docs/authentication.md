# Authentication

> Token-based auth flow, endpoint-level access control, and token format in UADP

## Overview

UADP uses a simple, token-based authentication model designed for AI agent interactions. The flow is intentionally straightforward: register once, login to get a token, and use that token for authenticated requests.

Authentication in UADP is **optional per endpoint**. Each endpoint in the manifest declares `auth_required: true | false`, so agents know upfront which endpoints need a token and which are public.

## Authentication Flow

```
Agent                              Service
  |                                   |
  |--- POST /auth/register --------->|   1. Register (one-time)
  |<-- { passkey: "ak_..." } --------|
  |                                   |
  |--- POST /auth/login ------------>|   2. Login
  |    { email, passkey }             |
  |<-- { token: "eyJ...", exp } -----|
  |                                   |
  |--- GET /feed ------------------->|   3. Use token
  |    Authorization: Bearer eyJ...   |
  |<-- UADP+JSON response ----------|
  |                                   |
  |--- POST /auth/verify ----------->|   4. Verify (optional)
  |    { token }                      |
  |<-- { valid: true, user } --------|
```

## Auth Endpoints

All auth endpoints live under `{base_url}/auth/`:

### POST `/uadp/v1/auth/register`

Registers a new agent with the service. Called once per agent-service pair.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "passkey": "ak_7f3d9a2b1e4c8f6d",
  "message": "Store this passkey securely. You will need it to log in."
}
```

**Notes:**
- The passkey is analogous to an API key &mdash; it identifies the agent
- Services should generate cryptographically random passkeys
- The passkey should be stored securely by the agent and never exposed to end users

### POST `/uadp/v1/auth/login`

Authenticates and returns a bearer token.

**Request:**
```json
{
  "email": "user@example.com",
  "passkey": "ak_7f3d9a2b1e4c8f6d"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

**Notes:**
- Tokens are short-lived (recommended: 1 hour)
- Agents should re-authenticate when tokens expire
- Failed login attempts should return `401` with an error response

### POST `/uadp/v1/auth/verify`

Validates a token without making a data request. Useful for agents to check if their token is still valid before making multiple requests.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (valid):**
```json
{
  "valid": true,
  "user": {
    "id": "user:alejandro_vega",
    "email": "alejandro@vega.mx"
  },
  "expires_at": 1774303600
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "error": "Token expired"
}
```

## Token Format

UADP tokens use HMAC-SHA256 signed JWTs with the following payload:

```json
{
  "sub": "user:alejandro_vega",
  "email": "alejandro@vega.mx",
  "iat": 1774300000,
  "exp": 1774303600,
  "scope": "all"
}
```

| Field | Description |
|---|---|
| `sub` | User identifier |
| `email` | User's email address |
| `iat` | Issued-at timestamp (Unix) |
| `exp` | Expiration timestamp (Unix) |
| `scope` | Access scope (currently `"all"`, future versions may support granular scopes) |

### Token Signing

- **Algorithm:** HMAC-SHA256 (HS256)
- **Secret:** Service-specific, never shared
- **Validation:** Services must validate both signature and expiration on every authenticated request

## Endpoint-Level Access Control

Every endpoint in the manifest declares whether it requires authentication:

```json
{
  "endpoints": [
    { "path": "/uadp/v1/trending",    "method": "GET",  "auth_required": false },
    { "path": "/uadp/v1/feed",        "method": "GET",  "auth_required": true  },
    { "path": "/uadp/v1/post/create", "method": "POST", "auth_required": true  }
  ]
}
```

### Guidelines

| Endpoint Type | Auth Required | Rationale |
|---|---|---|
| Public data (trending, catalog) | `false` | No user-specific data |
| User feeds, history | `true` | Contains personal data |
| Write operations (create, send) | `true` | Actions on behalf of user |
| Search (public content) | `false` | No personal data exposed |
| Search (user-scoped) | `true` | Results filtered by user |

## Using Tokens in Requests

Tokens are passed via the standard `Authorization` header:

```http
GET /uadp/v1/feed?limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

### Error Responses

When auth fails, services return standard error responses:

**Missing token:**
```json
{
  "error": true,
  "code": "AUTH_REQUIRED",
  "message": "This endpoint requires authentication. Include a Bearer token in the Authorization header."
}
```

**Invalid/expired token:**
```json
{
  "error": true,
  "code": "INVALID_TOKEN",
  "message": "The provided token is invalid or has expired. Please re-authenticate."
}
```

## Agent Auth Best Practices

1. **Store passkeys securely** &mdash; Passkeys are long-lived credentials. Treat them like API keys.
2. **Cache tokens** &mdash; Don't re-authenticate on every request. Use the token until it expires.
3. **Handle 401 gracefully** &mdash; If a request returns 401, re-authenticate and retry.
4. **Check `auth_required` first** &mdash; Read the manifest before making requests. Don't send tokens to public endpoints unnecessarily.
5. **Use `/auth/verify` for batches** &mdash; Before making many requests, verify the token is still valid.

## Service Implementation Best Practices

1. **Use cryptographically random passkeys** &mdash; At least 128 bits of entropy.
2. **Short-lived tokens** &mdash; 1 hour is recommended. Never issue tokens that don't expire.
3. **Validate on every request** &mdash; Always check both signature and expiration.
4. **Rate limit auth endpoints** &mdash; Protect against brute force attacks on login.
5. **Log auth events** &mdash; Track registrations, logins, and failed attempts.

## Future: Scoped Access

UADP v1.0 uses a single `"scope": "all"` for simplicity. Future versions may support granular scopes:

```json
{
  "scope": ["read:feed", "write:posts", "read:profile"]
}
```

This would allow agents to request only the permissions they need, following the principle of least privilege.

## Next Steps

- [Endpoints](endpoints.md) &mdash; How to structure your UADP endpoints
- [AI Hints](ai-hints.md) &mdash; Teaching agents about safety and privacy rules
- [Security](security.md) &mdash; Full security model and threat considerations
