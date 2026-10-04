# Phase 03: Domain Modeling — Bounded Contexts & Context Map

## 1. Identified Bounded Contexts

Nexus is designed using **Domain-Driven Design (DDD)** principles, structured into the following bounded contexts:

1. **Identity & Access Context:** Handles OAuth2/OIDC, authentication, RBAC/ABAC authorization rules, and session lifecycle.
2. **Organization & Project Context:** Manages tenant organizations, projects, teams, membership, and workspace isolation.
3. **Collaboration & Messaging Context:** Owns channels, direct messages, real-time message streams, threads, and reactions.
4. **Project Context & Confirmation Context:** Owns requirement tags, decision logs, customer confirmations, and cross-team bridging.
5. **Integration Context:** Manages Jira & GitHub OAuth connections, webhook handlers, external reference mappings, and status projections.
6. **Search & Knowledge Context:** Maintains authorization-aware derived search indexes and semantic context retrieval pipelines.
7. **Audit & Compliance Context:** Immutably records security events, break-glass actions, and administrative operations.

---

## 2. Context Map

```text
[Identity & Access] ──(Upstream / Supplier)──> [All Other Contexts]
                                                      │
[Organization & Project] ──(Upstream)─────────> [Collaboration Context]
                                                      │
[Collaboration Context]  ──(Customer Confirm)─> [Project Context & Confirmation]
                                                      │
[Project Context Engine] ──(Reference Link)───> [Integration Context] (Jira/GitHub)
                                                      │
[All Authorized Contexts] ──(Derived Data)────> [Search & Knowledge Context]
```
