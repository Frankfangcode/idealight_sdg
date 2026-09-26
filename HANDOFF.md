# 本輪狀態：依明確要求推送目前分支（2026-09-26）

使用者明確要求「把現在的內容推上git」，本輪採推送修正分支保存目前內容，不將未全測版本合併main或部署。推送目標為既有origin的fix/xiaomai-ui-followup；連線確認遠端main仍為1bda91d，遠端尚無同名修正分支。包含既有5a64f8c畫面修正，以及本機Windows驗證、故事核對、AI影片指南與交接文件。排除`.claude/settings.local.json`本機設定；`.env`與資料庫資料不在提交範圍。

本輪重新執行`node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs`：12通過、0失敗、0跳過，exit 0；使用既有PLAYWRIGHT_MODULE與TEST_PHP_BINARY路徑，與[畫面驗證報告](docs/testing/2026-09-26-ui-followup.md)相同。三份相關JS語法、git diff --check及待提交文件的常見金鑰格式檢查通過；本次測試不連資料庫、不呼叫AI，不等於專案全測或完整資安掃描。

先前「不推送」是自動收尾時的保留狀態；本輪依使用者明確指示將修正分支保存到遠端。main仍受全測門檻限制：原測試會建立／刪除其他資料庫，不符合只用idealightsdg_cake的要求，不能將目標直接改成既有庫執行。沒有正式部署流程。提交與推送結果以本輪對話及遠端分支紀錄為準，下一步仍是確認CapCut可用模型、製作正式逐關素材及處理既有驗證限制。

產品理解：Git推送只保存納入版本控制的程式／文件，不備份學生作答、密鑰或目前執行中的網站；本機Claude設定仍留本機。技能：product-owner-teaching、verification-before-completion。

---

# 本輪狀態：影片製作方法整理成 Markdown（2026-09-26）

依使用者要求，新增[六關AI影片製作指南](docs/ai-video-production-guide.md)，整理Windows CapCut＋Seedance／Veo工具分工、分鏡與參考圖、提示詞示例、剪輯／字幕、六關揭露界線、skills、費用及第一個介面確認步驟，保留官方來源。只有文件變更，原有未提交內容保留；未生成素材、安裝工具、付費或修改資料庫。沿用先前查證，不聲稱已實測帳號可用模型。已檢查Markdown差異與本機相對連結；既有整套測試阻塞不變，未合併／推送／部署。套用product-owner-teaching，教學內容已收錄於指南。

---

# 本輪狀態：故事核對與六關影片方向（2026-09-26）

使用者提供《消失的月蝕巧克力莓果千層蛋糕_六關角色對話_教師解析版_最終版.docx》，要求核對目前網頁及 AI 短片方向；已確認短片用於網頁、分成六關。本輪只新增[內容核對與製作建議](docs/testing/2026-09-26-story-video-audit.md)，未修改程式、Word、資料庫或影片。分支 fix/xiaomai-ui-followup@5a64f8c，原有未提交文件全部保留；未合併、推送或部署。

以目前18079站台設定、唯讀交易讀取指定庫 idealightsdg_cake 的故事表，未讀學生資料、未呼叫真實AI。比對方法先校準已知相同／不同內容，確認六關36個唯一角色證詞；35則除空白逐字一致，另1則只是網站修正Word「遭遭竊」錯字；36判定皆一致。六段影片腳本文意一致；任務文字及人物性格有改寫。實際七個MP4雜湊仍全部相同，為既有試播片。

重要限制：AI的額外口徑不全等於Word；第五關六禾的「自習室裡大家一起吃」增加當關證詞未承認的資訊，其他口徑有額外事實／自我糾錯。此為靜態素材發現，尚未證實模型每次都會說出。Word本身第二關飲料說法與第四關獨立證實的層次、第三關「原始檔」名稱與第六關標題兩種寫法，都已記錄建議，不擅自修改研究內容。

已交付學生／教師／製片角度情境審查、主方案及低成本備援、影片接入資料流與驗收界線。建議第一／四關共用場景和動作素材，證據文字於剪輯時精確加入，兩組使用相同影片。未製作正式影片或聲稱成品QA通過。下一步先對齊揭露界線，再拆第一／四關逐鏡腳本。技能：docx、product-owner-teaching、brainstorming、verification-before-completion。

