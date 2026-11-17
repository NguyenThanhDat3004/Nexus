# Domain: Workspace & Project Management

- **Port nội bộ:** `8082`
- **Công nghệ:** Java 17+ / Spring Boot 3+ / PostgreSQL / Redis
- **Phụ trách chính:** Huy

## Nghiệp vụ sở hữu (Domain Capabilities):
1. **Workspace & Projects:**
   - Tạo Project kèm Key và Project Security Code (băm an toàn).
   - Kiểm tra trùng lặp Key + Site.
   - **Dự án Training:** Ai cũng tạo được, giới hạn tối đa 30 thành viên, dùng khóa phân tán Redis chống Race Condition, thêm thành viên = tính tiền.
   - **Dự án Tổ chức (Org Project):** Phải có Admin Approval Token trước khi tạo, thêm thành viên qua tổ chức, mail, file sheet (validate định dạng email).
   - Tự động đóng (Auto Archive) sau 14 ngày nếu không có cập nhật/hoạt động.
2. **Kênh liên lạc (Channels):**
   - Khởi tạo kênh mặc định (`Project Common Hub`, General, v.v.).
   - Cấu hình quyền và quy định của kênh (General không chat, các mục khác theo PM cấu hình).
3. **Quản lý hạn mức & Dung lượng (Quotas):**
   - Hạn mức workspace cá nhân (200MB), mở thêm = tính tiền.

## Cấu trúc thư mục (DDD 4 lớp):
```text
workspace-management/
├── pom.xml
└── src/
    └── main/
        ├── java/com/nexus/workspace/
        │   ├── domain/               # Workspace, Project, Channel entities, Quota rules
        │   ├── application/          # CreateWorkspaceUseCase, ArchiveInactiveProjectsUseCase
        │   ├── infrastructure/       # JPA Entities, Redis Lock Adapter, Schedulers
        │   └── interfaces/           # REST Controllers
        └── resources/
            ├── application.yml
            └── db/migration/         # Flyway DDL Scripts
```
