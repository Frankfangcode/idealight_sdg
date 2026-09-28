# 本輪狀態：沉浸感改版前存檔（2026-09-28）

使用者核可先做章節名稱露出、訊問角色資訊、分類與推理版面整理，並明確要求「改之前先把這版 git 保存一下」。此存檔仍為改版前程式，包含已驗收的 1 控制／2 實驗編號修正、保留既有條件的 migration、最新版角色 4／5 圖片與交接。先保存並整合既有 origin/fix/xiaomai-ui-followup 的 18b6e63 文件／素材，再推送同一分支；不合併 main，不執行正式部署。大型影片、本機設定、學生資料與私密 migration 對照均不提交。

改版前重跑既有 13 項局部測試與本機真實 HTTP 分組／回饋／越權檢查；全部通過後才提交。全套測試仍受不可建立／刪除其他資料庫約束，本次依使用者要求保存現況，不將 checkpoint 說成全套正式施測验收。改版將沿用原章節／證詞文字、不新增線索、提示、問答、計時或組間差異；以現有淺灰紙白與人物圖片實作，保留 80% 桌機與手機閱讀。

---

# 本輪狀態：1 控制組／2 實驗組已修正，歷史編號已對齊（2026-09-28）

使用者要求「改成1是控制組 2是實驗組」，並明確選擇「保留既有實驗條件，只調整編號」。本輪修正 `api/src/scenario_repo.php` 的預設數字對應與交替分派解讀；`api/public/login.php` 改由本回合實際 cond 回傳新數字，修復首次自動分派後仍回空白的問題。全新資料庫初始化與 2026_09_review 的 allocation 預設從 1 開始；既有 next_group 不重設，保留原數字接續交替。schema 的其他設定、計時、實驗差異不變。

新增 `api/migrations/2026_09_group_codes.sql`，以凍結的 ck_runs.cond 對齊 students.group：control→1、experiment→2，包括原 NULL 帳號；沒有回合的帳號不改，重跑無更新。已經使用者核可後才執行。`README.md`、`PRODUCT.md`、`docs/open-questions.md` 記錄新規則及已結案決策；測試的控制／實驗 fixture 數字同步調整，group.test 加上顯式編號與歷史標籤轉換驗證。

產品理解：學生表數字是「名牌」，回合 cond 是實際接受的實驗方式。主方案只換名牌、保持歷史條件與作答；替代方案是保持原編號卻切換條件，會造成中途換組，使用者未採用。新登入先讀固定回合，只有沒有回合才按照指定組別／分派序號建立；伺服器決定對話共享與回饋權限。沒有新外部相依或費用，沒有重設學生進度。

紅綠證據：`.screenshots/group-mapping/check.php` 先以精確合成帳號在指定 idealightsdg_cake 呼叫真實 ck_run，觀察 1 預期 control 卻取得 experiment（exit 1）；修正後 1/control、2/experiment、回饋旗標與重新進入穩定均通過。另一個實際 HTTP/PHP/MySQL `.screenshots/group-mapping/http-check.mjs` 先觀察首次登入 group 空字串與已分派的 1 不同（exit 1），修正 login 回傳後通過。

歷史轉換：`.screenshots/group-mapping/migrate.php preview` 在交易內執行相同 SQL、驗證後回滾；apply 前以建立新檔的方式保存 `.screenshots/group-mapping/before-relabel.json`（含學生識別碼，僅本機且忽略追蹤，切勿提交）。apply 轉換 8 筆，未對齊 0 筆，再執行同 SQL 更新 0 筆，正式提交交易。之後再次核對各資料表排序後的內容 SHA256 與轉換前相同：回合、進度、設定、分類、理由、訊問、草稿、回饋、計時、問卷、影片進度、事件均未改；next_group 仍為原數值。`GROUP BY students.group,ck_runs.cond` 結果為控制組 1 共 2 帳號、實驗組 2 共 6 帳號。量測先由舊資料不一致與已知合成帳號校準，未以空輸出當作成功。

同步前以 git blob 驗證實際站 scenario_repo.php／login.php 與 HEAD 原版相同，備份 `.screenshots/group-mapping/*before`；同步至 `C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6/site`，SHA256 相同，再執行核可的既有庫編號轉換。實際 `http://127.0.0.1:18079` 重跑 HTTP 驗證通過。

施測者／學生 QA 與本輪權限相關安全模擬（僅本機合成帳號）：新帳號自動交替且首次登入回傳一致；1 無跨角色共享、state 不含分數、作答後不洩漏詳細回饋；2 共享同關合成訊問且取得詳細回饋。回饋預置合成快取，不呼叫付費 AI。兩組未作答回饋 409、未登入 state 401、客戶端偽造 group/cond/stuId 不能換組或取得他人權限；未知既有組別登入失敗且不建立回合。重登保持單一回合。四張既有照片與其他修改均保留。合成帳號精確匹配 id+測試名稱清除，外鍵事先核對，驗證資料消失且帳號無法再登入。私密對照檔、.env、api/src 的 HTTP 存取皆 403。