---

# 本輪狀態：小麥畫面漏項已修正（2026-09-26）

使用者要求修正上輪漏項，並確認正式影片尚未完成、先修播放流程。唯一資料庫仍為 idealightsdg_cake，不新建或切換；沒有修改任何學生資料。來源 1bda91d，修正提交 5a64f8c，分支 fix/xiaomai-ui-followup。主工作區已切到此分支，原有未提交文件全部保留；main 未合併、未推送。獨立工作副本 C:/Users/User/AppData/Local/Temp/idealight-ui-followup-20260926 已 detached 到同一提交，保留測試與截圖。

實作：[計畫](docs/superpowers/plans/2026-09-26-xiaomai-ui-followup.md)，[驗證／教學紀錄](docs/testing/2026-09-26-ui-followup.md)。只改 app.js／review.css：影片自動播放、隱藏原生控制列；瀏覽器阻擋時提供開始播放；重载可繼續播放；回饋標題右側顯示本關／累積分數並即時更新主畫面；配分說明、小標、本關任務主標與影片說明置頂。控制組不顯示分數或教學小標，舊回合和後端契約保持原樣。

四項新行為逐項紅→綠，兩項回歸驗證；六項前端加六項既有安全案例，共12通過／0失敗／0跳過、exit 0。原始日誌 C:/Users/User/AppData/Local/Temp/idealight-ui-followup-tests.log。JS語法、git diff --check通過；獨立AI審查未發現明確新缺陷。沒有執行資料庫全套：它會建立／刪除其他測試庫，不符合指定庫限制，不能直接改目標為真實庫執行。因此依全測門檻不合併 main、不推送、不正式發布。

兩輪桌機1280×800／手機375×812八項自評均合格，最終證據 C:/Users/User/AppData/Local/Temp/idealight-ui-followup-20260926/.screenshots/round2-desktop.png、round2-mobile.png。所有前端測試API均被攔截為合成內容，不連資料庫。Impeccable自動引擎不可用，未宣稱其自動掃描通過。

原本 http://127.0.0.1:18079/ 已套用修正的兩份畫面檔，未重啟服務、未改 .env／session／素材。更新前確認站台舊檔與工作區原版一致，備份在 C:/Users/User/AppData/Local/Temp/idealight-ui-before-5a64f8c。更新後HTTP檔案雜湊與已驗證來源一致；Chrome在實際網址讀真實试播影片确认正在播放且無控制列，合成回饋確認右上分數／小標，无pageerror。這次瀏覽器檢查仍攔截全部API，未冒用真實學生或呼叫AI；腳本 C:/Users/User/AppData/Local/Temp/idealight-ui-live-smoke.mjs。

剩餘：正式七支影片待補；真實AI串供／評語品質、問卷完成回傳及舊回合沿用舊流程仍是既有核對限制。本輪沒有擅改研究設計。後續若要合併推送，需先讓必要全測符合指定庫與資料保護要求，不能把12項局部通過當作全專案通過。

已交付產品理解：畫面讀取既有計分，分類36分與推理評語分開；備援播放只在瀏覽器拒絕時出現，不增加外部服務或AI費用。技能清單與完整QA見上方驗證紀錄。

---

# 本輪狀態：小麥建議落差核對（2026-09-26）

使用者要求對照 Word 與後續對話，檢查還有哪些沒改到。本輪只檢查，未改產品程式、既有資料或服務；保留開工時全部未提交修改。來源 main@1bda91d。

逐項結果：[小麥建議核對](docs/testing/2026-09-26-xiaomai-gap-audit.md)。確定缺少正式逐關影片、自動播放且無控制列、回饋視窗右上分數、須知配分說明、回饋小標；「上方只顯示本關任務」僅部分符合。新流程／草稿／分組／圖卡／AI 評語留存已有實作，不能列為未做。舊回合仍採舊流程；真實 AI 品質與問卷實際完成驗證仍有限制。

