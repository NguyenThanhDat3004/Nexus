# Nexus Landing Page

Trang giới thiệu công khai, dùng chung cho mọi portal. Nằm ngoài các portal vì đối tượng là cả khách hàng lẫn đội delivery, và được deploy độc lập (domain gốc, ví dụ `nexus.example.com`), còn các portal chạy ở subdomain riêng.

- Không có route, không đăng nhập. Nút **Sign in** chỉ dẫn người dùng sang Customer Portal hoặc Delivery Portal (cấu hình qua `VITE_CUSTOMER_PORTAL_URL`, `VITE_DELIVERY_PORTAL_URL`).
- **Nhận diện riêng cho marketing, khác design system của các portal (có chủ đích):** chỉ dark mode, nền `#05060f`; tím `#7c6cff` (nhấn chính, glow), cyan `#22d3ee` (liên kết, đường nối con trỏ), hồng `#f472b6` (gradient, trạng thái chờ, lỗi), xanh lá `#34d399` (chỉ cho trạng thái đã xác nhận / thành công). Font Inter + JetBrains Mono, icon Lucide. Token nằm trong `src/styles.css`.
- Nút chính là nền sáng chữ tối có glow tím, vì chữ trắng trên `#7c6cff` không đạt WCAG AA.
- Hiệu ứng nền: canvas mạng lưới hạt (`ParticleField.tsx`), 3 quả cầu aurora, thanh tiến trình cuộn (CSS scroll timeline, có JS dự phòng cho trình duyệt chưa hỗ trợ). Tất cả tắt chuyển động khi người dùng bật reduced-motion; canvas dừng khi tab bị ẩn.
- Không phụ thuộc CDN: font tự host qua `@fontsource`, logo Jira/GitHub (Simple Icons, CC0) nằm ở `public/logos/`.
- Dùng `@nexus/ui` (`frontend/shared/ui`) cho `NexusLogo` và `Reveal`. Cách nối package xem `frontend/shared/ui/README.md`.

## Form "Request a demo" (mock-first)

Form gọi qua `src/lib/demoRequestClient.ts`, có hai implementation chuyển bằng `VITE_USE_MOCK_DEMO`:

| `VITE_USE_MOCK_DEMO` | Hành vi |
|---|---|
| `true` (mặc định) | Mock: trả thành công sau ~0.9s. Nhập email `fail@example.com` để xem trạng thái lỗi. |
| `false` | Gọi thật `POST {VITE_API_BASE_URL}/api/v1/demo-requests` |

Contract **đề xuất**, cần backend xác nhận trước khi tắt mock:

```http
POST /api/v1/demo-requests
Content-Type: application/json

{ "email": "an.nguyen@northwind.io", "company": "Northwind Payments" }
```

| Status | Ý nghĩa | Form hiển thị |
|---|---|---|
| `201` / `202` | Đã nhận | Màn hình "Request received" |
| `400` / `422` | `{ "errors": { "email"?: string, "company"?: string } }` | Lỗi dưới từng ô |
| `429` | Gửi quá nhiều | Thông báo thử lại sau |
| khác / lỗi mạng | | Thông báo lỗi chung |

## Chạy thử

```bash
cd frontend/web/landing-page
npm install
cp .env.example .env
npm run dev
# Mở http://localhost:5170
```