回歸：既有 PLAYWRIGHT_MODULE／TEST_PHP_BINARY 下 `node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs` → 13 通過、0 失敗、0 跳過、exit 0。兩份 PHP 語法、所有本輪變更 mjs 語法及 git diff --check 通過。新增與調整的資料庫全套測試仍因會建刪其他庫而未執行，本輪以限定既有庫、合成帳號的真實邊界驗證補足局部證據；不能宣稱全套通過。

工作區仍 fix/xiaomai-ui-followup@ae03751，origin 已有 18b6e63 的角色圖與文件更新；未覆蓋該遠端提交，未合併 main／提交／push。本輪更新已套用本機服務與指定資料庫；沒有正式部署流程。下一步是使用者按新編號管理學生；若另行部署其他環境，需先備份學生組別對照，再執行本輪 migration，不能只更新 PHP 而忽略舊標籤。技能：product-owner-teaching、systematic-debugging、test-driven-development、verification-before-completion。

---

# 本輪狀態：抓取新版角色 4／5 照片並同步本機站（2026-09-28）

使用者確認「幫我把照片抓下來」。從已 fetch 的遠端 `fix/xiaomai-ui-followup@18b6e637edbce1f91c3adf4edba32223375cb027` 提取 `assets/img/game/char_4.jpg`、`char_5.jpg`、`avatar_4.jpg`、`avatar_5.jpg`，更新工作區與既有 `C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6/site`。大圖與小頭像一起換，避免介紹與訊問顯示不同版本。只取四張圖片，沒有合併同次提交的其他文件／素材。本機分支 HEAD 仍 ae03751，遠端已是 18b6e63，四張圖在工作區表現為修改；不要把這些已在遠端的圖片重複提交或用舊本機狀態覆蓋遠端。本輪 HANDOFF 為本機新增交接。

寫入前逐檔確認工作區與站點均等於原 HEAD，備份至 `.screenshots/character-review/before/`。來源圖片為羅四影攜相機、許五澄戴眼鏡持筆電；直接取 Git 原始二進位，不重新製圖或壓縮。小頭像 192×192、大圖 597×800。角色資料、分組、對話、答案與第一關影片均不變，沒有資料庫／付費操作。採同路徑替換讓既有頁面直接使用；替代的改檔名需修改更多引用，本輪不需要。瀏覽器如保留舊快取可 Ctrl+F5。

驗證 `.screenshots/character-review/check.mjs`：第一輪工作區、第二輪實際站 `http://127.0.0.1:18079/control/game.html`，各用桌機 1280×800／手機 375×812。四張 HTTP 圖片均 200，SHA256 與遠端提取圖片一致；校準與寫入前比對已證明舊版和新版不同。六張角色圖片正常解碼、無水平溢出、角色 4／5 訊問選擇正常，無 pageerror，兩輪 exit 0。瀏覽器使用合成 API，不碰真實學生與 AI。最終截圖 `.screenshots/character-review/round2-desktop.png`、`round2-mobile.png`；兩輪各兩張均讀回。學生與施測者簡短 QA 確認角色照片／姓名对应且兩種尺寸可辨識。

八項自評兩輪通過：層次（標題／人物／操作沿用）、留白（保留已核可 80%）、字體（既有字系）、配色（新圖同系列暗色人像）、對齊（卡片框不變）、響應式（桌機完整六人，手機可捲動）、狀態（選人可用／圖片載入成功）、動效（沿用既有回饋，無新增動畫）。Impeccable 自動引擎仍不可用，人工檢視，未宣稱自動掃描通過。純圖片替換沒有新增永久程式測試；全套資料庫測試仍受既有約束，未執行，未合併 main／推送／正式部署。照片來源已存在遠端，本輪不需要再上傳。下一步為使用者重新整理檢視；待續事項仍是分組數字對應修正。

已套用 product-owner-teaching、impeccable、playwright-cli、verification-before-completion；沿用前端與 QA 詳規。本輪保留全部既有未追蹤影片與 .claude 本機設定。

---

# 本輪狀態：依使用者要求保存目前程式碼並推送既有分支（2026-09-28）

使用者要求「先幫我把這個版本的 code 推上 git」。本輪範圍是現況存檔至 `origin/fix/xiaomai-ui-followup`，來源 HEAD `8807e0f`；不是宣稱正式施測驗收完成，不合併 main、不部署。本次包含標頭修正、新版說明圖與提示詞、移除錯誤開場影片的前後端與測試、80% 桌機排版及產品／交接文件。沒有新功能或沉浸感改版。

