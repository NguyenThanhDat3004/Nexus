# @nexus/ui

Component và tài sản dùng chung cho các app web của Nexus (theo nguyên tắc 2 trong README frontend: không copy code qua lại giữa các app).

| Export | Mô tả |
|---|---|
| `NexusLogo` | Logo chính thức (mark SVG + wordmark dạng text). Props: `size`, `markOnly`, `className`, `markClassName`, `wordmarkClassName`. |
| `Reveal` | Hiện nội dung khi cuộn tới (IntersectionObserver), tự tắt khi `prefers-reduced-motion`. |

## Dùng trong một app (Vite + Tailwind v4)

Chưa có npm workspaces, nên app trỏ thẳng tới mã nguồn:

1. `vite.config.ts`: alias `@nexus/ui` → `../../shared/ui/src`, `resolve.dedupe: ['react', 'react-dom']`, và thêm `../../shared` vào `server.fs.allow`.
2. `tsconfig.app.json` → `paths`: `@nexus/ui`, `react`, `react/*` (để file trong `shared/` tìm được type React của app).
3. CSS của app: `@source "../../../shared/ui/src";` để Tailwind quét class trong package.

Xem `frontend/web/landing-page` làm mẫu. Package chỉ dùng utility mặc định của Tailwind, không phụ thuộc token riêng của app nào.