使用 Chrome 攔截全部 API、以合成內容查畫面，不寫入目前 18079 所連的既有學生資料庫。核對四份實際站台檔案與工作區雜湊一致；試玩七份影片全部等同根目錄 video.mp4。同意書與六角色圖可載入，未重現缺圖。最終桌機／手機證據在 C:/Users/User/AppData/Local/Temp/idealight-review-audit-20260926/。沒有重跑資料庫全測或呼叫真實 AI；Impeccable 自動引擎未能執行，改以現有文件及畫面核對。

使用者本輪最新明確限制：資料庫一定使用 idealightsdg_cake，不另建或切換其他資料庫。後續保存功能驗收須以指定庫中的獨立測試帳號／新回合區分既有研究紀錄；現有會建立或刪除其他測試庫的全測腳本不符合此限制，不可直接執行，更不可把其目標名稱改成既有庫就執行。

已交付新版／舊回合差異、畫面與資料保存分工及驗收限制。下一個具體動作是依核對表補漏，再依上述指定庫限制安排新回合驗收；不得為看新版重置既有研究資料。本輪僅新增核對報告並補交接，未提交／推送／部署。

---

# 已切回既有 idealightsdg_cake 資料庫（2026-09-26）

使用者先詢問回退 commit，後明確選擇「保留目前程式，備份後升級資料庫」。因此程式仍為 `main@1bda91d`，沒有回退、提交或推送。`2906f2d` 是前一個 commit，但只差交接文件；較早的功能版本包含 `c756177`（XAMPP 相容）、`9b1e9bb`（新版流程）、`13e212f`（interrogation-chat）、`afe339b`（cake-experiment 舊選題訊問）。

目前 `http://127.0.0.1:18079/` 已連到 **127.0.0.1:3306／MySQL 8.0.43／idealightsdg_cake**，沿用工作區 `.env` 既有 DB 設定與真實 AI。試玩 Apache 使用新的 `sessions-cake` 目錄，切換後需重新登入。這個網址現在會寫入既有資料庫，不可用來跑自動測試。

升級前共有 18 張表、5 個學生及5個既有回合，缺少聊天、計時及新版五張表。完整備份保存在 `C:/Users/User/AppData/Local/Idealight/backups/idealightsdg_cake-20260926-170302/idealightsdg_cake.sql`，同目錄保留遷移檔、before／pre-apply／after 指紋。使用 MySQL 8.0 原生 mysqldump、single-transaction、routines／events／triggers、set-gtid-purged=OFF；密碼沒有寫入命令列或紀錄。

先還原到獨立 `idealight_test_cake_upgrade_20260926170343`，確認18張表筆數及完整內容雜湊與來源一致；套用 `2026_09_interrogation_chat.sql`、`2026_09_review.sql`，再重複套用，25張表指紋完全一致。原有17張非設定表均未變動；設定表依遷移移除舊 MAX_INTERROGATIONS 並補入 INTERROGATION。原庫套用前再確認資料未變，套用後25張表與已驗證副本完全一致。六關及5個既有回合的唯讀程式檢查通過，既有回合仍為 flow_version=1。

切換後首頁／登入200、未登入API401、`.env`403；以不存在的帳號確認登入查詢可達資料庫，未新增或冒用學生。沒有執行正式库全測，也沒有重設帳號、分組、作答或進度。還原驗證副本已刪除；舊33080隔離MariaDB已停止，資料檔及先前試玩資料保留。18079 真實AI站繼續運作。

---

# Windows 真實 AI 憑證修復（2026-09-26）

使用者回報角色一直重複固定回覆。已確認原因：隔離 PHP 8.2 的最小 `php.ini` 缺少 CA 路徑，Apache 日誌顯示 `SSL certificate problem: unable to get local issuer certificate`；當時八筆角色回覆皆 `ai_ok=0`，不是誤用 mock。先前啟動只檢查設定與資料庫，未驗證真實回答，因此漏掉此問題。

已在 `C:/Users/User/AppData/Local/Temp/idealight-windows-bb789a74/php82/php.ini` 補上 `curl.cainfo`、`openssl.cafile`，沿用原 XAMPP 的 `C:/xampp/apache/bin/curl-ca-bundle.crt`，保持 TLS 驗證啟用。重新啟動同一個 18079 試玩 Apache；資料庫、session 與使用者作答紀錄保持原樣。