重要已知問題：唯讀核對 `api/src/scenario_repo.php` 與實際本機站（SHA256 相同）確認目前 `1 → experiment`、`2 → control`，與使用者／小麥要求「1 控制組、2 實驗組」相反。本輪保留現況，下一輪優先處理數字對應與已開始回合的相容策略；ck_runs.cond 在建立時固定，不能只改 students.group 就宣稱修好。NULL 是学生欄位尚未填值，新回合會交替分派。未修改任何学生、回合或分派計數器。

素材範圍：提交 `assets/img/game/experiment-overview.png` 及其提示詞；`media/第一關.mov`、`media/intro-L1.mp4`（約 225 MB）、`media/edit/` 的轉檔副本／備份／驗收產物仍只留本機，不包含在此次 code 推送。重新拉取程式碼不會取得第一關正式影片，需另放同路徑素材，不能誤認 repo 的試播素材為正式片。`.claude/`、.env、學生資料及 .screenshots 驗收記錄亦不提交。

產品理解：Git 提交是能回復的版本存檔，推送是把存檔同步到既有遠端；此次保存可以繼續修改組別及體驗而保留回復點。沿用現有修正分支，替代的 main 合併會跨入尚未完成的全套驗收，因此不採用。沒有資料庫遷移、外部相依或新增費用。前端／後端與既有本機站維持目前行為。

本輪重新執行 `node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs`，使用既有 PLAYWRIGHT_MODULE／TEST_PHP_BINARY，Node TAP 13 通過、0 失敗、0 跳過、exit 0。PHP ck_onboarding 語法、app.js 與變更的 browser/video/workflow JS 語法、git diff --check 均通過。仍未跑會建立／刪除其他資料庫的全套測試；前述兩輪畫面與真實本機 onboarding 證據沿用。GitHub 一般沙箱連線失敗，需要受控網路權限推送；最終遠端提交驗證另於對話回報。

技能：product-owner-teaching、verification-before-completion。

---

# 本輪狀態：桌機遊戲頁 80% 密度已同步本機站（2026-09-28）

使用者指出畫面塞不下、80% 比較合適。沿用既有設計，僅修改 `assets/css/game/review.css`：視窗至少 1100px 時 root zoom .8；補償 body/app 與滿版回饋視窗的視窗高度；角色介紹去掉標題、說明、角色列及操作區的疊加 margin，統一區塊 gap 20px，照片原尺寸高度改 200px（顯示 160px）。手機與較窄視窗保持原字級與捲動。DESIGN.md 記錄此核可方向。分支仍 fix/xiaomai-ui-followup@8807e0f，先前所有未提交內容保留。

產品理解：樣式表像印刷排版規則，讓瀏覽器 100% 時就有桌機 80% 視覺；同一設定涵蓋角色、影片、作答及回饋頁。替代為每台瀏覽器手動縮放，但施測不易一致，所以選網頁統一處理。沒有後端、答案保存、計時或資料結構變更，沒有資料庫寫入、新相依或費用。縮小會讓文字變小，因此手機不縮；較短視窗及長內容仍可捲動，並非所有頁面硬塞成一屏。

驗證腳本 `.screenshots/density/check.mjs` 使用既有 Chrome/Playwright 與 ui-harness 合成 API，沒有呼叫真實學生 API。先在原版觀察 1280×800 的 next button bottom=1152.96875，超過 800 而 exit 1；套用後量得 760.484375 且 exit 0。量測用 getBoundingClientRect 與 innerHeight，原版已作已知失敗校準。第一輪工作區、第二輪本機站均檢查角色圖片解碼、無橫向溢出、鍵盤前進、第一關影片可容納、分類推理輸入及回饋分數／底部操作可見。初版驗收腳本誤填不存在的 classify 階段造成等待逾時，查明契約改為 combined 後通過；未改產品流程以遷就測試。第二輪使用與截圖一致的完整提問文字，桌機仍可一屏看六人和按鈕。

前端兩輪各桌機 1280×800、手機 375×812 截圖已讀回：`.screenshots/density/round1-desktop.png`、`round1-mobile.png`、`round2-desktop.png`、`round2-mobile.png`。八項自評兩輪皆通過：層次（主標／角色／行動清楚）、留白（桌機消除疊加間距、照片文字成組）、字體（沿用 Work Sans 與中文後備、手機保持原尺寸）、配色（沿用灰白與橘色）、對齊（三欄卡片與右下按鈕）、響應式（手機雙欄可捲動、無橫向溢出）、狀態（键盤及既有播放／保存失敗重試測試通過）、動效（沿用按鈕回饋，沒有新增動畫）。Impeccable 引擎沿用不可用限制，人工按既有 PRODUCT/DESIGN 與技能檢查，沒有宣稱自動掃描已通過。

