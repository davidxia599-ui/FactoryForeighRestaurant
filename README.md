# 食堂採購管理系統

食堂採購、品項與分類管理系統。前端使用 Vue 3，後端提供 Express API，資料儲存在 SQL Server。
採購金額以印尼盾（IDR）顯示。

## 技術架構

- `client/`：Vue 3、TypeScript、Vite、Vue Router、Pinia、Element Plus、Vue I18n。頁面位於 `client/src/views/`，呼叫 `client/src/api/` 的領域 API 函式。
- `server/`：Express + TypeScript API。`server/src/app.ts` 註冊路由，`server/src/server.ts` 在資料庫連線檢查通過後啟動 HTTP listener。
- `database/schema.sql`：建立租戶、使用者、分類、品項、採購及庫存資料表，並為「預設餐廳」準備分類和品項。
- `docker-compose.yml`：啟動 API 與 Nginx 靜態前端；SQL Server 必須另外安裝或提供連線。

前端以 Axios 共用用戶端呼叫 `/api`。本機 Vite 將 API 請求轉送至 `http://localhost:3003`；Docker 的 Nginx 將 `/api` 轉送至 API 容器。受保護 API 使用 JWT，使用者的租戶 ID 取自已驗證的 token。

## 環境需求

- Node.js 18 LTS 與 npm（與目前 Docker 映像版本一致；Node 25 上現有 `vue-tsc` 可能無法執行）。
- 可由執行 API 的環境連線的 SQL Server（schema 以 SQL Server 2016 為目標）。
- 若使用 Docker 部署，需安裝 Docker Engine / Docker Desktop 與 Docker Compose。

## 本機開發

### 1. 安裝相依套件

在專案根目錄執行：

```sh
npm --prefix server ci
npm --prefix client ci
```

### 2. 設定 API 環境變數

API 從執行環境讀取設定；本機命令會先載入 `server/.env`，再以根目錄 `.env` 作為補充。Docker Compose 則從根目錄 `.env` 讀取設定。

| 變數 | 用途 |
| --- | --- |
| `DB_SERVER` | SQL Server 主機，可用 `localhost`、`localhost\instance` 或 `localhost/instance`。 |
| `DB_INSTANCE` | 可選的 SQL Server 命名執行個體；未提供 `DB_PORT` 時可使用。 |
| `DB_PORT` | 可選的 TCP 埠；設定後會使用主機加埠連線，不進行命名執行個體探索。 |
| `DB_NAME` | 要使用的資料庫。 |
| `DB_USER` | SQL Server 登入帳號。 |
| `DB_PASSWORD` | SQL Server 登入密碼。 |
| `PORT` | API HTTP 埠，預設為 `3003`。 |
| `CLIENT_ORIGIN` | 允許跨來源存取 API 的前端 Origin，本機預設為 `http://localhost:5173`。 |
| `JWT_SECRET` | 簽署及驗證 JWT 的祕密值；部署時請設定足夠隨機的私有值。 |
| `JWT_EXPIRES_IN` | JWT 有效時間，登入路由預設為 `8h`。 |
| `INITIAL_ADMIN_USERNAME` | 初次建立管理員或重設密碼時使用的帳號；重設指令未設定時預設為 `admin`。 |
| `INITIAL_ADMIN_PASSWORD` | 初次建立或重設管理員密碼時使用的密碼；至少 6 個字元且不超過 72 UTF-8 bytes。 |
| `INITIAL_ADMIN_TENANT_ID` | 可選。資料庫有多個租戶時，指定初始管理員所屬的租戶 ID。 |

請在本機設定真實連線值與祕密，不要把它們提交到版本控制、貼入 issue 或寫入文件。設定 `DB_PORT` 前，確認 SQL Server 已啟用 TCP/IP，且防火牆允許該埠連線。使用命名執行個體但未設定固定埠時，SQL Server Browser 與執行個體探索也必須可用。

### 3. 建立資料庫結構

先建立 `DB_NAME` 指定的 SQL Server 資料庫，再以 SQL Server Management Studio 或其他 SQL Server 用戶端連線至該資料庫並執行 `database/schema.sql`。腳本會建立資料表，並在預設租戶建立預設分類和品項；它不會建立登入管理員。已有資料庫升級時也需重新執行此腳本，以加入帳號權限欄位；既有帳號保留原業務模組權限，帳號管理權限預設關閉。

### 4. 建立或設定管理員

在執行命令的 shell 設定 `INITIAL_ADMIN_USERNAME` 和 `INITIAL_ADMIN_PASSWORD`，再執行以下其中一個操作。不要將實際密碼放入命令範例、程式碼或文件。

第一次建立管理員：

```sh
npm --prefix server run bootstrap-admin
```

若資料庫尚無租戶，指令會建立「預設餐廳」；若只有一個租戶會使用該租戶；若有多個租戶，需設定 `INITIAL_ADMIN_TENANT_ID`。若帳號已存在，指令會拒絕建立，不會覆寫其密碼。

重設已存在且唯一的帳號密碼：

```sh
npm --prefix server run set-admin-password
```

密碼會以 bcrypt 雜湊後寫入資料庫。密碼不會由指令輸出。

