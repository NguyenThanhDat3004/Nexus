# Hướng dẫn Phát triển theo Domain-Driven Design (DDD) cho Đội ngũ Nexus

Chào mừng các bạn đến với cấu trúc thư mục nghiệp vụ của **Nexus Backend**!  
Tài liệu này được biên soạn để thống nhất tư duy thiết kế, giúp cả team (**Đạt, Phúc, Huy**) phối hợp nhịp nhàng, code độc lập và không bao giờ gặp xung đột (conflict) mã nguồn.

---

## 1. Triết lý Cốt lõi: "Nghiệp vụ dẫn đường, Công nghệ theo sau"

Trong Domain-Driven Design (DDD):
* Thư mục dự án **không** chia theo tên framework (không chia theo kiểu `controllers/`, `services/`, `models/` dùng chung).
* Thư mục được chia theo từng **Bounded Context (Vùng biên nghiệp vụ độc lập)**.
* Mỗi Domain là một "vương quốc tự trị" sở hữu toàn bộ: **Logic nghiệp vụ + Cơ sở dữ liệu riêng + API riêng**.
* Việc Domain đó dùng **Spring Boot (Java)** hay **NestJS (TypeScript)** chỉ là chi tiết kỹ thuật bên trong, bên ngoài nhìn vào chỉ thấy các bài toán nghiệp vụ.

---

## 2. Bản đồ phân chia Bounded Contexts trong `domains/`

| Thư mục Domain | Công nghệ | Thành viên phụ trách | Trách nhiệm nghiệp vụ chính |
| :--- | :--- | :--- | :--- |
| **`identity-access/`** | Spring Boot 3+ | **Đạt** | SSO, Google OAuth, Mã PIN 4 số, Giới hạn 2 thiết bị (mobile/desktop), Session Redis, IP Blacklist, Chống IDOR. |
| **`workspace-management/`** | Spring Boot 3+ | **Huy** | Workspace (Training max 30 người có Redis lock / Org cần token duyệt), Project Key, Auto-archive sau 14 ngày, Kênh mặc định. |
| **`collaboration-messaging/`**| NestJS | **Phúc** | Chat realtime qua WebSocket, Threads, Reactions, Thẻ Context (Requirement, Decision, Confirmation), Đồng bộ Project Common Hub. |
| **`notification/`** | NestJS | **Phúc** | Mail OTP 1 phút, Mail cảnh báo bảo mật, Hàng đợi thông báo (Queue/Kafka), In-app Notification. |
| **`external-integration/`** | NestJS | **Huy** | Jira & GitHub OAuth2 (không dùng PAT), Webhook lắng nghe sự kiện, Chiếu trạng thái (Status Projection) lên tin nhắn. |

---

## 3. Cấu trúc 4 lớp chuẩn bên trong mỗi Domain (Clean / Hexagonal Architecture)

Dù domain của bạn viết bằng **Java (Spring Boot)** hay **TypeScript (NestJS)**, bạn đều bắt buộc phải tuân theo 4 tầng phân lớp từ trong ra ngoài:

```text
[Tên Domain]/src/
│
├── 1. domain/                 <--- [LÕI TRUNG TÂM]: Thuần khiết, KHÔNG phụ thuộc Framework
│   ├── entities/              # Các đối tượng thực thể mang logic nghiệp vụ (User, Pin, Workspace, Message)
│   ├── value-objects/         # Các giá trị bất biến, tự validate (Email, PinHash, ProjectKey, DeviceId)
│   ├── exceptions/            # Exception nghiệp vụ (DeviceLimitExceededException, InvalidPinException)
│   └── repositories/          # INTERFACES cổng giao tiếp dữ liệu (Chỉ khai báo hàm, KHÔNG viết code nối DB)
│
├── 2. application/            <--- [ĐIỀU PHỐI USE CASE]: Nơi thực thi các ca sử dụng
│   ├── use-cases/             # Mỗi file là 1 hành động: VerifyPinUseCase, CreateWorkspaceUseCase...
│   └── dtos/                  # Request / Response dữ liệu vào và ra của Use Case
│
├── 3. infrastructure/         <--- [CÔNG NGHỆ BÊN NGOÀI]: Nơi implement các chi tiết kỹ thuật
│   ├── persistence/           # Code thực tế nối DB (JPA Entities, Prisma, Spring Data, Mappers)
│   ├── redis/                 # Code giao tiếp Redis (Distributed Lock, Token Blacklist, Cache Session)
│   └── external-clients/      # Code gọi các bên thứ 3 (Cloudflare, Mail Sender, Jira API)
│
└── 4. interfaces/             <--- [CỔNG GIAO TIẾP ĐẦU VÀO]: Đón nhận request
    ├── http/ (controllers/)   # REST Controllers nhận request đã được điều phối từ API Gateway
    └── websocket/             # WebSocket / Socket.IO Gateways (cho Chat, Events)
```

---

## 4. 4 Nguyên tắc vàng khi viết code (Team Bắt buộc ghi nhớ)

### Nguyên tắc 1: Database-per-Domain (Không xâm phạm dữ liệu của nhau)
* **Tuyệt đối KHÔNG** viết câu lệnh SQL để `JOIN` trực tiếp bảng dữ liệu của Domain khác.
* Mỗi domain có database riêng (Flyway DDL của ai để ở `src/main/resources/db/migration/` của người đó).
* Nếu Domain Workspace cần lấy tên của User ➔ Gọi REST API sang `identity-access` hoặc lấy thông tin qua JWT Claims từ API Gateway.

### Nguyên tắc 2: Chiều phụ thuộc một chiều (Dependency Rule)
```text
interfaces (Controller) ──► application (Use Case) ──► domain (Entities)
                                                              ▲
infrastructure (DB/Redis) ────────────────────────────────────┘ (Implement Repo Interface)
```
* Tầng `domain` là vua, nằm ở trong cùng: **Không bao giờ import bất kỳ thư viện nào của Spring Web, NestJS, Prisma hay JPA** vào thư mục `domain/`.
* Tầng `domain` chỉ định nghĩa Interface: `public interface UserRepository { User findById(UUID id); }`.
* Tầng `infrastructure` mới là nơi implement: `public class PostgresUserRepository implements UserRepository { ... }`.

### Nguyên tắc 3: Giao tiếp giữa Frontend và Backend
* Đội Frontend (React, Mobile) **chỉ gọi duy nhất vào API Gateway (Port 8000)**.
* Các Domain chạy ở mạng nội bộ:
  * Gateway sẽ map `/api/v1/auth/*` ➔ `identity-access:8081`
  * Gateway sẽ map `/api/v1/workspaces/*` ➔ `workspace-management:8082`
  * Gateway sẽ map `/api/v1/chat/*` ➔ `collaboration-messaging:3001`

### Nguyên tắc 4: Phân chia nhánh Git (Zero Conflict)
* **Đạt:** Chỉ làm việc và commit file trong `domains/identity-access/` ➔ Nhánh `feature/identity-service`.
* **Phúc:** Chỉ làm việc trong `domains/collaboration-messaging/` và `domains/notification/` ➔ Nhánh `feature/collaboration-service`.
* **Huy:** Chỉ làm việc trong `domains/workspace-management/`, `external-integration/` và `api-gateway/` ➔ Nhánh `feature/workspace-service`.

*(Vì mỗi người làm việc trong thư mục riêng biệt của mình, khi tạo Pull Request merge vào `develop`, Git sẽ tự động hòa trộn 100% không bao giờ gặp lỗi xung đột code).*