學生／施測者簡短 QA：在桌機不必先捲動才能看到第二排角色與下一步；手機保持可讀，角色、須知與第一關流程正常；作答及回饋控制可用。沒有發現本輪新增缺陷。僅樣式調整，未觸發完整資安模擬。影片素材與 AI 實際服務不在本輪驗收。

必要局部回歸：使用既有 PLAYWRIGHT_MODULE／TEST_PHP_BINARY，`node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs` → Node TAP 13 通過、0 失敗、0 跳過、exit 0。未新增瑣碎永久 CSS 斷言；保留本輪驗收腳本。全測仍受「僅使用既有 idealightsdg_cake、不建刪其他庫」限制，未執行，未提交／合併／push，未宣稱正式部署。

同步前確認實際站 review.css 的 Git blob 與 HEAD 相同，備份 `.screenshots/density/review-before.css`，再同步單一 CSS 至 `C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6/site/assets/css/game/review.css`；SHA256 一致，第二輪直接讀 `http://127.0.0.1:18079/control/game.html` 驗收。使用者瀏覽器若已設 80%，應先 Ctrl+0 回 100%，避免重複縮小；再依需要重新整理。技能：product-owner-teaching、impeccable、emil-design-eng、test-driven-development、playwright-cli、verification-before-completion。

---

# 本輪狀態：移除錯誤開場影片，已同步本機站（2026-09-28）

使用者明確指出沒有製作角色介紹影片。根因是 app.js 的 onboarding step 0 播放舊 intro-guide.mp4，且 ck_onboarding.php 要求看完它才能繼續。現在流程為六人圖文介紹 → 調查須知 → 使用者提供的第一關影片 → 六人發言；前一頁按鈕改為「認識案件角色」。舊 step 0／1 都顯示角色卡，前後端一起調整，允許 0 → 2，但仍拒絕 0 → 3；第一關影片仍須看完。保留舊影片檔與歷史欄位但不再請求或播放，不修改資料結構、不重設既有學生進度。第一關 intro-L1.mp4 本輪沒有變更。

工作分支 fix/xiaomai-ui-followup@8807e0f；先前 login、說明圖、同意頁及 media 未提交修改完整保留。本輪修改 app.js、ck_onboarding.php、consent 按鈕，以及 PRODUCT.md、README.md、media/README.txt 和四份既有測試。局部決定採程式相容既有步驟編號，如同替舊進度加轉接頭，讓學生接續正確頁面；比重寫資料庫進度更容易回復，也不需要不存在的介紹影片。瀏覽器送出閱讀完成步驟，PHP 檢查順序，再由 MySQL 保存；隱藏影片而不改後端會卡住，因此兩端同時修正。

紅綠證據：新增角色卡瀏覽器案例在修正前因找不到角色卡失敗；真實 HTTP/PHP/MySQL 檢查在修正前因 step 2 回 409 失敗，修正後兩者通過。API 檢查涵蓋未登入 401、非法步驟 400、跳步 409、重新載入、重複操作、進度不倒退、第一關影片未看完不可進入發言、完成後可進入，並確認沒有 level 0 影片紀錄。檢查腳本早期的清理驗證誤用 GET 登入已改為 POST，重新觀察有效的紅綠結果。

實際邊界檢查僅使用指定 idealightsdg_cake，由 `.screenshots/onboarding/fixture.php` 建立隨機 ob_ 測試帳號；先驗證相關外鍵級聯規則，只清理精確測試帳號及合成資料，再確認帳號不能登入。未建立或刪除資料庫、未碰既有學生資料、不呼叫付費 AI。`.screenshots/onboarding/api-check.mjs` 在臨時 PHP 與實際 Apache 網址各通過一次，fixture removed=true；臨時程序已結束。

驗證：使用既有 PLAYWRIGHT_MODULE、TEST_PHP_BINARY，執行 `node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs`，Node TAP 13 通過、0 失敗、0 跳過，exit 0。app.js 與變更測試檔 node --check、PHP 語法檢查、git diff --check 通過。browser/video/workflow 資料庫套件本輪只作語法檢查，未宣稱全套通過。

