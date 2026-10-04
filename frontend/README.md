# Frontend Architecture (Monorepo Workspace)

Nexus Frontend is structured as a **Monorepo** to maximize reusability across Web Portals and Mobile Clients:

## 1. Web Applications (`web/`)
- `web/customer-portal/`: Web Portal for Clients & Product Sponsors (Requirements & Confirmations Dashboard)
- `web/delivery-portal/`: Web Portal for BAs, Developers, QA, DevOps (Full Messaging & Integration Tools)
- `web/admin-portal/`: System Administration Portal (Tenant Config, Security Audits, Integration Settings)

## 2. Mobile Companion Client (`mobile/`)
- `mobile/`: Mobile Application (iOS / Android React Native or Flutter) focused on Push Notifications & 1-Tap Customer Confirmations.

## 3. Shared Packages (`shared/`)
- `shared/ui/`: Shared UI Component Library & Design Tokens
- `shared/api-client/`: API Client & WebSocket Connection Handlers
- `shared/types/`: Shared TypeScript Interfaces & Data Models
