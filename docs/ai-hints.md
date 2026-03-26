# AI Hints

> The `ai_hints` object &mdash; The heart of what makes UADP unique

## Overview

The `ai_hints` object is what separates UADP from every other API protocol. While OpenAPI tells agents *what* endpoints exist and GraphQL lets agents *query* data, **`ai_hints` tells agents *how to think about* the service** &mdash; what users typically want, how to display data, what safety rules to follow, and when to proactively surface information.

This is the key innovation of UADP: services don't just expose data, they teach agents how to use it intelligently.

## Why AI Hints Matter

Without hints, an agent interacting with a banking service has to guess:
- Should it show the full account number? (No &mdash; security risk)
- Should it format amounts in USD or MXN? (Depends on the account)
- When should it proactively alert the user? (High spending? Large deposits?)
- What do users usually want first? (Balance? Recent transactions?)

With `ai_hints`, the service **tells** the agent all of this. The agent doesn't need custom programming for each service &mdash; it reads the hints and behaves appropriately.

## Full Schema

```json
{
  "ai_hints": {
    "persona": "string",
    "rendering": {
      "default_view": "string",
      "date_format": "string",
      "currency_format": "string",
      "image_handling": "string"
    },
    "key_concepts": {
      "field_name": "explanation"
    },
    "user_goals": ["string"],
    "features": ["string"],
    "proactive_suggestions": ["string"],
    "platform_notes": ["string"],
    "safety_rules": ["string"],
    "privacy": ["string"]
  }
}
```

## Field Reference

### `persona`

**Type:** string
**Purpose:** A natural-language description of what the service is and does. This helps agents frame their responses in the right context.

```json
"persona": "Nova is a text-based social network for conversations about technology, culture, and daily life. Think of it as a public square where people share short-form thoughts."
```

**Best practices:**
- Write it as if explaining the service to a new user
- Include analogies to well-known services when helpful
- Keep it to 1-3 sentences
- Focus on the *experience*, not technical details

### `rendering`

**Type:** object
**Purpose:** Instructions for how agents should display data from this service.

```json
"rendering": {
  "default_view": "timeline",
  "date_format": "relative",
  "currency_format": "MXN",
  "image_handling": "thumbnails_prominent"
}
```

| Field | Description | Common Values |
|---|---|---|
| `default_view` | Primary layout for displaying items | `"timeline"`, `"list"`, `"grid"`, `"account_summary"`, `"conversation"` |
| `date_format` | How to display timestamps | `"relative"` (2h ago), `"absolute"` (Mar 15, 2025), `"both"` |
| `currency_format` | Currency for monetary values | `"MXN"`, `"USD"`, `"EUR"`, or ISO 4217 code |
| `image_handling` | How to treat images | `"thumbnails_prominent"`, `"inline"`, `"gallery"`, `"hidden"` |

### `key_concepts`

**Type:** object (string keys &rarr; string values)
**Purpose:** Explains domain-specific or non-obvious fields that an agent might not understand from the field name alone.

```json
"key_concepts": {
  "ext.nova.view_count": "Total number of times this post appeared in someone's feed (impressions, not unique views)",
  "ext.nova.thread_id": "Groups related posts into a conversation thread",
  "clabe": "Mexican standardized bank account number (18 digits) — similar to IBAN",
  "spei": "Mexico's real-time interbank transfer system"
}
```

**Best practices:**
- Only document fields that aren't self-explanatory
- Include real-world analogies for regional or domain-specific concepts
- Explain what the field means for the *user*, not just technically

### `user_goals`

**Type:** string[]
**Purpose:** The most common things users want to do with this service. Helps agents prioritize what information to show and what actions to suggest.

```json
"user_goals": [
  "Check my current balance",
  "See recent transactions",
  "How much did I spend this month?",
  "Transfer money to someone",
  "Find a specific transaction"
]
```

**Best practices:**
- Write in first person ("Check my..." not "Check the user's...")
- Order by frequency &mdash; most common goals first
- Include both informational goals ("See my feed") and action goals ("Post something")
- Keep to 3-8 goals

### `features`

**Type:** string[]
**Purpose:** Capabilities of the service that agents should know about.

```json
"features": [
  "Real-time feed updates via SSE",
  "Personalized content based on follow graph",
  "Full-text search across all posts",
  "Trending topics updated every 15 minutes"
]
```

### `proactive_suggestions`

**Type:** string[]
**Purpose:** Conditions under which the agent should surface information without being asked. This is powerful &mdash; it lets services define triggers for proactive behavior.

```json
"proactive_suggestions": [
  "If there are more than 10 unread notifications, mention it",
  "If spending this month is 20% above the monthly average, alert the user",
  "If a large deposit (>$10,000 MXN) was received in the last 24 hours, highlight it",
  "If an order status changed to 'delivered', notify the user"
]
```

**Best practices:**
- Be specific about thresholds and conditions
- Focus on things the user would want to know even if they didn't ask
- Don't overdo it &mdash; too many suggestions create noise

### `platform_notes`

**Type:** string[]
**Purpose:** Rendering instructions specific to certain platforms or display contexts.