前端兩輪桌機 1280×800、手機 375×812 截圖已逐張檢視：`.screenshots/onboarding/round1-desktop.png`、`round1-mobile.png`、`round2-desktop.png`、`round2-mobile.png`。第一輪工作區，第二輪實際本機站（UI 測試 API 使用合成回應，另有上段真實後端驗證）。八項自評：佈局保留桌機三欄／手機兩欄、間距沿用既有卡片規則、中文字體可讀、既有色彩不新增、標題卡片對齊、響應式無水平溢出、鍵盤可操作且重載進度正確、沿用互動且不新增動效；兩輪均合格，長頁需向下捲動。六張角色圖片正常解碼，無開場 video／intro-guide 請求，進入第一關來源正確。Impeccable 引擎仍不可用，沿用已讀產品／設計與人工自檢，未宣稱自動掃描通過。

學生／施測者 QA：讀角色 → 須知 → 第一關的資訊與按鈕一致，無無關影片誤導。後端權限與流程檢查限自有本機及合成帳號，拒絕未登入與跳關；未擴及第三方、正式站或真實研究作答。沒有本輪未修復的已證實缺陷；後續關卡素材與整體 AI 服務仍依先前限制，未在本輪宣稱完成驗收。

本機同步：覆寫前確認 app.js／ck_onboarding.php 與原 HEAD 相同，consent 與上一輪已套用版本相同，備份於 `.screenshots/onboarding/*before`；依後端、前端、同意頁順序同步至 `C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6/site`，三檔 SHA256 一致。網址 `http://127.0.0.1:18079/`；實際站 API 和第二輪 UI 檢查通過，game HTTP 200、未登入 state 401、.env 403。原頁 Ctrl+F5 即可載入新版，不需重設帳號。

收尾限制：仍遵守只使用既有資料庫的要求，未執行會新建／刪除其他庫的全套測試，未提交、合併 main 或 push，沒有正式部署流程；本機站已更新。下一步為使用者在原頁重新整理確認。已套用 systematic-debugging、product-owner-teaching、test-driven-development、impeccable、emil-design-eng、karpathy-guidelines、playwright-cli、verification-before-completion。

---

# 本輪狀態：新版說明圖已套用本機網頁（2026-09-28）

使用者確認「好套用吧」。已將 control/consent.html 的舊 SDG f1.png 換成 `assets/img/game/experiment-overview.png`，加入精確圖片尺寸、描述六關流程／計時／計分的替代文字，以及點圖在新分頁查看完整尺寸的入口（rel=noopener）。圖片按頁面寬度等比縮放，手機縮圖用於看全貌，細字可開原圖放大。未變動同意核取方塊、開始按鈕、登入或資料庫程式。上方90–100分鐘／休息／禮券原文仍保留，因本輪只確認套用圖片、未提供新的施測條件；開工已明說此範圍。

開工分支 fix/xiaomai-ui-followup@8807e0f；保留既有 login.html、HANDOFF、影片、生成素材及 .claude 等全部差異。同步前以 git blob 確認試玩副本 consent.html 與 HEAD 一致，備份於 `.screenshots/consent-overview/consent-before.html`，再同步新圖片與頁面到既有 `C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6/site`。工作區／執行副本 SHA256 均一致。原網址：`http://127.0.0.1:18079/control/consent.html`。

驗收工具 `.screenshots/consent-overview/check.mjs`：先在原版看到圖片仍為 f1.png 而 exit 1，再完成替換；兩輪桌機1280×800／手機375×812均 exit 0。確認新圖載入（naturalWidth=1672）、不橫向溢出、鍵盤可聚焦圖片並用Enter開完整原圖、未同意時按鈕停用、勾選後啟用、取消再停用，最後勾選並前往 game.html。無 pageerror。第一輪讀工作區頁面／圖，第二輪直接讀實際網站；僅封鎖外部字型與 API，將最終 game.html 導航攔為驗收頁，不操作真實學生或寫入資料庫。

两輪均讀回截图；最終證據 `.screenshots/consent-overview/round2-desktop.png`（捲至圖片及同意操作區）、`round2-mobile.png`。八項自評：層次—說明標題、圖片、同意操作順序清楚；留白—保留現有區塊間距；字體—保留現有字型後備，圖中文字可開原圖放大；配色—圖片採已核可深色字／青綠／琥珀色，頁面沿用原色；對齊—圖片與內容區等寬；響應式—手機不溢出、比例正確；狀態—同意切換／按鈕停用及鍵盤圖連結已實測；動效—沿用既有按鈕回饋，無新增動畫。第一輪無需追加產品修正，第二輪確認執行副本。

學生／施測者局部QA：避免顯示八情境舊內容，保留既有同意門檻、不改收集資料流程；靜態圖片從Apache送到瀏覽器，無新增服務或費用。選擇保留流程圖＋原圖放大；備援是另做可重排的文字版，但本輪不擴張頁面重製。HTTP頁面／圖片200、未登入遊戲API401、.env403；git diff --check通過。Impeccable自動引擎仍不可用，依已讀脈絡與人工畫面檢查，未宣稱其掃描通過。

