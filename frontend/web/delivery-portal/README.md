# Nexus Frontend Architecture — Monorepo Portals & Shared Packages

Frontend của Nexus được tổ chức theo **Monorepo** (ba portal web, một mobile companion và các package dùng chung), xây dựng bằng **React + TypeScript + Tailwind CSS**. Nguyên tắc xuyên suốt phía FE: một design system dùng chung cho mọi portal, và phát triển **mock-first** — màn hình dựng trước trên dữ liệu giả lập nên FE chạy độc lập, không phải chờ backend mới phát triển và demo được giao diện.

---

## 1. Cấu trúc tổng thể

```text
frontend/
├── web/                              # Các portal trên trình duyệt (React + TypeScript + Tailwind CSS)
│   ├── customer-portal/              # Portal khách hàng & sponsor: xem Requirements, xác nhận Decisions
│   ├── delivery-portal/              # Portal nhóm delivery (BA, Dev, QA, DevOps): đăng nhập, messaging, tích hợp
│   └── admin-portal/                 # Portal quản trị: cấu hình tenant, audit bảo mật, cài đặt tích hợp
│
├── mobile/                           # Mobile companion (React Native): thông báo đẩy & xác nhận 1 chạm
│
└── shared/                           # Package dùng chung cho phía FE — các portal không import trực tiếp lẫn nhau
    ├── ui/                           # Design system: component dùng chung & design tokens
    ├── api-client/                   # Lớp gọi dữ liệu dùng chung (REST client & WebSocket handlers)
    └── types/                        # Interface & model TypeScript dùng chung cho mọi portal
```

Trong mỗi portal, code tổ chức thống nhất:

```text
<portal>/
├── index.html
├── vite.config.ts
└── src/
    ├── pages/                        # Màn hình theo route
    ├── components/                   # Component dùng lại trong portal
    ├── lib/                          # Client, types, helpers của portal
    └── styles.css                    # Tailwind + @theme (design tokens riêng của Nexus)
```

---

## 2. Nguyên tắc phát triển cho Đội ngũ (Team Guidelines)

1. **Design system là nguồn sự thật của giao diện:** Mọi portal dùng component và design token từ `shared/ui`. Bảng màu khóa xanh & trắng — deep `#0A2E6E`, royal `#2563EB`, sky `#38BDF8` — khai báo một lần ở `@theme` trong `styles.css`; font Inter; icon Lucide. Không tự chế thêm màu hay kiểu icon ngoài hệ thống, không dùng icon kiểu emoji trong giao diện.
2. **Dùng chung qua&#32;`shared/`, portal không import lẫn nhau:** Component hay logic nào từ hai portal trở lên cùng cần thì đưa vào `shared/` (ui, api-client, types). Không copy code qua lại giữa các portal.
3. **Mọi lời gọi dữ liệu đi qua api-client:** Trang và component không gọi `fetch` trực tiếp; mọi request đặt trong lớp client (`lib/` của portal, sau này là `shared/api-client`). Địa chỉ backend cấu hình bằng biến môi trường `VITE_API_BASE_URL`, không hard-code trong code.
4. **Mock-first:** Mỗi tính năng dựng trên một interface client với hai implementation — mock và thật — chuyển bằng biến môi trường (ví dụ `VITE_USE_MOCK_AUTH`). Dữ liệu mock bám đúng contract đã thống nhất (route, tên field, mã lỗi) để khi nối API thật không phải sửa trang. Nhờ vậy FE phát triển và demo được kể cả khi backend chưa xong.
5. **Phân chia nhánh Git phía FE (Branching Policy):** Nhánh FE đặt theo mẫu `feature/fe-<tính-năng>`, mỗi tính năng/portal một nhánh, PR vào `develop`. Hiện có: `feature/fe-login-mock` — các màn hình login trong `delivery-portal` (Đạt phụ trách từ 20/11/2026).

---

## 3. Chạy thử một portal

```bash
cd frontend/web/delivery-portal
npm install
cp .env.example .env
npm run dev
# Mở http://localhost:5173
```

Mặc định các app chạy ở chế độ mock nên mở lên là dùng được ngay, không cần dựng thêm gì. Cách dùng chi tiết của từng app (tài khoản demo, panel hỗ trợ demo, kịch bản trình diễn) xem ở README của app đó.