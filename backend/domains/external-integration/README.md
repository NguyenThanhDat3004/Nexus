# Domain: External Integration (Jira & GitHub)

- **Port nội bộ:** `3003`
- **Công nghệ:** Node.js / NestJS / Webhook Receiver
- **Phụ trách chính:** Huy

## Nghiệp vụ sở hữu (Domain Capabilities):
1. **OAuth Integration:**
   - Kết nối tài khoản người dùng với Jira và GitHub bằng chuẩn OAuth2 (không dùng Personal Access Token - PAT).
   - Lấy danh sách repository, issues của người dùng đã cấp quyền.
2. **Webhook Listeners & Status Projection:**
   - Lắng nghe sự kiện webhook từ Jira (Issue updated, Sprint changed) và GitHub (PR opened, commit pushed).
   - Chiếu trạng thái (Status projection) của Issue/PR trực tiếp lên thẻ tin nhắn trong Nexus mà không chiếm quyền sở hữu dữ liệu gốc.
