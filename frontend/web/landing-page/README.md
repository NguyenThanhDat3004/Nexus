# Nexus Landing Page

Trang giới thiệu công khai, dùng chung cho mọi portal. Nằm ngoài các portal vì đối tượng là cả khách hàng lẫn đội delivery, và được deploy độc lập (domain gốc, ví dụ `nexus.example.com`), còn các portal chạy ở subdomain riêng.

- Không có route, không gọi API, không đăng nhập. Nút **Sign in** chỉ dẫn người dùng sang Customer Portal hoặc Delivery Portal.
- Địa chỉ các portal cấu hình qua `.env` (`VITE_CUSTOMER_PORTAL_URL`, `VITE_DELIVERY_PORTAL_URL`).
- **Nhận diện riêng cho marketing, khác design system của các portal (có chủ đích):** chỉ dark mode, nền `#05060f`; tím `#7c6cff` (nhấn chính, glow), cyan `#22d3ee` (liên kết, đường nối con trỏ), hồng `#f472b6` (gradient, trạng thái chờ), xanh lá `#34d399` (chỉ cho trạng thái đã xác nhận). Font Inter + JetBrains Mono, icon Lucide. Token nằm trong `src/styles.css`.
- Nút chính là nền sáng chữ tối có glow tím, vì chữ trắng trên `#7c6cff` không đạt WCAG AA.
- Hiệu ứng nền: canvas mạng lưới hạt (`ParticleField.tsx`), 3 quả cầu aurora, thanh tiến trình cuộn. Tất cả tắt chuyển động khi người dùng bật reduced-motion; canvas dừng khi tab bị ẩn.
- Form "Request a demo" hiện chỉ giả lập gửi thành công (xem `TODO` trong `src/components/FinalCta.tsx`).

```bash
cd frontend/web/landing-page
npm install
cp .env.example .env
npm run dev
# Mở http://localhost:5170
```