### 5. 啟動前端和 API

在兩個終端機分別執行：

```sh
npm --prefix server run dev
npm --prefix client run dev
```

開啟 <http://localhost:5173>。前端 Vite 監聽 `5173` 並代理 `/api` 至 `3003`。API 啟動前會連線至 SQL Server 並執行 `SELECT 1`；連線失敗時不會開始監聽。

## Build、測試與 lint

```sh
npm --prefix client run build
npm --prefix server run build
```

前端 build 會先執行 `vue-tsc`，再執行 Vite production build；後端 build 使用 `tsc`。目前 `client/package.json` 和 `server/package.json` 未定義測試或 lint script，因此沒有可用的單一測試命令。

手動 smoke test：

1. 開啟前端並確認登入頁顯示。
2. 未登入時直接造訪 `/`、`/purchase`、`/items`、`/reports`、`/settings`，確認會導向 `/login`。
3. 使用已建立的管理員登入，確認導向 Dashboard。
4. 執行 `Invoke-RestMethod http://localhost:3003/api/health`，確認 API 回應健康狀態。

## Docker Compose

確認根目錄 `.env` 已設定 Docker Compose 所需的 SQL Server 連線與 JWT 變數後，在專案根目錄執行：

```sh
docker compose up --build
```

前端網址為 <http://localhost:5173>，API 對外埠為 `3003`。Compose 不會建立 SQL Server，也不會自動執行 `database/schema.sql`；請先在可連線的資料庫執行 schema，並使用有相同 DB 設定的環境執行管理員初始化指令。

## 前端頁面與 API

前端受保護頁面定義於 `client/src/router/index.ts`：

| 頁面 | 路徑 |
| --- | --- |
| 登入 | `/login` |
| 儀表板 | `/` |
| 採購 | `/purchase` |
| 品項管理 | `/items` |
| 報表 | `/reports` |
| 設定 | `/settings` |

API 根路徑為 `/api`：

| 路由 | 功能 |
| --- | --- |
| `/api/health` | API 健康檢查。 |
| `/api/auth/login`、`/api/auth/me`、`/api/auth/change-password` | 登入、目前使用者資訊與本人密碼變更。 |
| `/api/users` | 帳號清單、建立帳號與更新模組權限；需管理員或帳號管理權限。 |
| `/api/tenants` | 租戶查詢與管理。 |
| `/api/categories` | 分類 CRUD。 |
| `/api/items` | 品項 CRUD。 |
| `/api/purchases` | 採購 CRUD 與日期、分類、品項篩選。 |
| `/api/reports/monthly`、`/api/reports/category` | 月報及分類統計。 |

除健康檢查和登入外，以上 API 路由需要有效 JWT。首頁、採購、品項管理、報表、租戶管理及帳號管理 API 會在伺服器端驗證對應模組權限；管理員角色自動擁有全部權限。新建帳號預設沒有任何模組權限，管理員可在「設定 → 帳號管理」中逐項開啟，也可授予帳號管理權限。密碼變更需驗證目前密碼，新密碼至少 6 個字元且不超過 72 個 UTF-8 bytes。受保護 API 從登入 token 取得帳號租戶範圍，不應以用戶端傳入的租戶 ID 作為授權依據。

## 資料與程式慣例

- 前端採 Vue 3 Composition API、`<script setup lang="ts">`；共享 API client 位於 `client/src/api/client.ts`，領域 API 函式位於 `client/src/api/`。
- 共用前端型別位於 `client/src/types/index.ts`；資料庫欄位多為 snake_case，使用者 `tenantId` 等欄位採 camelCase。
- 使用者介面文字維護在 `client/src/i18n/zh-TW.ts` 和 `client/src/i18n/en.ts`，新增文字時同步維護兩種語系。
- Express 功能路由位於 `server/src/routes/`，由 `server/src/app.ts` 掛載。需要登入的 router 在 router 層套用 `authenticateToken`。
- SQL Server 共用連線池及 `query`、`execute` helper 位於 `server/src/config/database.ts`。資料值使用具名參數；不要將用戶輸入串接進 SQL。
- schema 定義和預設租戶資料維護在 `database/schema.sql`。資料庫異動需確保使用實際租戶 ID，而非假設 identity 一定從 1 開始。

## 常見問題

- **`ENOTFOUND` 或找不到 SQL Server 主機**：檢查 `DB_SERVER` 是否只含主機與可選的執行個體名稱，不要把斜線路徑或資料庫名稱當主機。命名執行個體可改設固定 TCP `DB_PORT`。
- **`ESOCKET` 或連線逾時**：確認 SQL Server 正在執行、TCP/IP 已啟用、埠可由 API 主機連線，並確認目前環境讀到的 `.env` 是預期檔案。
- **登入回應 401**：確認資料庫已有該帳號且密碼正確；既有帳號可使用 `set-admin-password` 設定新密碼。
- **登入回應 500**：先看 API 終端機錯誤，確認資料庫可連線且已執行 schema。
- **登入後 Dashboard 提示「請先選擇租戶」**：確認登入使用者所屬租戶與資料庫的租戶資料；租戶管理頁可查詢及建立租戶。
