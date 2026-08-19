# idealight_sdg

批判思考實驗平台。同一套系統承載兩個實驗，共用 `students` 學籍表與登入流程：

1. **SDG 認知偏誤實驗**（既有系統）：情境作答 + AI 對話（`control/experiment.html`、`api/public/chat.php` / `evaluate.php` / `save_response.php`）
2. **〈消失的月蝕巧克力莓果千層蛋糕〉六關批判思考遊戲**（`cake-experiment` 分支新增）：影片 → 證詞 → 訊問 → 證據牆 → 判斷 → 回饋的六階段流程（`control/game.html`、`api/public/ck_*.php`），實驗操弄變項為「有無 AI 回饋」

## 系統需求

- Apache + PHP ≥ 8.0（需 `pdo_mysql`、`curl`、`openssl` 擴充；XAMPP 8.0.x 可用）
- MySQL 8.0 或 MariaDB 10.4+
- 對外連線需可達 `api.openai.com`（AI 回饋）
- 匯入劇本工具需 Node.js（僅開發時用，正式部署不需要）

## 目錄結構

```
├── index.html / register.html / login.html   入口與註冊登入
├── control/            實驗流程頁（consent → flow → game/experiment → survey → finish）
│   └── game.html       蛋糕實驗遊戲主頁
├── api/
│   ├── public/         對外 API（登入、註冊、ck_* 遊戲流程、AI 對話與評分）
│   ├── src/            共用層（db.php 連線、config.php 設定/.env、scenario_repo.php 劇本讀取）
│   ├── schema.sql      SDG 實驗資料表
│   ├── schema_cake.sql 蛋糕實驗資料表（內容表 + 作答表）
│   ├── seed_cake.sql   蛋糕實驗劇本內容（六關、六角色、36 證詞、36 問題）
│   └── tools/          劇本匯出/匯入工具（scenario.js → DB）
├── assets/js/game/     遊戲前端（api.js 資料層、app.js 視圖層）
├── components/         共用頁首頁尾
└── .env.example        環境設定範本
```

## 部署（XAMPP / Apache）

### 1. 程式碼位置與 DocumentRoot

**前端所有路徑都假設專案就是網站根目錄**（`/api/public/...`、`fetch('/components/...')`），
掛在子目錄底下會整片 404。Apache 的 `DocumentRoot` 必須直接指到本專案資料夾：

```apache
DocumentRoot "C:/path/to/idealight_sdg"
<Directory "C:/path/to/idealight_sdg">
    AllowOverride All   # .htaccess 的防護要靠這行才會生效
    Require all granted
</Directory>
```

### 2. 建資料庫（三步，順序固定）

```
mysql -h 127.0.0.1 -u root -p < api/schema.sql
mysql -h 127.0.0.1 -u root -p < api/schema_cake.sql
mysql -h 127.0.0.1 -u root -p < api/seed_cake.sql
```

拿到 repo 就能建出完整可玩的系統，不依賴 repo 以外的檔案。seed 可重複執行，不會產生重複資料。

> **搬遷既有資料注意**：來源 MySQL 若開啟 GTID，`mysqldump` 必須加
> `--set-gtid-purged=OFF`，否則匯入會在所有 INSERT 之前中斷，
> 造成「表都建好了、資料卻是空的」的假象。

### 3. 環境設定

```
copy .env.example .env
```

填入該機器的值：

| 變數 | 說明 |
|---|---|
| `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASS` | MySQL 連線（預設對齊 XAMPP 出廠設定） |
| `OPENAI_API_KEY` | AI 回饋用金鑰 |
| `SURVEYCAKE_PRE_URL` / `SURVEYCAKE_POST_URL` | 前／後測問卷網址；**留空是安全的**，前端會顯示「待設定」而不是壞連結 |

`.env` 在 `.gitignore` 內，不會進版本庫。每個請求都重新讀取，改完**不用重啟服務**。

### 4. 部署後驗收

- 瀏覽器打 `/.env`、`/api/schema.sql`、`/api/src/db.php` → 必須是 **403/404**（證明 `.htaccess` 生效）；`/.git/config` → 404
- 註冊測試帳號 → 登入 → 跑一輪遊戲，確認 AI 回饋出得來（驗證 OpenAI 金鑰與對外連線）
- Windows 上把 Apache/MySQL 裝成服務開機自啟：`httpd.exe -k install`

## 實驗設定備忘

- **組別**：`students.group` 決定實驗組／控制組，受試者註冊後需由研究者填入；
  開始遊戲時凍結到 `ck_runs.cond`，中途改組別不影響已開始的受試者。
  前端只拿得到 `hasAiFeedback` 布林值，受試者無從得知自己的組別。
- **階段只能往前**：後端（`ck_advance.php`）強制，防止看完回饋回頭改答案。
  判斷階段內建「回顧」可重讀所有證詞，不需要回到前面的階段。
- **計時**：訊問 120s／證據牆 60s／判斷 180s（存於 `ck_config`）。
  提前完成可直接送出；逾時會強制送出當下狀態並標記 `timed_out`，
  「沒做完」本身是要保留的研究資料。
- **正解隔離**：教師判定與判準只存在伺服器端（`ck_testimonies.correct`、
  `ck_levels.ranking_criterion`），給前端的 payload 從 SELECT 就不含這些欄位。
- **`seed_cake.sql` 含正解**：repo 目前為私有；若要轉公開，先把這個檔案抽掉。
- **改劇本**：改 `scenario.js` 後執行
  `node api/tools/export_scenario.mjs | php api/tools/import_scenario.php`，
  不要直接改資料庫。

## 分支

- `main`：SDG 認知偏誤實驗（原系統）
- `cake-experiment`：加入蛋糕批判思考遊戲的完整版本
