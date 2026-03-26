# UADP Protocol Overview

> **Universal Agentic Data Protocol** &mdash; Version 1.0

## What is UADP?

UADP is a lightweight, open protocol that allows any service on the internet to become discoverable and consumable by AI agents through a single, standardized interface. It eliminates the need for custom API integrations by providing a universal contract between services and agents.

## Design Philosophy

### 1. Simplicity First

UADP is intentionally minimal. A service can become UADP-compatible by adding a single JSON file at a well-known path. No SDK required, no complex setup, no registration with a central authority.

### 2. Self-Describing Services

Every UADP service publishes a machine-readable manifest that tells agents everything they need to know: what endpoints exist, what data types they return, what authentication is needed, and &mdash; most importantly &mdash; how to intelligently use the service through `ai_hints`.

### 3. Decentralized by Design

There is no central registry, no gateway, and no middleware required. Any service on any domain can adopt UADP independently. Agents discover services the same way browsers discover favicons &mdash; by checking a well-known path on the domain.

### 4. Token Efficiency

UADP was designed with LLM token consumption in mind. Instead of scraping HTML pages (5,000-50,000+ tokens of noise), agents receive structured JSON with only the data they need (200-500 tokens). This represents a **60x reduction** in token usage.

## How It Works

```
Agent                          Service (any website)
  |                                  |
  |--- GET /.well-known/uadp.json -->|   1. Discover
  |<-- Manifest (endpoints, hints) --|
  |                                  |
  |--- POST /uadp/v1/auth/login --->|   2. Authenticate
  |<-- Bearer token ----------------|
  |                                  |
  |--- GET /uadp/v1/{endpoint} ---->|   3. Query
  |<-- UADP+JSON response ----------|
  |                                  |
```

### The Three Pillars

| Pillar | Description | Benefit |
|---|---|---|
| **Discovery** | `/.well-known/uadp.json` manifest on every domain | Agents find and understand services automatically |
| **Structured Data** | All responses use `uadp_type` and consistent JSON format | No parsing, no scraping, no guessing |
| **AI Guidance** | `ai_hints` tell agents how to think about the service | Intelligent behavior without custom programming |

## Protocol Layers

```
┌─────────────────────────────────────┐
│          AI Hints Layer             │  How to USE the data
│  (persona, goals, safety, render)   │
├─────────────────────────────────────┤
│          Data Layer                 │  Structured UADP+JSON
│  (uadp_type, cursor, ext)          │  responses
├─────────────────────────────────────┤
│          Auth Layer                 │  Token-based
│  (register, login, verify)         │  authentication
├─────────────────────────────────────┤
│          Discovery Layer            │  /.well-known/uadp.json
│  (manifest, endpoints, categories) │  manifest
└─────────────────────────────────────┘
```

## UADP vs. Existing Solutions

| Feature | REST/OpenAPI | GraphQL | Web Scraping | **UADP** |
|---|---|---|---|---|
| Self-describing | Partial (OpenAPI) | Yes (introspection) | No | **Yes** |
| AI-optimized | No | No | No | **Yes (ai_hints)** |
| Token efficient | Medium | Good | Very poor | **Excellent** |
| Zero config discovery | No | No | No | **Yes (.well-known)** |
| Decentralized | Yes | Yes | Yes | **Yes** |
| Safety/privacy rules | No | No | No | **Yes** |
| Adoption effort | High | High | None (but fragile) | **Minimal** |

## What UADP is NOT

- **Not a replacement for REST or GraphQL** &mdash; UADP can sit on top of existing APIs as a thin layer
- **Not a central registry** &mdash; There is no authority you need to register with
- **Not AI-model specific** &mdash; UADP works with any LLM, any agent framework, any language
- **Not just for APIs** &mdash; Any website with data can publish a UADP manifest, even if it doesn't have a traditional API

## Next Steps

- [Service Manifest](service-manifest.md) &mdash; Deep dive into the `/.well-known/uadp.json` spec
- [Endpoints](endpoints.md) &mdash; Standard endpoint patterns and response format
- [Authentication](authentication.md) &mdash; How auth works in UADP
- [AI Hints](ai-hints.md) &mdash; The heart of UADP: teaching agents how to think
- [Security](security.md) &mdash; Security model, safety rules, and threat considerations
