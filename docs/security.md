# Security

> Security model, safety rules, privacy constraints, and threat considerations for UADP

## Overview

UADP implements a layered security model that combines traditional authentication with AI-specific safety mechanisms. The model recognizes that AI agents present unique security challenges &mdash; they can process and expose data at scale, make autonomous decisions, and interact with multiple services simultaneously.

UADP's security approach has two pillars:

1. **Traditional security** &mdash; Authentication, tokens, access control (who can access what)
2. **AI safety** &mdash; Safety rules, privacy constraints, rendering hints (how data should be handled)

## Security Layers

```
┌──────────────────────────────────────────┐
│  Layer 4: Privacy Constraints            │  What data can be shared/stored
│  (privacy rules in ai_hints)             │
├──────────────────────────────────────────┤
│  Layer 3: Safety Rules                   │  How data must be displayed
│  (safety_rules in ai_hints)             │
├──────────────────────────────────────────┤
│  Layer 2: Endpoint Access Control        │  Which endpoints need auth
│  (auth_required per endpoint)            │
├──────────────────────────────────────────┤
│  Layer 1: Authentication                 │  Who is making the request
│  (register → login → bearer token)       │
└──────────────────────────────────────────┘
```

## Layer 1: Authentication

See [Authentication](authentication.md) for full details.

**Summary:**
- Agents register once and receive a passkey
- Passkey + email are exchanged for a short-lived bearer token (1 hour)
- Tokens are HMAC-SHA256 signed JWTs
- All authenticated requests use `Authorization: Bearer {token}`

### Token Security Requirements

| Requirement | Details |
|---|---|
| **Algorithm** | HMAC-SHA256 (minimum) |
| **Expiration** | Maximum 1 hour, recommended |
| **Secret rotation** | Services should rotate signing secrets periodically |
| **Transport** | HTTPS required in production |
| **Storage** | Agents must not persist tokens beyond their expiration |

## Layer 2: Endpoint Access Control

Every endpoint declares its auth requirement in the manifest:

```json
{
  "endpoints": [
    { "path": "/uadp/v1/trending",       "auth_required": false },
    { "path": "/uadp/v1/feed",           "auth_required": true  },
    { "path": "/uadp/v1/transfer/start", "auth_required": true  }
  ]
}
```

### Classification Guidelines

| Data Type | Auth Required | Reasoning |
|---|---|---|
| Public content (trending, catalog, news) | No | No personal data |
| User-specific data (feed, inbox, balance) | Yes | Contains PII |
| Write operations (post, send, transfer) | Yes | Actions on behalf of user |
| Aggregated/anonymous data (stats) | No | No individual data |

### Defense: Unauthenticated Access

Public endpoints should never expose:
- User-specific data or preferences
- Personal information (emails, names, addresses)
- Financial data of any kind
- Private messages or communications

## Layer 3: Safety Rules

Safety rules are declared in `ai_hints.safety_rules` and represent **hard constraints** that agents must follow when handling data from the service.

### Categories of Safety Rules

#### Data Masking
```json
"safety_rules": [
  "Never display full account numbers — show only last 4 digits",
  "Mask CLABE numbers in all responses — show only last 4 digits",
  "Never reveal full credit card numbers, CVV, or expiration dates"
]
```

**Why:** Even though the API returns full data (for legitimate processing), the agent should never display it to the user in full. This prevents accidental exposure in chat logs, screenshots, or shared conversations.

#### Action Confirmation
```json
"safety_rules": [
  "Always confirm with the user before initiating any financial transfer",
  "Never send a message without explicit user confirmation",
  "Require double confirmation for transfers above $10,000 MXN"
]
```

**Why:** Agents can take actions autonomously. Safety rules ensure destructive or high-impact actions always have human approval.

#### Display Restrictions
```json
"safety_rules": [
  "Transaction amounts should always include the currency symbol",
  "Always show both the amount and the remaining balance after transactions",
  "Never display raw JSON to the user — always format for readability"
]
```

**Why:** Prevents ambiguity and misinterpretation of financial or sensitive data.

### Enforcement Model

Safety rules are enforced at the **agent level**. The service trusts the agent to comply with declared rules. This is a deliberate design choice:

- The service has already decided to expose the data via its API
- The rules guide how that data should be *presented*, not *accessed*
- The manifest makes rules explicit and machine-readable, so any compliant agent can follow them
- Future versions may include compliance verification mechanisms

