# Service Manifest

> `/.well-known/uadp.json` &mdash; The entry point for every UADP service

## Overview

The service manifest is a single JSON file served at the well-known path `/.well-known/uadp.json` on any domain. It is the **only thing an AI agent needs** to discover, understand, and interact with a service. No SDK, no documentation page, no API reference &mdash; just one file.

## Full Manifest Schema

```json
{
  "service_id": "string (required)",
  "service_name": "string (required)",
  "uadp_version": "string (required)",
  "category": "string (required)",
  "description": "string (optional)",
  "base_url": "string (required)",
  "endpoints": [
    {
      "path": "string (required)",
      "method": "string (required)",
      "description": "string (required)",
      "auth_required": "boolean (required)",
      "params": "object (optional)",
      "response_type": "string (optional)"
    }
  ],
  "ai_hints": "object (required)"
}
```

## Field Reference

### Top-Level Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `service_id` | string | Yes | Unique identifier for the service (lowercase, no spaces). Example: `"nova"`, `"orbit"`, `"my-app"` |
| `service_name` | string | Yes | Human-readable name of the service. Example: `"Nova"`, `"Orbit Bank"` |
| `uadp_version` | string | Yes | Protocol version this manifest conforms to. Currently `"1.0"` |
| `category` | string | Yes | Service category using the `uadp:` prefix. See [Categories](#categories) |
| `description` | string | No | A short, human-readable description of the service |
| `base_url` | string | Yes | Base path for all UADP endpoints. Typically `"/uadp/v1"` |
| `endpoints` | array | Yes | List of available endpoints. See [Endpoint Objects](#endpoint-objects) |
| `ai_hints` | object | Yes | AI guidance object. See [AI Hints documentation](ai-hints.md) |

### Endpoint Objects

Each entry in the `endpoints` array describes one API endpoint:

| Field | Type | Required | Description |
|---|---|---|---|
| `path` | string | Yes | Full path including the base URL. Example: `"/uadp/v1/feed"` |
| `method` | string | Yes | HTTP method: `"GET"`, `"POST"`, `"PUT"`, `"DELETE"` |
| `description` | string | Yes | What this endpoint does, written for AI comprehension |
| `auth_required` | boolean | Yes | Whether a bearer token is needed to access this endpoint |
| `params` | object | No | Describes query parameters or body fields |
| `response_type` | string | No | The `uadp_type` this endpoint returns |

### Categories

Categories follow the `uadp:` namespace convention and can be nested with colons:

| Category | Description | Examples |
|---|---|---|
| `uadp:reading_social` | Text-based social networks | Twitter, Reddit, forums |
| `uadp:visual_social` | Image/video social networks | Instagram, Pinterest |
| `uadp:banking` | Financial services | Banks, neobanks, fintech |
| `uadp:commerce` | E-commerce platforms | Amazon, Shopify stores |
| `uadp:media:video` | Video platforms | YouTube, Vimeo |
| `uadp:media:music` | Music streaming | Spotify, Apple Music |
| `uadp:media:vod` | Movies & series streaming | Netflix, Disney+ |
| `uadp:messaging` | Instant messaging | WhatsApp, Telegram |
| `uadp:communication:email` | Email services | Gmail, Outlook |
| `uadp:news` | News and media | News portals, blogs |
| `uadp:transport:rideshare` | Ride-hailing services | Uber, Lyft |
| `uadp:food:delivery` | Food delivery | UberEats, DoorDash |
| `uadp:productivity:calendar` | Calendar and scheduling | Google Calendar, Outlook |

You can define custom categories for your domain. The convention is `uadp:domain:subdomain`.

## Complete Example

```json
{
  "service_id": "orbit",
  "service_name": "Orbit Bank",
  "uadp_version": "1.0",
  "category": "uadp:banking",
  "description": "Primary bank account with checking, savings, and investment products.",
  "base_url": "/uadp/v1",
  "endpoints": [
    {
      "path": "/uadp/v1/accounts",
      "method": "GET",
      "description": "List all user accounts (checking, savings, investment)",
      "auth_required": true,
      "response_type": "uadp:account"
    },
    {
      "path": "/uadp/v1/transactions",
      "method": "GET",
      "description": "Transaction history with pagination",
      "auth_required": true,
      "params": {
        "limit": "number (default: 20, max: 100)",
        "cursor": "string (pagination cursor)",
        "from": "ISO date string",
        "to": "ISO date string"
      },
      "response_type": "uadp:transaction"
    },
    {
      "path": "/uadp/v1/spending/analytics",
      "method": "GET",
      "description": "Spending breakdown by category for a given period",
      "auth_required": true
    },
    {
      "path": "/uadp/v1/transfer/initiate",
      "method": "POST",
      "description": "Initiate a bank transfer (requires confirmation)",
      "auth_required": true
    }
  ],
  "ai_hints": {
    "persona": "Orbit is a full-service bank offering checking, savings, and investment accounts.",
    "rendering": {
      "default_view": "account_summary",
      "currency_format": "MXN",
      "date_format": "relative"
    },
    "user_goals": [
      "Check my balance",
      "See recent transactions",
      "How much did I spend this month?",
      "Transfer money to someone"
    ],
    "safety_rules": [
      "Never display full account numbers — show only last 4 digits",
      "Always confirm before initiating transfers",
      "Mask CLABE numbers in all responses"
    ],
    "proactive_suggestions": [
      "If spending is 20% above monthly average, mention it",
      "If a large deposit was received, highlight it"
    ]
  }
}
```

## Serving the Manifest

The manifest must be served at exactly this path:

```
https://yourdomain.com/.well-known/uadp.json
```

### Requirements

- **Content-Type:** `application/json`
- **CORS:** Should allow `Access-Control-Allow-Origin: *` so agents on any domain can discover the service
- **No authentication:** The manifest itself must be publicly accessible (individual endpoints can require auth)
- **Cache:** Recommend `Cache-Control: public, max-age=3600` (1 hour) to balance freshness with efficiency

### Examples by Platform

**Static site (Nginx):**
```nginx
location /.well-known/uadp.json {
    alias /var/www/uadp.json;
    add_header Content-Type application/json;
    add_header Access-Control-Allow-Origin *;
}
```

**Express.js:**
```javascript
app.get('/.well-known/uadp.json', (req, res) => {
  res.json(manifest);
});
```

**Next.js (App Router):**
```
public/.well-known/uadp.json
```

**Django:**
```python
urlpatterns = [
    path('.well-known/uadp.json', serve_uadp_manifest),
]
```

## Next Steps

- [Endpoints](endpoints.md) &mdash; How to structure your UADP endpoints
- [AI Hints](ai-hints.md) &mdash; Deep dive into the `ai_hints` object
- [Authentication](authentication.md) &mdash; Implementing the auth flow