驗證：不帶金鑰的 HTTPS 探測 `curlError=0`／`tlsVerifyResult=0`（API 基底路徑 404 屬預期）；另以獨立 `ai_probe_*` 合成帳號，經實際登入及 `ck_chat.php` 對角色 1、2 提問，兩次 `aiOk=true`、內容不同，資料庫保存兩筆 `ai_ok=1`。檢查腳本為試玩目錄下 `check-tls.php`、`check-live-ai.mjs`。未刪除既有八筆失敗回覆，未重置使用者計時；沒有為此重跑模擬 AI 全測。

---

# Windows 試玩站已啟動（2026-09-26）

使用者於測試完成後要求啟動，並明確授權「允許使用真實 AI」。目前入口 `http://127.0.0.1:18079/`，使用已驗證的隔離 PHP 8.2.12／Apache 2.4.58。AI 及問卷設定取自專案既有 `.env`，不是 `local-test`。首頁／登入頁 200、資料庫六關可讀，未登入 API 401、`.env`／SQL 403；本次啟動未額外呼叫付費模型驗證回答。

試玩站快照及設定：`C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6`；使用全新 `idealight_preview_windows` 資料庫，不混用合成測試學生。MariaDB 使用先前隔離實例的 33080／datadir；不要在此庫跑自動測試或重新匯入 seed。網站 session 及七支實體試播影片也獨立。試玩快照的 `.env` 含真實設定，不提交或分享。原專案 `.env`、既有 8080 站台與 3306 MySQL 不變。

目前保持試玩 Apache／MariaDB 運作，18080 模擬 AI 與 18082 測試網站已停止。這是本機背景程序，未安裝自動啟動服務；程式快照不會隨工作區修改自動更新。根目錄仍是共同試播影片，不是正式七關素材。

---

# Windows 真機補驗（2026-09-26）

已在 Windows 目標電腦依相容計畫執行，來源 `main@1bda91d`。完整證據見 [Windows 原生報告](docs/testing/2026-09-26-windows-native.md)。以下舊紀錄的「Windows 尚未驗證」已由本節補充；正式環境的限制仍保留。

- Windows Apache 2.4.58／MariaDB 10.4.32：PHP 8.0.30 最小設定與 PHP 8.2.12 隔離對照皆 35/35 通過，0 失敗／跳過，退出碼 0；包含原生 php.exe／mysql.exe 與 Chrome。
- **原 XAMPP 完整 PHP 設定有 Apache 子程序崩潰**，不能只根據 35/35 宣稱原站台穩定。補 AcceptFilter 未解決；最小 PHP 設定下未再出現。尚未定位原設定的單一根因，未修改既有站台或系統 PHP。
- PHP 8.2 初次測試發現混用 Apache 時 cURL DLL 載入失敗（31/35），明確載入隔離 PHP 套件 DLL 後 35/35 通過，無異常重啟。
- PHP 8.0／8.2 各 27 檔、JS／MJS 46 檔語法通過；真實 Apache 私有路徑及大小寫保護通過；七份實體試播影片雜湊一致，Chrome 實際播放開場影片並解鎖下一步。
- 修正 tests/README.md 的 PowerShell 5.1 UTF-8 讀取與 npm.cmd 指令；更新安裝指南。本輪產品 PHP／JS／SQL 無變更。
- 原 3306 為另一套 MySQL，沒有操作其資料；本輪另建 33080 MariaDB、18082 Apache、18080 模擬 AI／問卷。沒有讀取或複製正式 `.env`、沒有呼叫真實 AI。
- 原始日誌、合成資料與測試設定保留於 `C:/Users/User/AppData/Local/Temp/idealight-windows-bb789a74`；測試服務收尾後停止。本輪文件修改尚未提交或推送。

下一步是處理既有 XAMPP 設定的崩潰原因，再進行正式站的 AI、問卷、素材與資料搬移驗收。Windows 相容性全測不等於正式施測環境已可使用。

---

# 本輪狀態（2026-09-26 Windows XAMPP 測試）

使用者目標：從 GitHub 拉到 Windows XAMPP 後能執行，檢查資料庫與全部既有測試。來源 main@a2277f6；工作分支 fix/windows-xampp-compatibility。開工既有未提交項目只有使用者 video.mp4 及前輪試播連結；未覆蓋其他修改。