## Layer 4: Privacy Constraints

Privacy rules are declared in `ai_hints.privacy` and govern how agents handle sensitive data across sessions and services.

```json
"privacy": [
  "Do not show message previews in notifications or summaries",
  "Do not summarize private conversations without explicit user consent",
  "Do not store or log message content beyond the current session",
  "Never reveal the sender's real name in anonymous messages",
  "Location data should only be shown when the user explicitly asks for it"
]
```

### Privacy vs. Safety Rules

| Aspect | Safety Rules | Privacy Constraints |
|---|---|---|
| **Focus** | How data is *displayed* | How data is *stored and shared* |
| **Scope** | Within a single interaction | Across sessions and services |
| **Examples** | Mask account numbers | Don't log message content |
| **Consequence** | Visual/display issue | Data leak or trust violation |

## Threat Model

### Threats UADP Addresses

| Threat | Mitigation |
|---|---|
| **Data over-exposure** | Safety rules constrain what agents display |
| **Unauthorized actions** | Auth tokens + confirmation rules |
| **Cross-service data leaks** | Privacy constraints limit data sharing |
| **Token theft** | Short-lived tokens (1 hour), HTTPS required |
| **Brute force auth** | Rate limiting on auth endpoints |
| **Stale tokens** | Expiration validation on every request |

### Threats Services Must Handle Independently

| Threat | Recommendation |
|---|---|
| **DDoS** | Standard rate limiting and CDN protection |
| **SQL injection** | Input validation (not UADP-specific) |
| **Man-in-the-middle** | HTTPS/TLS required in production |
| **Data breach** | Encryption at rest, access logging |
| **Malicious agents** | Monitor for rule violations, revoke passkeys |

### Agent Trust Model

UADP v1.0 operates on a **trust-based model**: services trust agents to follow declared rules. This is practical for the current ecosystem but has limitations:

- **Trusted agents** (built by reputable AI companies) will follow safety and privacy rules
- **Untrusted agents** could ignore rules and misuse data
- **Future mitigation:** Rule compliance verification, agent certification, audit logs

## Best Practices for Service Implementors

### Authentication
1. Use HTTPS in production &mdash; never serve tokens over HTTP
2. Generate passkeys with at least 128 bits of cryptographic randomness
3. Set token expiration to 1 hour maximum
4. Rotate signing secrets on a regular schedule
5. Rate limit auth endpoints (e.g., 10 attempts per minute)

### Data Handling
1. Return only the data the endpoint is supposed to return &mdash; don't leak extra fields
2. Validate all input parameters
3. Log access patterns for anomaly detection
4. Implement pagination limits to prevent data dumps

### Safety Rules
1. Define safety rules for any sensitive data your service exposes
2. Be specific &mdash; "show only last 4 digits" not "be careful with numbers"
3. Cover all sensitive fields, not just the obvious ones
4. Test that your rules make sense by reading them as an agent would

### Privacy
1. Define privacy rules for any personal or communication data
2. Explicitly state what should NOT be stored or shared
3. Consider cross-service scenarios &mdash; could data from your service be correlated with data from another?

## Best Practices for Agent Implementors

1. **Read all hints before making requests** &mdash; safety rules apply before you fetch data
2. **Treat safety_rules as hard constraints** &mdash; never override them
3. **Apply privacy rules across sessions** &mdash; if a service says "don't store," don't store
4. **Handle token expiration gracefully** &mdash; re-authenticate, don't fail
5. **Don't combine data across services without consent** &mdash; even if technically possible
6. **Log rule compliance** &mdash; be able to demonstrate that you follow declared rules

## HTTPS Requirements

| Environment | HTTPS Required | Notes |
|---|---|---|
| Production | **Yes** | All UADP traffic must use HTTPS |
| Development/Local | No | HTTP acceptable for `localhost` |
| Manifest endpoint | Recommended | Prevents manifest tampering |
| Auth endpoints | **Yes** | Tokens and credentials in transit |
| Data endpoints | **Yes** | User data in transit |

## Next Steps

- [Authentication](authentication.md) &mdash; Detailed auth flow and token format
- [AI Hints](ai-hints.md) &mdash; Full reference for safety rules and privacy constraints
- [Protocol Overview](protocol-overview.md) &mdash; How security fits into the overall architecture
