# Phase 04: Architecture — System Context & Modular Architecture

## 1. High-Level Architecture (Modular Monolith Blueprint)

Nexus follows a **Modular Monolith** architecture pattern to maintain high cohesion and low coupling across bounded contexts before considering microservice extraction.

```text
                               +-----------------------------+
                               |     Client Access Layer     |
                               | (Web Portals & Mobile Apps) |
                               +--------------+--------------+
                                              |
                                              | HTTPS / WSS
                                              v
                               +-----------------------------+
                               |    Security API Gateway     |
                               | (AuthN & Pre-Retrieval AuthZ)|
                               +--------------+--------------+
                                              |
       +--------------------------------------+--------------------------------------+
       |                                      |                                      |
       v                                      v                                      v
+--------------+                      +--------------+                      +--------------+
| Identity &   |                      | Messaging &  |                      | Project      |
| Access Module|                      | Workspace    |                      | Context Module|
+--------------+                      +--------------+                      +--------------+
       |                                      |                                      |
       +--------------------------------------+--------------------------------------+
                                              | Internal Domain Events
                                              v
                               +-----------------------------+
                               |   Integration & Sync Module |
                               |    (Jira & GitHub Handlers) |
                               +--------------+--------------+
                                              |
                                              v
                               +-----------------------------+
                               | PostgreSQL / Redis / Search |
                               +-----------------------------+
```
