# Nexus — External Integration Service

Service tích hợp GitHub + Jira cho Nexus: liên kết tài khoản qua OAuth2, lắng nghe
sự kiện qua webhook, chiếu trạng thái lên thẻ tin nhắn Nexus. Chạy ở cổng **3003**.

- Ngôn ngữ: Node.js + NestJS + TypeScript.
- **KHÔNG dùng PAT ở bất cứ đâu.** Mọi truy cập GitHub/Jira đều qua OAuth2.
- Vị trí trong repo Nexus: `backend/domains/external-integration/`.

## 0. Đạt và team cần làm trước

| Việc | Ai | Ở đâu |
|---|---|---|
| Đăng ký **GitHub OAuth App** | **Đạt** (chủ repo Nexus) | GitHub → Settings → Developer settings → OAuth Apps → New OAuth App. Homepage URL: `http://localhost:3003`. Authorization callback URL: `http://localhost:3003/integrations/github/callback`. Xong thì đưa `client_id` + `client_secret` cho Huy (qua env, không gửi qua chat nhóm). |
| Tạo **Jira OAuth 2.0 (3LO) app** | Huy (hoặc Đạt — ai có tài khoản Atlassian) | Atlassian Developer Console: https://developer.atlassian.com/console/myapps/ → Create → OAuth 2.0 (3LO). Thêm API **Jira platform REST API** với các scope trong `.env.example`. Callback URL: `http://localhost:3003/integrations/jira/callback`. **Không có API tạo app — phải tạo bằng tay trên trình duyệt.** |
| Quyết: có cho phép ghi trạng thái ngược sang Jira không? | **Team** | Endpoint `POST /integrations/jira/issues/{issueKey}/status` đang TẮT (`JIRA_WRITEBACK_ENABLED=false`) vì chạm tới Jira Automation phía Đạt. Chốt xong mới bật. |

## 1. Chạy local

```bash
cp .env.example .env   # điền client_id / client_secret / webhook secret
npm install
npm run start:dev      # chạy ở http://localhost:3003
```

Build kiểm tra:

```bash
npm run build
```

## 2. Biến môi trường

Xem đầy đủ trong `.env.example` (không commit file `.env` thật).

| Biến | Dùng để làm gì |
|---|---|
| `PORT`, `APP_BASE_URL` | Cổng service (3003) và URL gốc (webhook đăng ký trỏ về đây). |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | OAuth App của Đạt. Secret chỉ dùng ở server, không lộ ra frontend. |
| `GITHUB_REDIRECT_URI` | Phải trùng y hệt callback đã khai báo trên GitHub. |
| `GITHUB_OAUTH_SCOPES` | `repo read:user` — `repo`: đọc/ghi repo (kể cả private) + quản lý webhook; `read:user`: thông tin user. |
| `GITHUB_WEBHOOK_SECRET` | Secret ký webhook GitHub (tự sinh: `openssl rand -hex 32`). Phải trùng secret khai khi tạo webhook. |
| `JIRA_CLIENT_ID`, `JIRA_CLIENT_SECRET` | OAuth 2.0 (3LO) app trên Atlassian Developer Console. |
| `JIRA_REDIRECT_URI` | Phải trùng y hệt callback đã khai báo trên Atlassian. |
| `JIRA_SITE_URL` | Site Jira của team, vd `https://3004nguyenthanhdat.atlassian.net`. |
| `JIRA_OAUTH_SCOPES` | `read:jira-user read:jira-work write:jira-work manage:jira-webhook offline_access`. |
| `JIRA_WEBHOOK_SECRET` | Secret ký webhook **admin** Jira (xem mục 5). |
| `JIRA_WRITEBACK_ENABLED` | Mặc định `false`. Chỉ bật sau khi team chốt (mục 0). |

## 3. Luồng OAuth — nói ngắn gọn

### GitHub (OAuth App, authorization-code flow)

1. FE gọi `GET /integrations/github/authorize` → nhận `authorizeUrl` → redirect user sang đó.
2. User bấm đồng ý trên GitHub → GitHub redirect về `GET /integrations/github/callback?code=...&state=...`.
3. Server đổi `code` lấy access token ở `POST https://github.com/login/oauth/access_token` (code sống 10 phút).
4. Token lưu vào TokenStore. Sau đó gọi API GitHub bằng `Authorization: Bearer <token>`.

### Jira (OAuth 2.0 3LO — giống GitHub nhưng thêm 1 bước)

1. `GET /integrations/jira/authorize` → redirect sang `https://auth.atlassian.com/authorize?audience=api.atlassian.com&...&prompt=consent`.
2. User đồng ý → Atlassian redirect về `/callback?code=...&state=...`.
3. Server đổi code lấy token ở `POST https://auth.atlassian.com/oauth/token`.
4. **Bước riêng của Atlassian:** gọi `GET https://api.atlassian.com/oauth/token/accessible-resources`
   để lấy `cloudId` của site. Không có `cloudId` thì có token cũng không biết gọi vào site nào.
