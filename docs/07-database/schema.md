# Phase 06: Database & API Specification — Data Schema Overview

## 1. Core Entity Relationship Diagram (ERD Concepts)

```text
[Organization] 1 ──── * [Project]
  │                       │
  1                       1
  *                       *
[User] ── * ── [ProjectMember] ── 1 ── * [Channel]
                                            │
                                            1
                                            *
                                        [Message] 1 ──── * [ContextTag] (Requirement/Decision/Confirmation)
                                            │
                                            1
                                            *
                                        [ExternalReference] (Jira Issue / GitHub PR)
```

---

## 2. Key Table Schemas (Conceptual SQL DDL)

### `organizations`
- `id`: UUID (PK)
- `name`: VARCHAR(255)
- `created_at`: TIMESTAMPTZ

### `projects`
- `id`: UUID (PK)
- `organization_id`: UUID (FK -> organizations.id)
- `name`: VARCHAR(255)
- `key`: VARCHAR(32)

### `messages`
- `id`: UUID (PK)
- `channel_id`: UUID (FK -> channels.id)
- `sender_id`: UUID (FK -> users.id)
- `content`: TEXT
- `created_at`: TIMESTAMPTZ

### `context_tags`
- `id`: UUID (PK)
- `message_id`: UUID (FK -> messages.id)
- `tag_type`: VARCHAR(50) -- 'REQUIREMENT', 'DECISION', 'CUSTOMER_CONFIRMATION'
- `confirmed_by`: UUID (FK -> users.id, Nullable)
- `confirmed_at`: TIMESTAMPTZ

### `external_references`
- `id`: UUID (PK)
- `message_id`: UUID (FK -> messages.id)
- `provider`: VARCHAR(50) -- 'JIRA', 'GITHUB'
- `external_id`: VARCHAR(255)
- `url`: TEXT
- `status_projection`: VARCHAR(100)
- `last_synced_at`: TIMESTAMPTZ