```json
"platform_notes": [
  "On mobile, show only the first 3 items from the feed and offer to load more",
  "Thumbnails should be at least 300x300px for visual quality",
  "Video durations should be displayed as mm:ss, not total seconds",
  "When rendering in a sidebar, use compact view without images"
]
```

### `safety_rules`

**Type:** string[]
**Purpose:** Data-handling rules that agents **must** follow. These are non-negotiable constraints for security and user safety.

```json
"safety_rules": [
  "Never display full account numbers — show only last 4 digits",
  "Always confirm with the user before initiating any financial transfer",
  "Mask CLABE numbers in all responses — show only last 4 digits",
  "Never reveal the full credit card number, CVV, or expiration date",
  "Transaction amounts should always include the currency symbol"
]
```

**Best practices:**
- Be explicit and unambiguous
- Cover data masking, action confirmation, and display restrictions
- These rules should be strict enough that any reasonable agent will follow them
- Think about what could go wrong if an agent displayed raw data

### `privacy`

**Type:** string[]
**Purpose:** Privacy constraints that protect user data and communication.

```json
"privacy": [
  "Do not show message previews in notifications or summaries",
  "Do not summarize private conversations without explicit user consent",
  "Do not store or log the content of messages beyond the current session",
  "Never reveal the sender's real name in anonymous messages",
  "Location data should only be shown when the user explicitly asks for it"
]
```

## Complete Examples

### Banking Service (Orbit)

```json
{
  "ai_hints": {
    "persona": "Orbit is a full-service bank offering checking, savings, and investment accounts. Users trust it with their primary finances.",
    "rendering": {
      "default_view": "account_summary",
      "currency_format": "MXN",
      "date_format": "relative"
    },
    "key_concepts": {
      "clabe": "Mexican standardized bank account number (18 digits), similar to IBAN",
      "spei": "Mexico's real-time interbank transfer system",
      "balance_after": "Running balance after each transaction"
    },
    "user_goals": [
      "Check my balance",
      "See recent transactions",
      "How much did I spend this month?",
      "Transfer money"
    ],
    "features": [
      "Real-time balance updates",
      "Spending analytics by category",
      "Interbank transfers via SPEI"
    ],
    "proactive_suggestions": [
      "If spending is 20% above monthly average, mention it",
      "If a large deposit was received, highlight it",
      "If account balance is below $1,000 MXN, warn the user"
    ],
    "safety_rules": [
      "Never display full account numbers — show only last 4 digits",
      "Always confirm before initiating transfers",
      "Mask CLABE numbers in all responses"
    ],
    "privacy": [
      "Do not share transaction details with other services",
      "Do not log financial data beyond the current session"
    ]
  }
}
```

### Messaging Service (Echo)

```json
{
  "ai_hints": {
    "persona": "Echo is an instant messaging platform for personal and group conversations.",
    "rendering": {
      "default_view": "conversation_list",
      "date_format": "relative"
    },
    "user_goals": [
      "Check my unread messages",
      "Send a message to someone",
      "Find a specific conversation"
    ],
    "features": [
      "Group conversations",
      "Read receipts",
      "Media sharing"
    ],
    "proactive_suggestions": [
      "If there are unread messages from the last hour, mention them",
      "If a group conversation has 10+ unread messages, summarize the topic"
    ],
    "safety_rules": [
      "Never send a message without explicit user confirmation",
      "Do not auto-read messages — let the user decide"
    ],
    "privacy": [
      "Do not show message previews in notifications",
      "Do not summarize private conversations without explicit consent",
      "Never reveal message content to other services"
    ]
  }
}
```

## Writing Effective AI Hints

### Do's

- **Be specific:** "Show only last 4 digits" is better than "Be careful with account numbers"
- **Think like a user:** What would surprise or upset them if handled wrong?
- **Use real thresholds:** "If spending > 20% above average" not "If spending seems high"
- **Cover edge cases:** What should the agent do with empty feeds? Zero balances? Errors?

### Don'ts

- **Don't repeat endpoint docs:** The manifest already describes endpoints
- **Don't be too verbose:** Agents have context limits too
- **Don't include implementation details:** Hints are about behavior, not code
- **Don't make hints contradictory:** If `safety_rules` says "mask account numbers" but `rendering` says "show full details", the agent won't know what to do

## How Agents Should Process Hints

1. **Read the manifest** including `ai_hints` before making any data requests
2. **Apply `safety_rules` and `privacy`** as hard constraints &mdash; never violate them
3. **Use `user_goals`** to prioritize what to show when the user's intent is ambiguous
4. **Check `proactive_suggestions`** after each data fetch to see if any triggers are met
5. **Apply `rendering`** when formatting responses for display
6. **Reference `key_concepts`** when encountering unfamiliar fields

## Next Steps

- [Service Manifest](service-manifest.md) &mdash; Where `ai_hints` lives in the manifest
- [Security](security.md) &mdash; How safety rules fit into the broader security model
- [Endpoints](endpoints.md) &mdash; The data endpoints that hints describe
