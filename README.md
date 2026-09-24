# idealight_sdg

批判思考實驗平台。同一套系統承載兩個實驗，共用 `students` 學籍表與登入流程：

1. **SDG 認知偏誤實驗**（既有系統）：情境作答 + AI 對話（`control/experiment.html`、`api/public/chat.php` / `evaluate.php` / `save_response.php`）
2. **〈消失的月蝕巧克力莓果千層蛋糕〉六關批判思考遊戲**（`cake-experiment` 分支新增）：影片 → 證詞 → 訊問 → 證據牆 → 判斷 → 回饋的六階段流程（`control/game.html`、`api/public/ck_*.php`），主要操弄變項為「訊問時 AI 角色之間是否共享問話紀錄」

## 系統需求

- Apache + PHP ≥ 8.0（需 `pdo_mysql`、`curl`、`openssl`、`mbstring` 擴充；XAMPP 8.0.x 可用）
- MySQL 8.0+（資料表使用 utf8mb4_0900_ai_ci；MariaDB 需另行轉換，尚未驗證）
- 對外連線需可達 `generativelanguage.googleapis.com`（蛋糕實驗：訊問時的 AI 角色、AI 回饋）
  與 `api.openai.com`（SDG 實驗）
- 匯入劇本工具需 Node.js（僅開發時用，正式部署不需要）

## 目錄結構