5. Mọi API Jira gọi qua `https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/...`.

## 4. Endpoint

Chuẩn REST của team (Đạt chốt 19/11): tài nguyên số nhiều, động từ ở method,
không có động từ trong URL.

| Method | Endpoint | Làm gì |
|---|---|---|
| GET | `/integrations/github/authorize` | Trả URL authorize GitHub (+ `state`). |
| GET | `/integrations/github/callback?code=&state=` | Đổi code lấy token, trả thông tin user GitHub. |
| GET | `/integrations/github/user` | Thông tin user GitHub đã liên kết. |
| GET | `/integrations/github/repos` | **Tất cả** repo của user (kể cả private), tự đi hết các trang. |
| POST | `/integrations/github/webhooks/register` | Tạo webhook trên 1 repo. Body: `{"owner":"...","repo":"...","events":["pull_request","push"]}`. |
| GET | `/integrations/jira/authorize` | Trả URL authorize Atlassian (+ `state`). |
| GET | `/integrations/jira/callback?code=&state=` | Đổi code lấy token + `cloudId`, trả thông tin user Jira. |
| GET | `/integrations/jira/user` | Thông tin user Jira đã liên kết. |
| GET | `/integrations/jira/projects` | Danh sách project trên site. |
| GET | `/integrations/jira/issues?jql=` | Tìm issue bằng JQL. Mặc định: issue giao cho user đã liên kết. |
| POST | `/integrations/jira/webhooks/register` | Đăng ký webhook động. Body: `{"events":["jira:issue_updated","jira:sprint_updated","jira:sprint_started","jira:sprint_closed"]}`. |
| POST | `/integrations/github/webhooks` | **Receiver** webhook GitHub (xem mục 5). |
| POST | `/integrations/jira/webhooks` | **Receiver** webhook Jira (xem mục 5). |
| GET | `/workspaces/{id}/integrations/status` | Trạng thái liên kết GitHub/Jira của workspace (cho FE hiển thị ô "Đồng bộ Jira/GitHub"). |
| POST | `/integrations/jira/issues/{issueKey}/status` | ⚠️ **CẦN TEAM XÁC NHẬN** — ghi trạng thái issue sang Jira. Body: `{"status":"Done"}`. Mặc định TẮT, trả 403. |

## 5. Webhook được xác thực thế nào — đọc kĩ

### GitHub: đã xác thực đầy đủ

Mỗi delivery được ký HMAC-SHA256 bằng `GITHUB_WEBHOOK_SECRET`, gửi trong header
`X-Hub-Signature-256` dạng `sha256=<hex>`, tính trên **body gốc** (từng byte).
Server tính lại và so bằng `timingSafeEqual`. Thiếu header, sai chữ ký, hoặc
chưa cấu hình secret → **401, không xử lý**. Code ở
`src/common/crypto/verify-signature.ts` và `src/webhooks/webhooks.controller.ts`.

Event xử lý: `pull_request` (action `opened`/`synchronize`/`reopened`) và `push`.
Các event khác chỉ log.

### Jira: có 2 loại webhook, xác thực khác nhau

| Loại webhook | Cách tạo | Được ký không? |
|---|---|---|
| **Admin webhook** | Jira Settings → System → WebHooks, hoặc `POST /rest/webhooks/1.0/webhook` kèm `"secret"` | **Có** — HMAC-SHA256 trong header `X-Hub-Signature` (`sha256=<hex>`), tính trên body gốc. Code đã xác thực đúng kiểu này. |
| **Admin webhook không kèm secret** | Như trên nhưng không đặt secret | **KHÔNG** — không có cách nào chứng minh delivery thật sự từ Jira. Muốn dùng thì đặt secret token trong URL webhook hoặc allowlist IP Atlassian. Service này **từ chối** delivery không có chữ ký. |
| **Webhook động** | `POST /rest/api/3/webhook` bằng OAuth 2.0 app | **Không dùng HMAC.** Delivery mang JWT trong header `Authorization`, ký bằng client secret của app. **Verify JWT này là STUB — chưa triển khai xong** nên endpoint hiện từ chối delivery dạng này (trả 401 kèm lý do). Dùng webhook admin kèm secret cho tới khi verify JWT xong. |

Ngoài ra: webhook động Jira chỉ sống **30 ngày** nếu không refresh — cần job refresh
định kì (chưa làm, xem mục 7).

**Không có chữ ký thì không tin.** Đây là nguyên tắc của cả 2 receiver.

## 6. Test bằng curl