計畫：[Windows 相容性計畫](docs/superpowers/plans/2026-09-26-windows-xampp.md)。交付：[Windows 安裝／搬機指南](docs/windows-xampp.md)、[逐項測試與 QA 報告](docs/testing/2026-09-26-xampp.md)、[測試重現](tests/README.md)。本輪保持產品流程不變，不搬移／清除真實學生資料。

## 修改、局部決定與理由

全新 schema 使用共通 unicode 定序；舊訊問表遷移沿用 students 欄位型別與定序，移除固定 USE，文件命令明確指定資料庫。ck_env 支援明確空環境值，符合 XAMPP 空密碼。Apache 保護改成不分大小寫，防止 Windows 類檔案系統讀出 SQL 正解、測試與文件。

測試工具可配置 Windows php.exe/mysql.exe 與 TCP，資料庫輸出正規化 CRLF；Apache session cookie 取最後一次更新。固定 Playwright 1.63.0 與一秒 fixture，新增跨角色共享、遷移、空密碼與素材案例。新增 prepare_demo_media.php 將根目錄 video.mp4 複製成七支實體試播影片，保留既有檔案。使用者原片隨本輪提交，七份本機複製檔不提交；已將前輪由我們建立的七個 ../video.mp4 連結換成相同內容實體檔，沒有替換其他正式素材。

推薦沿用 XAMPP，避免要求 Windows 改裝 MySQL；备援是另裝與來源一致的 MySQL，但增加安裝負擔。研究資料庫、.env 與站台設定不會隨 Git 搬移。對使用者已交付產品理解：流程不變、程式／資料／設定分工、隔離測試資料流、相容性理由、替代方案、模擬 AI 不产生費用，以及真機／外部品質限制。

## 驗證證據

原版 MySQL 基線 25/25 通過。新增案例後，分支 MySQL 35/35、PHP 8.2.12 + Apache 2.4.57 + MariaDB 10.4.32 35/35，無失敗、跳過。完整命令在 tests/README.md；原始輸出 /tmp/idealight-revision/windows-branch-mysql.log、windows-branch-maria.log。兩個程序退出碼皆 0，逐列與 pass/fail 計數吻合。這是 Mac 主機／Linux 容器，不是 Windows 真機；補充 PHP 子程序仍在 Mac PHP 8.5.9 執行。

PHP 8.2 全 27 個 API PHP 語法、45 個 JS 語法檢查通過；Windows 檔名／大小寫檢查無衝突、候選檔無符號連結。各修復先重現失敗再重測成功；完整 review 遷移重跑保留分派及草稿。真實 Apache 驗證大小寫存取保護；安全與學生／研究者 QA 逐項見報告。獨立 AI 唯讀審查已複查修正，未發現新的明確阻塞問題。沒有 UI 修改，不重新計入前轮截圖；本轮实际 Chrome 流程通过。

分支全測後只有文件更新，來源碼、相依、設定與覆蓋範圍無變更，可沿用至合併前。main 合併後全測與推送結果在下方補記，未完成前不宣稱已推送。

## main 收尾證據

相容性提交 c756177 已快轉合併 main；main 的 MySQL 35/35、PHP 8.2／MariaDB 35/35 再測通過，程序退出碼均 0。原始紀錄 /tmp/idealight-revision/windows-main-mysql.log、windows-main-maria.log。Apache 快照 53 個 PHP／JS／存取設定檔與 main 逐位元組一致；此後只補文件。已推送既有 origin/main，git ls-remote 確認遠端包含 2906f2d（程式 c756177 及 main 全測紀錄）；最後再提交此推送記錄。沒有正式部署流程。工作區保留七支未追蹤的本機試播複製檔，原始 video.mp4 已納入 c756177，不包含 .env。

## 環境與剩餘限制

18079 保持真實 AI 試玩，資料仍是隔離 MySQL idealight_test_review，後測模擬頁；沒有為了全測切回假 AI。自動測試另用 18081 / 33079 idealight_test_windows，18082 / 33080 MariaDB 同名隔離庫，以及 18080 模擬服務。Docker 僅為本機相同版本驗證，Windows 使用者不需裝 Docker。網站快照 /tmp/idealight-revision/xampp-site 不含正式 .env。