本輪僅靜態頁面素材接入，沒有修改圖片內文或研究條件；直接受影響的瀏覽器流程已驗證。先前有效局部程式測試證據保留，但不冒稱全套測試通過。會建立／刪除其他庫的全測仍受指定資料庫限制，未提交／合併／推送或正式發布；本機網址已更新。下一步為使用者重新整理說明頁檢視；正式施測前仍需確認頁面總時長及禮券原文是否符合實際安排。技能：product-owner-teaching、impeccable、emil-design-eng、karpathy-guidelines、test-driven-development、playwright-cli、verification-before-completion。

---

# 本輪狀態：新版六關實驗說明圖（2026-09-28）

使用者提供舊八情境 SDG 說明圖，要求重新製作符合這次實驗的一張圖。本輪用內建 image_gen 產出新版，保存於 `assets/img/game/experiment-overview.png`；完整提示詞在 [圖片生成提示詞](docs/cake-experiment-overview-image-prompt.txt)。原圖及網站引用均保留，本輪是圖片交付，未修改同意書、程式、資料庫或執行副本。

內容依 PRODUCT.md、現有 app.js 開場須知及已核可流程核對：六關調查、六位角色；每關觀看影片 → 閱讀證詞 → 訊問2分30秒 → 分類與推理共4分鐘 → 完成本關；六關後填後測，再看結果與案件解析。分類每則1分、每關6分、總分36分，推理文字評語不計入分類分数；回饋時機採中性描述，不曝光兩組差異或承諾所有人立即看分數。

未沿用旧圖的八情境、八位夥伴、100分鐘與商品卡條件，因這些不能從新版規格確認。文案含持續計時及重新登入接續提醒；圖面已核對繁體字、流程、時間、計分與未揭露案件答案。以學生閱讀與施測者避免錯誤承諾的角度做素材審查，未宣稱已驗證研究同意程序。圖片複製後 SHA256 與生成來源一致。

風格為淺色底、深色字、青綠與琥珀色流程標記、小幅宿舍冰箱場景；採流程圖而非密集段落，方便說明各階段。未新增外部服務依賴。已發現 control/consent.html 仍引用舊 f1.png，且上方還寫90–100分鐘含休息／禮券；本輪依「重製一張」範圍只交付新圖，這些頁面內容與實際施測時長／報酬仍待另行對齊。未提交、推送或部署；保留全部既有修改。技能：product-owner-teaching、brainstorming、imagegen、verification-before-completion。

---

# 本輪狀態：第一關影片已接入本機站（2026-09-28）

使用者把第一關影片放入 media。本輪將 `media/第一關.mov` 接到第一關 `media/intro-L1.mp4`，沿用 idealightsdg_cake 的現有對應（唯讀查詢 ck_levels.level_no=1、video_src 確認），未修改資料庫、程式碼、其他關卡或全遊戲開場 intro-guide。原始 MOV 完整保留。開工分支 fix/xiaomai-ui-followup@8807e0f，保留既有 login.html、HANDOFF 及 .claude 差異。

來源／輸出均為 3840×2160、30 fps、H.264／AAC，瀏覽器讀取長度 76.626009 秒。用現有 FFmpeg 將 MOV 無重編碼封裝成 MP4，faststart 播放索引前置；以 FFmpeg stream hash 比對來源和輸出的影像／音軌 SHA256 均相同，完整解碼 exit 0。比對方法用同檔及舊試播片校準；第一次驗證工具受到 PowerShell 管線中文字元編碼影響，改用 Unicode escape 後完成，不是原片損壞。未裁切、調色、變更字幕或音量，未安裝工具、傳至外部服務或付費。

本機同步位置：`C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6/site/media/intro-L1.mp4`。替換前確認舊檔與既有 video.mp4 試播來源一致，備份保留於 `media/edit/verify/intro-L1-before.mp4`。工作區與執行副本 SHA256 相同；其他六個 intro 檔案前後指紋一致。HTTP 200、Content-Type video/mp4、支援 Range 請求。

使用者／施測者 QA：Chrome 桌機1280×800與手機375×812實際讀取本機站影片，以原速完整播到片尾，均無影片或 pageerror；音軌已解碼，但未冒稱人工聆聽。播完前「看六人的發言」不可見，結束後出現並可按入 testimony 階段。遊戲 API 全部攔截為合成資料，未寫入學生紀錄、未呼叫 AI；這是素材與播放接入驗收，不是資料庫保存全測。結果與截圖在 `media/edit/verify/browser-results.json`、`desktop-playing.png`、`mobile-playing.png`，詳細方法見 [影片處理紀錄](media/edit/project.md)。

