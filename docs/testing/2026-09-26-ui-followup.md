# 小麥畫面修正驗證

## 範圍與結果

依使用者核可，修正自動播放／隱藏原生控制列、播放拒絕時備援按鈕、重新載入後自動播放、回饋標題區本關與累積分數、分數即時更新、配分說明、回饋小標、本關任務主標及影片說明移到上方。正式影片尚未完成，使用者明確要求先修播放流程。

產品程式只改 assets/js/game/app.js 和 assets/css/game/review.css。PHP、SQL、資料契約、問卷完成方式、分組及既有回合均未修改。資料庫固定 idealightsdg_cake；工作區與試玩站 .env 的 DB_NAME 均再次確認相同，沒有更換或新增資料庫。

## 紅綠證據

1. 自動播放：原版 currentTime 一直為零，3 秒等待失敗；修改後影片開始、無控制列、保存完成才解鎖下一步。
2. 播放被拒：先以 NotAllowedError 模擬瀏覽器拒絕，原版沒有開始播放備援而失敗；新增按鈕後點擊可播放並依正常門檻前進。
3. 媒體失敗：首次 404 後按重載，原版只 load 不 play，等待播放失敗；補上播放後通過。
4. 回饋分數：原版回饋標題區無分數，測試失敗；修改後顯示本關 4/6、累積 10/36，主畫面同步更新，滾動解析不會捲走分數。
5. 控制組與觀看保存失敗：補回歸案例，控制組沒有得分或教學小標；保存失敗不提前開放下一步，重試不需重播。

以上皆為真實 Chrome 載入實際 JS/CSS／MP4；API 回應採合成資料，完整攔截 /api/。測試伺服器不執行 PHP、不讀 .env、不連資料庫。瀏覽器拒絕情境以覆寫 play 回傳指定例外重現，並非宣稱測過所有瀏覽器自動播放政策。

## 執行

工作副本：C:/Users/User/AppData/Local/Temp/idealight-ui-followup-20260926，分支 fix/xiaomai-ui-followup，來源 1bda91d。

PowerShell 設定既有相依後，在專案根目錄執行：

```powershell
$env:PLAYWRIGHT_MODULE='C:/Users/User/AppData/Local/Temp/idealight-windows-bb789a74/site/tests/node_modules/playwright/index.mjs'
$env:TEST_PHP_BINARY='C:/Users/User/AppData/Local/Temp/idealight-windows-bb789a74/php82/php.exe'
node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs
```

結果：12 項通過、0 失敗、0 跳過，程序退出碼 0。數字取自 node:test 最終摘要並對照逐項結果；原始日誌 C:/Users/User/AppData/Local/Temp/idealight-ui-followup-tests.log。新增的前端測試為 6 項，其餘為既有不連資料庫案例。既有全套資料庫案例未執行，不能把此結果稱為專案全測。

app.js、ui-harness.mjs、ui-review.test.mjs 的 node --check 與 git diff --check 通過。獨立 AI 程式審查重跑六項前端測試，未發現明確新增缺陷；不是外部真人認證。

## 學生／施測者 QA 與前端自檢

學生角度驗收播放門檻、重試、分數位置與小螢幕閱讀；施測者角度驗收控制組不提早看到分數、分類分數與理由評語清楚區分、原資料不變。未擴張成正式站攻擊測試，沒有新增登入或權限機制。

| 項目 | 第一輪 | 第二輪 |
|---|---|---|
| 層次 | 32px 粗體標題、分數獨立且可見；合格 | 合格 |
| 留白 | 標題／小標／得分與解析區分清楚；合格 | 合格 |
| 字體 | 沿用 Work Sans 與繁中後備，分數等寬數字；合格 | 合格 |
| 配色 | 沿用淺灰底、橘色操作及既有語意色；合格 | 合格 |
| 對齊 | 桌機分數靠右；手機換至標題下方右對齊；合格 | 合格 |
| 響應式 | 375px 無橫向溢出，得分不超出標題區；合格 | 合格 |
| 狀態 | 播放拒絕／媒體錯誤／保存失敗／焦點／控制組皆有處理；合格 | 合格 |
| 動效 | 保留既有短按鈕回饋；本輪未新增動畫或嘴型；合格 | 合格 |

兩輪皆各一張桌機 1280×800、手機 375×812；第一輪無需修版，第二輪確認。截圖位於工作副本 .screenshots/round1-desktop.png、round1-mobile.png、round2-desktop.png、round2-mobile.png。使用合成回饋展示版面，不能當作真實 AI 評語品質證據。

溢出測量先插入已知 2000px 寬元素，確認能偵測，再移除測實際畫面。影片操作說明位置經 DOM 確認位於影片上方；須知文字於瀏覽器人工核對。未測實體手機／Safari。

Impeccable 自動引擎因既有快取權限／未安裝問題未能執行；依已讀 PRODUCT.md、DESIGN.md 與 craft-floor 直接检查，沒有新增忽略規則，也不宣稱自動偵測通過。

## 剩餘限制與收尾

正式影片、真實 AI 串供／評語品質、外部问卷实际完成回傳，仍維持核對報告所列限制。舊回合不轉新版，避免更動既有研究紀錄。

既有全套會建立／刪除其他測試庫，違反本輪只用 idealightsdg_cake 的限制；不能直接換成真實庫執行。故本輪不以局部通過冒充全測，不自動合併 main、推送或正式部署。可先提供已驗證的本機試玩更新，保留修改分支與既有未提交內容；本機試玩不代表正式施測就緒。

教學：畫面讀後端已算好的分數，不另算一套；分類 36 分不含推理評語。正常自動播放，瀏覽器阻擋時才點按啟動，是為了不讓學生卡住。沒有新增外部服務或 AI 呼叫費用，也沒有變更作答保存路徑。

套用：product-owner-teaching、systematic-debugging、test-driven-development、karpathy-guidelines、writing-plans、executing-plans、using-git-worktrees、impeccable、emil-design-eng、playwright-cli、requesting-code-review、verification-before-completion。Brainstorming 沿用既有核可設計，未重開設計核可；finishing-a-development-branch 依全測限制停在保留分支。