```bash
# 1. Lấy URL authorize GitHub rồi mở bằng trình duyệt
curl http://localhost:3003/integrations/github/authorize

# 2. Sau khi OAuth xong, lấy repo
curl http://localhost:3003/integrations/github/repos

# 3. Lấy URL authorize Jira rồi mở bằng trình duyệt
curl http://localhost:3003/integrations/jira/authorize

# 4. Sau khi OAuth xong, tìm issue
curl "http://localhost:3003/integrations/jira/issues?jql=project%3DNEX%20AND%20status%20!%3D%20Done"

# 5. Trạng thái liên kết của 1 workspace
curl http://localhost:3003/workspaces/nexus/integrations/status

# 6. Giả lập webhook GitHub (cần GITHUB_WEBHOOK_SECRET trong .env)
#    Lưu ý: Phải tính chữ ký HMAC trên ĐÚNG payload JSON gửi đi:
BODY='{"action":"opened","pull_request":{"id":1,"title":"test","state":"open","html_url":"https://github.com/x/y/pull/1","user":{"login":"huy"},"updated_at":"2026-11-20T00:00:00Z"},"repository":{"full_name":"x/y"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$GITHUB_WEBHOOK_SECRET" | cut -d' ' -f2)

# Lần 1: Nhận webhook và đưa vào queue (HTTP 201 {"received":true,"queued":true,"deliveryId":"deliv-1"}, projectedCard ghi trong log service)
curl -X POST http://localhost:3003/integrations/github/webhooks \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-GitHub-Delivery: deliv-1" \
  -H "X-Hub-Signature-256: sha256=$SIG" \
  -d "$BODY"

# Lần 2 (test dedupe): Gửi lại cùng deliveryId / payload -> Trả ngay 201 {"received":true,"duplicate":true,"projectedCard":null}
curl -X POST http://localhost:3003/integrations/github/webhooks \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-GitHub-Delivery: deliv-1" \
  -H "X-Hub-Signature-256: sha256=$SIG" \
  -d "$BODY"

# 7. Ghi trạng thái sang Jira — MẶC ĐỊNH TRẢ 403 (chưa bật JIRA_WRITEBACK_ENABLED)
curl -X POST http://localhost:3003/integrations/jira/issues/NEX-1024/status \
  -H "Content-Type: application/json" -d '{"status":"Done"}'
```

Lưu ý: GitHub/Jira **không gọi được vào localhost**, nên muốn nhận webhook thật
khi dev thì dùng tunnel (vd `ngrok http 3003`) rồi đăng ký URL public đó làm
webhook URL.

## 7. Còn là stub / chưa làm — đừng tưởng đã xong

1. **Token lưu trong bộ nhớ** (`src/tokens/token-store.ts`): mất khi restart.
   Kho thật do Identity service (Spring Boot 8081) quản lý sau — lưu mã hóa
   trong PostgreSQL, gắn với user Nexus, có refresh + revoke.
2. **Chưa đối chiếu `state`** ở callback OAuth (chống CSRF): hiện chỉ sinh
   `state` ngẫu nhiên. Bản đầy đủ phải lưu state theo session ở Identity
   service và đối chiếu ở callback.
3. **Chưa có refresh token tự động**: access token Jira hết hạn thì phải
   authorize lại. Cần dùng `refresh_token` (scope `offline_access`) để đổi
   token mới.
4. **Verify JWT webhook động Jira chưa xong** (mục 5) — dùng webhook admin
   kèm secret trước.
5. **Chưa refresh webhook động Jira** (hết hạn sau 30 ngày) — cần job định kì.
6. **ĐÃ XONG — Chống xử lý trùng webhook (dedupe)**: Đã triển khai `DeliveryDedup`
   in-memory (Map, TTL 24h, tối đa 10.000 key). Giới hạn: lưu trong bộ nhớ tạm,
   mất khi restart (sẽ chuyển sang Redis sau).
7. **ĐÃ XONG — Hàng đợi webhook (queue)**: Đã triển khai `WebhookQueue` in-memory
   xử lý tuần tự, worker chạy nền, retry 5 lần [5s, 10s, 20s, 40s, 80s].
   Giới hạn: in-memory, mất khi restart (sẽ chuyển sang Kafka sau).
8. **ĐÃ XONG — Cache API đọc**: Đã triển khai `TtlCache` in-memory cho các API đọc
   (listAllRepos 60s, getCurrentUser 5m, listProjects 5m, searchIssues 30s).
   Giới hạn: in-memory, mất khi restart.
9. **User demo cố định** (`demo-user`): mọi token đang gắn với 1 user giả.
   Sau này lấy userId từ session/token của Identity service.
10. **Chưa gắn bảng liên kết workspace ↔ tài khoản**: endpoint
    `GET /workspaces/{id}/integrations/status` hiện trả trạng thái của user
    demo, chưa theo từng workspace thật.
11. **Ghi trạng thái sang Jira đang TẮT** — cần team xác nhận (mục 0).

## 8. Vị trí và luật push

Service hiện đã nằm trong repo Nexus chính tại `backend/domains/external-integration/`.
Tuân thủ nghiêm ngặt quy trình của team: làm việc trên nhánh feature (ví dụ `feature/external-integration`), không push trực tiếp lên `develop`, mở PR để review và kiểm tra theo luật team (CI xanh, update issue, In Review, comment link commit, Done).
