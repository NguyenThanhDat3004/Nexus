# Nexus Backend Architecture — Polyglot Domain-Driven Microservices

Hệ thống Backend của Nexus được thiết kế theo phương pháp **Domain-Driven Design (DDD)** kết hợp **Polyglot Microservices** (Spring Boot cho nghiệp vụ lõi & bảo mật, NestJS cho I/O cao & realtime).

---

## 1. Cấu trúc tổng thể

```text
backend/
├── api-gateway/                      # NestJS: Cửa ngõ duy nhất (Routing, CORS, Rate Limit, Auth Guard)
│
├── domains/                          # Các Bounded Contexts độc lập (Domain-Driven Design)
│   ├── identity-access/              # [Spring Boot] SSO, Google OAuth, Mã PIN, Thiết bị, IP Blacklist
│   ├── workspace-management/         # [Spring Boot] Workspace (Training/Org), Project Key, Auto-close 14d
│   ├── collaboration-messaging/      # [NestJS] Chat WebSocket, Realtime Channels, Reactions
│   ├── notification/                 # [NestJS] Mail OTP, Security Alert, Push Notification Queue
│   └── external-integration/         # [NestJS] GitHub & Jira OAuth, Webhooks Listener
│
└── shared/                           # DTOs, Event Contracts & Shared Utilities
```

---

## 2. Nguyên tắc phát triển cho Đội ngũ (Team Guidelines)

1. **Giao tiếp qua API Gateway:** Frontend (React, Mobile) chỉ gọi duy nhất vào URL của Gateway (mặc định Port `8000`). Không gọi trực tiếp vào các cổng nội bộ của từng Domain.
2. **Database per Domain:** Mỗi Domain quản lý database/schema độc lập của riêng mình. Không được SELECT/JOIN chéo trực tiếp database của nhau.
3. **Phân chia nhánh Git (Branching Policy):**
   - Đạt (Identity & Access): `feature/identity-service`
   - Phúc (Collaboration & Notification): `feature/collaboration-service`
   - Huy (Workspace & API Gateway): `feature/workspace-service`
4. **Code độc lập:** Mỗi domain là một project độc lập có `pom.xml` (Java) hoặc `package.json` (Node) riêng biệt.