Windows 真機、正式問卷／素材、真實 AI 完整品質與正式研究資料搬移尚未驗證。既有 MySQL 0900 備份不能當作能直接匯入 MariaDB。未配置 CI、自動部署或正式站網址，不另建站。下一個需使用者參與的動作是依 Windows 指南在目標電腦完成環境驗收；只拉 Git 不足以帶入密鑰與資料。

本輪技能：product-owner-teaching、systematic-debugging、writing-plans、executing-plans、test-driven-development、requesting-code-review、verification-before-completion、finishing-a-development-branch。

---

# 本輪狀態（2026-09-24）

## 目標與核可範圍
已依小麥審閱意見實作可供程式審閱的新版；規格 [PRODUCT.md](PRODUCT.md)，視覺 [DESIGN.md](DESIGN.md)，計畫 [docs/superpowers/plans/2026-09-24-xiaomai-review.md](docs/superpowers/plans/2026-09-24-xiaomai-review.md)。
來源 `interrogation-chat@13e212f`；在 `revision/xiaomai-review` 開發，開工時乾淨。已依使用者預設收尾整合 main；程式提交 `9b1e9bb`。首次 fetch 遇到 `Could not resolve host: github.com`，之後連線恢復，非強制 push 成功。未部署正式站。

## 修改與局部決定
三頁開場、影片完成門檻與觀看進度、六人介紹、實際載入進度；淺灰底與大字，倒數最後一分鐘紅色、最後 15 秒行內提醒。分類與理由共頁、共用 240 秒、原子提交（六張分類與理由同時保存，重試不重複）。
首次未分組登入以資料庫鎖定序號交替；保留既有組別／回合。舊回合維持分開 evidence/ranking，避免改寫已開始研究資料。新增表僅在隔離資料庫套用；正式庫仍須備份後執行 `api/migrations/2026_09_review.sql`。
訊問與作答草稿有裝置暫存及資料庫版本；逾時晚到草稿另存 `ck_events.event=draft_late`，不覆寫凍結答案。跨階段、最後一關結束也先同步再跳問卷；已保存版本不重複標成晚到。
實驗組逐關解析與累計分數，控制組只顯示完成進度。後測完成後兩組都可看 36 分分類總分、等級圖卡、六關解析、真相與學習回顧。AI 理由評語與模型／提示詞／判準獨立留存，不加進 36 分。
移除嘴型／人物脈動與背景漂移；清除既有光暈、裝飾條紋、修正登入對比。測試與文件路徑透過 .htaccess 禁止對外。

## 驗證證據與環境
只使用 `/tmp/idealight-revision` 的隔離 MySQL、合成學生、本機 AI／問卷替身。未讀取或修改原有學生資料，未使用真實付費模型。詳見 [tests/README.md](tests/README.md)。

- `TEST_DB=idealight_test_review node --test --test-concurrency=1 tests/*.test.mjs`：25 項通過、0 失敗。完整輸出 `/tmp/idealight-revision/branch-tests.log`；合併後 main 再次 25 項通過、0 失敗，輸出 `/tmp/idealight-revision/main-tests.log`。
- 27 個 PHP 檔案 `php -l`；遊戲 JS `node --check`；`git diff --check` 通過。無既有 build/lint/CI 指令，不虛構 build 驗證。
- Impeccable 掃描本輪 HTML/JS/review.css，輸出 `[]`；沒有忽略規則或誤判豁免。證據 `/tmp/idealight-revision/impeccable-final.json`。
- 多程序分組、真實註冊登入、兩組各六關 HTTP/PDO/MySQL、舊回合接續、分類與理由共同提交、回應遺失重試、離線草稿跨階段及最後一關補傳、等級邊界、全新 schema+seed 安裝皆有測試。倒數測試以 SQL 移動合成學生的起算時間，不是真的等待全部秒數。
- 安全案例：未登入拒絕、請求夾帶他人學號無效、未到關卡不能寫草稿、新回合不能利用舊端點提前提交、控制組後測前無法查解析／真相／分數、不合法分類不產生半套答案、草稿 HTML 只呈現文字。瀏覽器正常流程無未處理 JS 錯誤。
- 獨立程式審查抓到舊端點繞過、真相門檻、提交重試及離線補傳缺口，均已補紅綠測試並修正。這是 AI 審查，不是外部真人或資安認證。