`node --test tests/media.test.mjs`：1通過、0失敗、exit 0，確認試播素材工具不覆蓋既有影片。未改程式行為，沿用上一輪有效局部程式測試證據；全套仍因會建立／刪除其他資料庫而受指定庫限制，未合併／提交／推送。本輪新增本機 `media/intro-L1.mp4`、`media/edit/`，來源 `media/第一關.mov` 仍未追蹤。

已交付教學：系統按照既定檔名取片，放入中文 MOV 不會自動換片；MP4 是網站播放包裝，本輪只換包裝，無重新壓縮。備援是轉成1080p較小檔，本輪選擇保留原4K與約225MB畫質／大小。學生下次進第一關會讀新素材，既有觀看／作答進度不重設；舊回合是否允許重新播放沿用原規則。下一步為使用者從原網址檢視；其餘正式關卡影片仍待提供。技能：product-owner-teaching、video-use、playwright-cli、systematic-debugging、verification-before-completion。

---

# 本輪狀態：登入頁標頭重疊修正（2026-09-28）

使用者提供標頭被灰色橫帶穿過的截圖。定位到 login.html：背景已隱藏，但文字容器仍帶 UIkit 絕對定位 class，造成父層只剩上下 padding、無法容納文字。只移除 `uk-position-center-left`，讓文字自然撐高標頭，並將錯誤 `</br>` 改為 `<br>`；保留文案、配色、裝飾、共用 CSS、登入程式與資料庫。備援方案是固定高度，但不採用，避免手機換行再溢出。原分支 fix/xiaomai-ui-followup@8807e0f，保留上一輪 HANDOFF 未提交內容及 .claude 本機設定。

紅→綠證據：忽略追蹤的 `.screenshots/login-header/check.mjs` 為本輪瀏覽器驗收工具，未增加正式測試套件。先以已知相同／越界矩形校準包含判斷，再讀瀏覽器 getBoundingClientRect：原版桌機與手機標頭高度都只有 32px，文字容器各約 169px／142px，兩者皆越界而 exit 1。修正後兩個尺寸皆符合文字在標頭內、表單位於標頭下方、無橫向捲動、無 pageerror；鍵盤可聚焦登入按鈕。瀏覽器封鎖外部 Google Fonts 及所有 API，未發送學生資料；採既有字體後備顯示。

本機同步：先用 git hash-object 比對執行副本 login.html 與 HEAD blob 一致，備份於 `.screenshots/login-header/login-before.html`，再只同步 login.html 至 `C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6/site/login.html`。檔案 SHA256 相同。第二輪直接開原網址 `http://127.0.0.1:18079/login.html`，不攔截 HTML，確認實際站台標頭已修正；未重啟服務、未改 .env、session 或學生資料。

兩輪各桌機 1280×800、手機 375×812 截圖均已讀回自檢；第一輪無需追加修正，第二輪確認實際站台。最終證據：`.screenshots/login-header/round2-desktop.png`、`.screenshots/login-header/round2-mobile.png`。

| 自評 | 第一輪／第二輪 |
|---|---|
| 層次 | 標題與登入區分離，主標大於內文，均合格 |
| 留白 | 標頭由內容撐高，上下留白完整，表單不重疊，均合格 |
| 字體 | 沿用既有 Work Sans／中文字體後備與字級，文字無截斷，均合格；外部字型未驗證 |
| 配色 | 原淺灰底、深色字、橘色操作，無新增色，均合格 |
| 對齊 | 標題置中、登入欄位維持原對齊，均合格 |
| 響應式 | 手機標題換行正常，沒有橫向捲動，均合格 |
| 狀態 | 欄位可輸入、鍵盤可聚焦按鈕，沿用既有 required 與錯誤處理，均合格；不冒用學生登入 |
| 動效 | 保留既有按鈕 hover 回饋，標題保持靜止，無新增動畫／過場，均合格 |

產品理解／QA：學生現在能完整讀到註冊登入指引；施測者不需變更帳號或研究資料。調整只影響瀏覽器排版，不改前端送資料 → PHP 登入 → MySQL 的流程，無新增服務或 AI 費用。從學生閱讀與鍵盤操作、施測者資料完整性角度完成本輪局部驗收。Impeccable 0.1.6 自動引擎因缺少快取写入／安裝權限不可用，已依技能 fallback 讀既有 PRODUCT／DESIGN 及人工畫面檢查，未宣稱自動掃描通過。

局部回歸：使用既有 PLAYWRIGHT_MODULE 與 PHP 8.2 路徑，執行 `node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs`，Node TAP 結果 12 通過、0 失敗、0 跳過、exit 0。git diff --check 通過。未執行會建立／刪除其他庫的全測，既有指定庫限制不變，因此未合併 main、未推送或正式部署；本機試玩站已更新。本輪來源異動為 login.html 與本段 HANDOFF，皆留未提交。下一步為使用者重新整理原登入頁檢視；正式發布前仍須解決既有全測限制。

