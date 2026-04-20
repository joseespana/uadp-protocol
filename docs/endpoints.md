# Endpoints

> Standard endpoint patterns, request/response format, and pagination in UADP

## Overview

UADP endpoints follow consistent patterns that make them predictable for AI agents. All data endpoints live under the `base_url` declared in the manifest (typically `/uadp/v1/`) and return responses in UADP+JSON format.

## Endpoint Structure

```
/{base_url}/{resource}             GET     List / feed
/{base_url}/{resource}/:id         GET     Single item
/{base_url}/{resource}/create      POST    Create new item
/{base_url}/{resource}/search      GET     Search within resource
/{base_url}/auth/register          POST    Register agent
/{base_url}/auth/login             POST    Authenticate
/{base_url}/auth/verify            POST    Validate token
```

### Common Patterns

| Pattern | Method | Description | Example |
|---|---|---|---|
| `/{resource}` | GET | List or feed of items | `/uadp/v1/feed`, `/uadp/v1/orders` |
| `/{resource}/:id` | GET | Single item by ID | `/uadp/v1/order/ORD-1025` |
| `/{resource}/create` | POST | Create a new item | `/uadp/v1/post/create` |
| `/{resource}/search` | GET | Search with query param | `/uadp/v1/search?q=term` |
| `/{group}/{action}` | GET/POST | Grouped actions | `/uadp/v1/spending/analytics` |

## Request Format

### Query Parameters (GET requests)

All list endpoints support these standard query parameters:

| Parameter | Type | Description | Default |
|---|---|---|---|
| `limit` | number | Maximum items to return | 20 |
| `cursor` | string | Pagination cursor from previous response | `"0"` or `null` |
| `q` | string | Search query (on search endpoints) | &mdash; |

**Example:**
```http
GET /uadp/v1/feed?limit=10&cursor=20
Authorization: Bearer eyJ...
```

### Body (POST requests)

POST requests use JSON bodies:

```http
POST /uadp/v1/post/create
Content-Type: application/json
Authorization: Bearer eyJ...

{
  "body": "Hello from UADP!",
  "tags": ["uadp", "protocol"]
}
```

## Response Format &mdash; UADP+JSON

All responses follow a consistent structure depending on whether they return a list or a single item.

### List / Feed Response

```json
{
  "type": "uadp:feed",
  "cursor": "20",
  "items": [
    {
      "uadp_type": "uadp:post",
      "id": "nova:post:abc123",
      "ts": 1774302750,
      "body": "Just deployed my new project...",
      "author": {
        "id": "user:jose_espana",
        "name": "Jose Espana",
        "handle": "@jose_espana"
      },
      "likes": 142,
      "reposts": 23,
      "tags": ["bun", "elysia"],
      "ext": {
        "thread": "new_project_launch",
        "topics": ["bun", "backend", "typescript"]
      }
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `type` | string | Always present. Describes the response type (e.g., `"uadp:feed"`, `"uadp:list"`) |
| `cursor` | string or null | Cursor for the next page. `null` means no more pages |
| `items` | array | Array of items, each with a `uadp_type` field |

### Single Item Response

```json
{
  "uadp_type": "uadp:order",
  "id": "market:order:ORD-1025",
  "ts": 1774302750,
  "status": "delivered",
  "items": [
    { "title": "MacBook Pro M4", "qty": 1, "price": 52999.00 }
  ],
  "total": 52999.00,
  "currency": "MXN"
}
```

### Search Response

All search endpoints return a standardized `uadp:search_results` response:

```json
{
  "type": "uadp:search_results",
  "query": "macbook",
  "items": [
    {
      "uadp_type": "uadp:video",
      "id": "stream:vid:abc123",
      "ts": 1774302750,
      "title": "MacBook Pro M5 review: is it worth the upgrade?",
      "description": "Full review after 30 days...",
      "thumbnail_url": "https://picsum.photos/seed/vid_abc/1280/720",
      "views": 125000,
      "channel": { "name": "Tech Explained" }
    }
  ],
  "total": 42,
  "authenticated": true
}
```

| Field | Type | Description |
|---|---|---|
| `type` | string | Always `"uadp:search_results"` &mdash; agents can reliably check this |
| `query` | string | The original search query string |
| `items` | array | Primary result array. Each item has a `uadp_type` field |
| `total` | number | Total matching results (may be greater than `items.length`) |
| `groups` | object | Optional named sub-arrays for services returning multiple types |
| `authenticated` | boolean | Whether the request included a valid bearer token |

**Multi-type search** &mdash; Services like music (tracks + artists) or food delivery (orders + restaurants) include all results in `items` AND provide typed groups:

```json
{
  "type": "uadp:search_results",
  "query": "moon",
  "items": [ ...all results mixed... ],
  "total": 21,
  "groups": {
    "tracks": [ ...only tracks... ],
    "artists": [ ...only artists... ]
  }
}
```

The manifest's `search.response_schema` declares which keys and types are available.

### Error Response

```json
{
  "error": true,
  "code": "AUTH_REQUIRED",
  "message": "This endpoint requires authentication. Please provide a valid bearer token."
}
```

Standard error codes:

| Code | HTTP Status | Description |
|---|---|---|
| `AUTH_REQUIRED` | 401 | Endpoint requires authentication |
| `INVALID_TOKEN` | 401 | Token is expired or invalid |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_PARAMS` | 400 | Missing or invalid parameters |
| `RATE_LIMITED` | 429 | Too many requests |

