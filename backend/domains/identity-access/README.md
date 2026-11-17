# Domain: Identity & Access Management (IAM)

- **Port nội bộ:** `8081`
- **Công nghệ:** Java 17+ / Spring Boot 3+ / PostgreSQL / Redis
- **Phụ trách chính:** Đạt

## Nghiệp vụ sở hữu (Domain Capabilities):
1. **Xác thực (Authentication):**
   - Đăng nhập SSO & Google OAuth (OIDC).
   - Đăng ký tài khoản, sinh mật khẩu ngẫu nhiên dưới DB.
   - Xác thực OTP qua email (Redis hiệu lực 1 phút).
2. **Bảo mật & Định danh (Security & Credentials):**
   - Khởi tạo và xác thực Mã PIN 4 số (băm SHA/BCrypt).
   - Quy tắc bắt buộc đổi mã PIN sau 4 tháng.
   - Quản lý thiết bị: Tối đa 2 thiết bị (1 mobile, 1 desktop), quá 2 thiết bị yêu cầu nhập PIN để xóa bớt.
   - Quản lý phiên (Session Management): Thoát tab = đăng nhập lại, idle timeout trên Redis (10p với Google, 1h với SSO).
   - Chống Brute-force & Phát hiện đăng nhập bất thường đa IP: Đăng nhập fail > 2 lần đưa vào IP Blacklist.
   - Phân quyền (RBAC/ABAC) và chống IDOR.

## Cấu trúc thư mục (DDD 4 lớp):
```text
identity-access/
├── pom.xml
└── src/
    └── main/
        ├── java/com/nexus/identity/
        │   ├── domain/               # Entities, Value Objects, Domain Exceptions, Repo Interfaces
        │   ├── application/          # Use Cases, Commands, Queries, DTOs
        │   ├── infrastructure/       # JPA Entities, Redis Adapters, Security Config
        │   └── interfaces/           # REST Controllers
        └── resources/
            ├── application.yml
            └── db/migration/         # Flyway DDL Scripts (V1__init_users.sql, V2__init_pins.sql...)
```