收尾狀態檢查另發現新出現的未追蹤 `media/第一關.mov`，不是本輪建立，已保留且未讀取／修改／加入版本控制。修正後 HTTP 登入頁 200、未登入遊戲 API 401、.env 403。

技能：product-owner-teaching、systematic-debugging、impeccable、emil-design-eng、karpathy-guidelines、test-driven-development、playwright-cli、verification-before-completion。

---

# 本輪狀態：啟動與系統現況確認（2026-09-28）

使用者要求啟動系統、查 Git／資料庫及整體狀態。既有 `http://127.0.0.1:18079/` 已在運作，無須重新啟動。Apache 2.4.58／PHP 8.2.12 的 DocumentRoot 仍為 `C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6/site`，不是 Git 工作目錄；以已知相同／不同檔案校準 SHA256 後，比對 Git 追蹤的 api、assets、control、components、media、入口 HTML、.htaccess 及 video.mp4，全部與執行副本一致。這是本機站，沒有正式部署流程；未設定隨 Git 自動同步副本。

Git：開工時已追蹤檔案沒有未提交差異，只有 `.claude/settings.local.json` 未追蹤。目前 `fix/xiaomai-ui-followup@8807e0f`；本日 `git ls-remote origin` 實查遠端修正分支為 `8807e0f416231565f3394a4a5897872c716017c8`，main 為 `1bda91d3afa13563a9de8053dffcce72d581e86e`，均與本機一致。`git log main..HEAD` 列出 5a64f8c、c4d92f5、8807e0f；修正尚未合併 main。本輪僅新增這段交接，未提交／推送／部署。

資料庫：執行副本 `.env` 與工作區均指向 `127.0.0.1`／`idealightsdg_cake`，沿用 3306。已檢閱並執行既有唯讀 verify-database.php，以 SELECT DATABASE()／伺服器版本確認為 MySQL 8.0.43、指定庫，六關可讀。未新增、重設或修改學生資料，也未新建資料庫。

今日驗證：HTTP 首頁與登入頁 200、未登入 ck_state.php 401、.env 與 seed_cake.sql 403；使用不存在的合成帳號直接呼叫登入，正確回傳學號或姓名錯誤。既有 Chrome live-smoke 腳本確認實際網址的影片播放、無原生控制列及回饋分數／小標，exit 0；遊戲 API 全部攔截為合成資料，不代表真實完整遊戲驗收。另以 Chrome 操作登入：未攔外部資源時等待請求／載入逾時；只阻止外部 Google Fonts 載入後，實際按登入成功送至後端並顯示錯誤帳號提示，無 pageerror。外部字型與測試環境載入限制相關，尚未證實一般瀏覽環境也會發生。未修改畫面。

限制：AI 有真實設定，但本日未呼叫模型；Apache 歷史日誌於 9/26 18:01–18:02 有 Google AI HTTP 429 額度限制，不能宣稱今天 AI 正常。七支 intro 影片經 SHA256 比對仍全等於 video.mp4 試播來源。正式影片、真實 AI 品質／額度及問卷完成回傳仍需後續驗收。沒有執行會建立／刪除其他資料庫的全測，沿用指定庫保護限制；本輪也不是完整資安健檢。下一步可由使用者在原網址登入試用，正式施測前另安排 AI 與完整流程驗收。

教學已交付：瀏覽器 → Apache/PHP → MySQL／AI 資料流；Git 保存程式版本，不備份研究資料；主方案沿用既有已驗證執行環境，備援才調整 XAMPP。從學生角度查入口／播放，從施測者角度確認資料庫、版本及資料保護；沒有新增外部服務或費用。技能：using-superpowers、product-owner-teaching、verification-before-completion、playwright-cli（CLI 未安裝，使用既有 Playwright 程式介面）、systematic-debugging。

---

# 本輪狀態：依明確要求推送目前分支（2026-09-26）

推送結果：首次自動批准審核因目的地所有權未確認而拒絕；使用者隨後明確確認允許上傳至Frankfangcode/idealight_sdg的fix/xiaomai-ui-followup分支。重新推送成功，`git ls-remote`確認遠端提交為`c4d92f572c16805e526be261081bb9982f53aac8`，main仍為`1bda91d3afa13563a9de8053dffcce72d581e86e`。該提交包含影片指南與核對／環境文件，並包含既有畫面修正祖先提交。此後僅補本段推送紀錄；沒有程式變動，沿用上一輪12項局部測試證據。`.claude/`仍為未追蹤的本機設定；未部署網站。

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