## Pagination

UADP uses **cursor-based pagination** on all list endpoints.

### How It Works

```
Request 1:  GET /uadp/v1/feed?limit=10
Response:   { "cursor": "10", "items": [...] }

Request 2:  GET /uadp/v1/feed?limit=10&cursor=10
Response:   { "cursor": "20", "items": [...] }

Request 3:  GET /uadp/v1/feed?limit=10&cursor=20
Response:   { "cursor": null, "items": [...] }   ← last page
```

### Rules

1. **`cursor` is opaque** &mdash; Agents should not parse or modify cursor values. Just pass them back as-is.
2. **`null` means done** &mdash; When `cursor` is `null`, there are no more pages.
3. **`limit` is a suggestion** &mdash; Services may return fewer items than requested.
4. **Stable ordering** &mdash; Items should maintain consistent ordering across pages.

## UADP Types Reference

Every item in a UADP response has a `uadp_type` field that tells the agent what kind of data it is.

| `uadp_type` | Domain | Key Fields |
|---|---|---|
| `uadp:post` | Social (text) | `body`, `author`, `likes`, `reposts`, `tags` |
| `uadp:media_post` | Social (visual) | `media_url`, `thumbnail_url`, `body`, `author`, `likes` |
| `uadp:transaction` | Banking | `amount`, `direction`, `merchant`, `balance_after`, `category` |
| `uadp:account` | Banking | `type`, `balance`, `currency`, `account_number` |
| `uadp:order` | Commerce | `items[]`, `total`, `status`, `shipping_address` |
| `uadp:product` | Commerce | `title`, `price`, `category`, `rating`, `image` |
| `uadp:video` | Media | `title`, `channel`, `views`, `duration_seconds`, `thumbnail_url` |
| `uadp:article` | News | `title`, `summary`, `body_markdown`, `category`, `read_time_min` |
| `uadp:conversation` | Messaging | `members`, `last_message`, `unread_count` |
| `uadp:message` | Messaging | `body`, `author`, `ts`, `read` |
| `uadp:email` | Email | `subject`, `from`, `body_text`, `read`, `starred`, `attachments` |
| `uadp:track` | Music | `title`, `artist`, `album`, `duration_seconds` |
| `uadp:title` | VOD | `title`, `genre`, `rating`, `poster_url`, `type` |
| `uadp:ride` | Transport | `origin`, `destination`, `fare`, `driver`, `ride_type` |
| `uadp:food_order` | Food | `restaurant`, `items`, `total`, `delivery_fee` |
| `uadp:calendar_event` | Calendar | `title`, `start_ts`, `end_ts`, `calendar`, `location` |

### Custom Types

Services can define custom types using their own namespace:

```json
{ "uadp_type": "myapp:ticket", "id": "...", "status": "open", "priority": "high" }
```

Convention: use `{service_id}:{type_name}` for custom types.

## The `ext` Object &mdash; Cross-Service Linking

The `ext` field enables semantic connections between items across different services:

| Field | Type | Description |
|---|---|---|
| `ext.thread` | string | Groups related items across services into a narrative |
| `ext.topics` | string[] | Tags for semantic discovery across services |
| `ext.{service}.{field}` | any | Service-specific extended fields |

See the main [README](../README.md#cross-service-data-linking) for detailed examples.

## Next Steps

- [Service Manifest](service-manifest.md) &mdash; How to declare your endpoints in the manifest
- [Authentication](authentication.md) &mdash; Protecting endpoints with UADP auth
- [AI Hints](ai-hints.md) &mdash; Teaching agents how to use your endpoints
