# Phase 01: Business Analysis — Business Rules & Scope Boundaries

## 1. Core Business Scenario

```text
[Customer Conversation]
       │ "Payment timeout should increase from 5s to 15s."
       ▼
[BA Analysis & Clarification]
       │
       ▼
[Customer Formal Confirmation]
       │ Marked as: "Customer Confirmation"
       ▼
[Project Common / Cross-Team Hub]
       ├── Notification -> Backend Team
       └── Notification -> QA Team
       │
       ▼
[External Reference Linking]
       ├── Jira Issue: NEX-1024 (Source of Truth for Work Item)
       └── GitHub PR: #405 (Source of Truth for Code)
```

---

## 2. In-Scope vs Out-of-Scope Capabilities

### In-Scope (Nexus Core Responsibilities)
1. **Communication Layer:** Project Workspaces, Private Channels, Direct Messages, Threads, Reactions, Mentions.
2. **Project Context Layer:** Requirements tagging, Decision tracking, Customer Confirmation marking, Cross-Team Bridge.
3. **Integration Context:** Mapping & linking Jira Issues & GitHub PRs via metadata references.
4. **Permission & Security:** RBAC/ABAC authorization enforcing project/channel isolation before search & retrieval.

### Out-of-Scope (Explicit Non-Goals)
1. **Jira Replacement:** Work items, Kanban boards, sprint velocity management.
2. **GitHub Replacement:** Source code hosting, git repositories, PR code review tools.
3. **Document Management System (DMS):** Document versioning, rich PDF editing, file drive replacing SharePoint/Drive.
4. **ERP / HR / Payroll:** Human resources management, billing, employee salary calculations.

---

## 3. Fundamental Business Rules (BR)

- **BR-01 (Context Immutability):** Once a message is marked as a "Customer Confirmation", its content versioning and audit trail are immutably preserved.
- **BR-02 (Authorization Boundary):** Users can only search, view, or receive AI context for channels/projects they have explicit authorization to access.
- **BR-03 (Source of Truth Boundaries):** Nexus stores external references (`externalId`, `url`, `status`) for Jira/GitHub, but external systems remain authoritative for issue status and code changes.
- **BR-04 (Cross-Team Visibility):** Information shared in `Project Common Hub` is accessible across designated project teams, while team-private channels remain strictly isolated.