## 前端兩輪自評
第一輪 `.screenshots/round1-desktop.png`（1280×800）、`.screenshots/round1-mobile.png`（375×812）：層次合格；留白不合格（空分類區過高）；字體合格（沿用 Work Sans、繁體後備，大字重標題）；配色不合格（登入白字橘底對比與舊光暈）；對齊合格；響應式合格；狀態合格；動效合格（按鈕短淡化、人物静止）。已減少分類區空白、修正對比及裝飾。
第二輪 `.screenshots/round2-desktop.png`、`.screenshots/round2-mobile.png`，尺寸同上且以 sips 驗證：八項均合格。標題 32px 粗體對正文 20–22px 常規；橘色主操作，綠／玫紅僅分類語意；右側倒數明確，手機單欄可捲動。空狀態、載入、重試、focus/hover 齊全；160ms 按鈕淡化並支援 reduced-motion，無嘴型或脈動。動效程式已依 review-animations 檢查。
手機無橫向溢出以 DOM 測量；先插入已知 800px 元素確認方法確實偵測溢出，再移除檢查真實頁面。測試提醒以彈窗可見性驗收，而非 DOM 節點是否存在。

## 剩餘限制與下一個動作
正式七支影片缺少：`media/intro-guide.mp4` 與 `intro-L1.mp4` 至 `intro-L6.mp4`。瀏覽器測試攔截為一秒灰片；不能視為正式素材已驗收，也不能把這版當作可直接施測。等待使用者提供素材路徑。
真實 AI 串供穩定性、評語品質、正式 SurveyCake 與正式 Apache 未驗證；問卷完成仍是學生按確認的自我回報，沒有 SurveyCake 回呼。登入沿用學號＋姓名，非高強度身分驗證。兩组同時改共享資訊與回饋，不能分離兩項效果。
未找到 CI、自動部署、正式站網址或已記錄回復流程；README 只有手動 Apache/XAMPP 說明，沒有另建正式站。程式已上傳；下一步是補正式影片、備份後套用新增表，再驗證真實 AI／問卷和既有正式站核心流程。

## 技能紀錄
本輪套用 product-owner-teaching、test-driven-development、writing-plans、executing-plans、impeccable、emil-design-eng、playwright-cli、systematic-debugging、review-animations、requesting-code-review、verification-before-completion、finishing-a-development-branch。使用者既定授權優先，未要求重複批准合併或推送。

## 2026-09-26 本機試玩環境更正

使用者試玩時所有角色都回「我只看到當時的紀錄，其他細節不清楚。」。根因是本機 PHP 仍以測試環境變數 `LLM_BASE_URL=http://127.0.0.1:18080`、`LLM_MODEL=local-test` 執行；不是角色提示詞或 API 程式遺漏。已重啟同一個 `http://127.0.0.1:18079`，移除 LLM 環境變數覆寫，讓 AI 讀取專案既有 .env。未顯示或改寫金鑰。

目前 **AI 是真實服務**，資料庫仍是 33079 的 `idealight_test_review`，PHP session 目錄仍為 `/tmp/idealight-revision/run`，後測問卷仍指向本機模擬頁。不要把這個環境視為正式施測環境，也不要直接在此狀態跑整套自動測試；自動測試須先依 tests/README.md 恢復模擬 AI，以免呼叫真實服務或得到與固定斷言不同的內容。

驗證：以獨立合成學生經 `ck_chat.php` 對角色 1、2 發問；更正前得到固定回覆及 `model=local-test`，更正後兩次皆 `aiOk=true`，記錄 `gemma-4-26b-a4b-it` 且回答依各自證詞不同。腳本 `/tmp/idealight-revision/check-live-ai.mjs`。沒有重新執行依賴假服務的 25 項全測，因程式碼未變。本次驗證僅證明連線與兩個角色回答，並非完整串供品質評估。

使用者提供的根目錄 `video.mp4` 目前透過 media 的七個本機符號連結供開場／各關試播；已完整播完並驗證下一步解鎖。原檔與連結均未提交、未上傳。舊模擬對話與作答紀錄保留，未清除使用者試玩的進度。
