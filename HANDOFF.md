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

相容性提交 c756177 已快轉合併 main；main 的 MySQL 35/35、PHP 8.2／MariaDB 35/35 再測通過，程序退出碼均 0。原始紀錄 /tmp/idealight-revision/windows-main-mysql.log、windows-main-maria.log。Apache 快照 53 個 PHP／JS／存取設定檔與 main 逐位元組一致；此後只補文件。接續推送既有 origin/main 並比對遠端提交；沒有正式部署流程。工作區保留七支未追蹤的本機試播複製檔，原始 video.mp4 已納入 c756177，不包含 .env。

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