```
├── index.html / register.html / login.html   入口與註冊登入
├── control/            實驗流程頁（consent → flow → game/experiment → survey → finish）
│   └── game.html       蛋糕實驗遊戲主頁
├── api/
│   ├── public/         對外 API（登入、註冊、ck_* 遊戲流程、AI 對話與評分）
│   ├── src/            共用層（db.php 連線、config.php 設定/.env、scenario_repo.php 劇本讀取、
│   │                   interrogation.php 訊問提示詞＝主要操弄變項所在）
│   ├── schema.sql      SDG 實驗資料表
│   ├── schema_cake.sql 蛋糕實驗資料表（內容表 + 作答表）
│   ├── seed_cake.sql   蛋糕實驗劇本內容（六關、六角色、36 證詞、36 問題）
│   ├── migrations/     已部署環境的資料庫異動（全新環境不需要，schema + seed 已包含）
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

SQL 可建立完整內容與作答資料表；正式影片須另外補入 media/，AI 與 SurveyCake 須設定環境變數。seed 可重複執行，不會產生重複資料。

**已經部署過舊版的環境**不用重建，補跑異動檔即可（可重複執行，不會動到已收的作答）：

```
mysql -h 127.0.0.1 -u root -p < api/migrations/2026_09_interrogation_chat.sql
```

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
| `LLM_API_KEY` | 蛋糕實驗的金鑰（訊問的 AI 角色與 AI 回饋共用）。預設供應商是 Google AI Studio，金鑰以 `AIza` 開頭。**金鑰失效時訊問不會報錯**，角色只會回備援台詞（見下方驗收） |
| `LLM_MODEL` | 選填，預設 `gemma-4-26b-a4b-it`（實測首字約 1 秒）。不要換成 `gemma-4-31b-it`：首字約 18 秒，而訊問等待時間不暫停計時 |
| `LLM_REASONING_EFFORT` | 選填，預設 `minimal`。Gemma 4 不設這個會先思考再回答，思考過程還會混進回答裡；Google 只接受 `minimal`。換成不支援此參數的供應商時填 `omit` |
| `LLM_BASE_URL` | 選填，預設 Google 的 OpenAI 相容端點。換供應商或開發時指到本機假伺服器用 |
| `OPENAI_API_KEY` | **只給 SDG 實驗**的 `chat.php`／`evaluate.php` 用，固定打 `api.openai.com`。別家的金鑰不要填這裡 |
| `SURVEYCAKE_PRE_URL` / `SURVEYCAKE_POST_URL` | 前／後測問卷網址；**留空是安全的**，前端會顯示「待設定」而不是壞連結 |

`.env` 在 `.gitignore` 內，不會進版本庫。每個請求都重新讀取，改完**不用重啟服務**。

### 4. 部署後驗收

- 瀏覽器打 `/.env`、`/api/schema.sql`、`/api/src/db.php` → 必須是 **403/404**（證明 `.htaccess` 生效）；`/.git/config` → 404
- 註冊測試帳號 → 登入 → 跑一輪遊戲，確認訊問時角色會正常回答、AI 回饋出得來（驗證 LLM 金鑰與對外連線）。
  若角色每次都回「抱歉，我剛剛有點恍神…」，代表 LLM 呼叫失敗，查 PHP 錯誤紀錄裡的 `[ck_llm_stream]`
  （HTTP 401/403＝金鑰問題；429＝超過速率限制，見下方「施測前」）
- 訊問用串流輸出。若回答是整段一次跳出來而不是逐字出現，檢查 Apache 是否對 PHP 輸出開了
  `mod_deflate` 或 `output_buffering`（功能仍正常，只是受試者等第一個字的時間變長）
- Windows 上把 Apache/MySQL 裝成服務開機自啟：`httpd.exe -k install`

## 實驗設定備忘

- **組別**：`students.group` 決定實驗組（`1`）／控制組（`2`），受試者註冊後需由研究者填入；
  開始遊戲時凍結到 `ck_runs.cond`，中途改組別不影響已開始的受試者。
  前端只拿得到 `hasAiFeedback` 布林值，受試者無從得知自己的組別。
- **主要操弄（訊問）**：六位角色都可以問、自由打字、不限次數，只限時間。
  控制組的 AI 角色彼此獨立、回答偏敘述；實驗組的 AI 角色共享玩家這一關的問話紀錄，
  會推託甩鍋，並要求提問要有依據。差異完全在伺服器組提示詞時決定
  （`api/src/interrogation.php`），兩組的畫面與 API 回應格式一模一樣。
  改提示詞要同步改 `CK_CHAT_PROMPT_VERSION`——每句回答都記了當時的版本。
- **訊問資料**：每句提問、回答、閒置催促都在 `ck_chat_messages`。
  `ai_ok = 0` 是 OpenAI 失敗時的備援台詞，分析時應排除；`latency_ms` 是該句的等待時間。
- **AI 角色的答案洩漏控制**：提示詞只含第 1 關到當前關卡的公開劇情與該角色的說法，
  不含教師判定、判準、後續關卡與真相——模型不知道的事洩漏不了。
  `ck_questions`（教師版可用追問）不再出前端，改當角色的口徑依據。
- **階段只能往前**：後端（`ck_advance.php`）強制，防止看完回饋回頭改答案。
  判斷階段內建「回顧」可重讀所有證詞，不需要回到前面的階段。
- **計時**：訊問 150s（`ck_config.INTERROGATION.seconds`，2:00 或 2:30 尚待定案，改這個值即可）／
  證據牆 60s／判斷 180s（`ck_config.PHASE_SECONDS`）。
  證據牆與判斷提前完成可直接送出；逾時會強制送出當下狀態並標記 `timed_out`，
  「沒做完」本身是要保留的研究資料。
  **訊問沒有「問完了」的出口**：時間沒到就停在訊問頁，時間到才自動切到證據牆
  （時間到時 AI 還在回答的話，等它答完再切）。
  **回顧不是暫停鍵**：限時階段中跳回去看前面的階段（例如訊問到一半回頭看六人發言），
  倒數照樣走、頂欄照樣顯示（標籤會寫明「訊問剩餘」），時間到就從回顧畫面直接切走。
- **判斷理由不限字數**：受試者打得到、打不到都有可能，前後端都只要求不是空白。
- **前測問卷在家完成**：知情同意後直接進遊戲，現場流程不再經過 `survey.html?kind=pre`
  （頁面與 `SURVEYCAKE_PRE_URL` 保留，要改回現場施測把 `consent.html` 的導向改回去即可）。
  後測仍在六關結束後於現場填寫。
  各階段的起算時間記在伺服器（`ck_phase_timers`）：訊問逾時後的提問由後端拒收，
  重整頁面或清除瀏覽器資料也拿不回時間。等 AI 回答的時間不暫停計時。
- **正解隔離**：教師判定與判準只存在伺服器端（`ck_testimonies.correct`、
  `ck_levels.ranking_criterion`），給前端的 payload 從 SELECT 就不含這些欄位。
- **`seed_cake.sql` 含正解**：repo 目前為私有；若要轉公開，先把這個檔案抽掉。
- **改劇本**：改 `scenario.js` 後執行
  `node api/tools/export_scenario.mjs | php api/tools/import_scenario.php`，
  不要直接改資料庫。

## 分支

- `main`：SDG 認知偏誤實驗（原系統）
- `cake-experiment`：加入蛋糕批判思考遊戲的完整版本


## 2026-09 小麥審閱版

新回合改為「開場影片 → 六人介紹 → 調查須知」，每關影片結束後才可前進。分類與推理合併為 240 秒，最後一起提交。訊問與作答草稿存入資料庫，逾時收到的離線文字以 `ck_events.event=draft_late` 保留，**不改動已凍結的答案與分數**。

首次登入未分組者依資料庫鎖定的分派序號交替控制組／實驗組；並行登入也會依序處理。既有組別與回合保留，因此既有整體人數不平衡不會自動重分。這是登入到達順序，並非預先依學號排序全名單。

實驗組每關顯示解析與累計分類分數；控制組只看完成進度。六關完成再填後測，之後兩組都可看總分、偵探圖卡、六關解析、案件真相與學習回顧。滿分 36 僅來自證詞分類，理由品質以 AI 文字評語保存，不納入 36 分。`ck_feedback_audit` 留模型、提示詞版本、判準、送出的訊息與模型回覆，供研究追溯。兩組同時差在共享訊問資訊及回饋時機，不能僅靠這兩組分開估計兩個效果。

既有蛋糕資料庫更新前先備份，再執行以下**只新增表**的異動（先完成既有 interrogation_chat 異動）：

```sh
mysql -h 127.0.0.1 -u USER -p DATABASE < api/migrations/2026_09_review.sql
```

新回合採 `flow_version=2`；更新前已有的回合保留原 evidence/ranking 階段以便接續。不要清空或重設既有研究資料。

驗證方法見 [tests/README.md](tests/README.md)，需求與限制見 [PRODUCT.md](PRODUCT.md)，本輪證據見 [HANDOFF.md](HANDOFF.md)。本倉庫未設定自動部署或正式站網址；本機測試通過不代表已上線。SurveyCake 完成旗標沿用學生按下「我已完成」的自我回報，沒有外部提交回呼。
