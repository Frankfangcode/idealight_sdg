# 本輪狀態：下一場新學生只分實驗組、保存 Git checkpoint（2026-10-28）

使用者明確要求本輪不跑測試、先推上 Git 記錄版本；已確認只調整新學生，保留既有分組及作答。api/src/stories.php 新增 STORY_EXPERIMENT_ONLY=1 時新分派採 slot 2／3，代碼2-1／2-2，維持故事順序交替。既有 study／legacy run 的提早返回保留，不做資料庫遷移或批次更改學生。新增本機 .env 設定及 .env.example 示範，設定需手動關閉，沒有日期排程。保留所有既有未提交工作。

依本輪明確指示未執行測試、lint、畫面驗收；不能把前輪53項通過當作本次新分派行為的驗證。產品教學已說明新舊學生範圍、保留交替順序，以及分支checkpoint與正式發布的差別。套用 product-owner-teaching，未套用或宣稱TDD本輪完成。其他環境的 .env 需同步，四組測試未來執行須明確指定 STORY_EXPERIMENT_ONLY=0。

準備將目前 fix/xiaomai-ui-followup 分支的程式、文件、既有測試、兩張實驗圖與使用中人物照片提交推送至既有 origin；不合併main／不部署，因使用者此輪要求為先存版本且明確略過測試。大型影片、重複原始／剪輯素材、.claude/settings.local.json、.env與截圖不納入。影片留原位置，docs/two-stories.md記錄還原必備路徑；本次不是完整媒體／資料庫備份。Git提交／推送結果於對話回報。

---

# 前輪狀態：後測網址更新、前測暫不顯示（2026-10-28）

使用者要求後測改 https://www.surveycake.com/s/1QN67，前測先不顯示。已精準修改本機 .env 的 SURVEYCAKE_POST_URL（未輸出其他設定）及 .env.example；control/consent.html 按鈕為「開始調查」，同意後直接進 game.html；control/survey.html 的前測入口在呼叫 API 前轉入遊戲。保留前測網址與 API、原歷史紀錄，不記已做過／已完成，不刪資料。後測仍限兩故事完成後，仍沿用原學號 query 與自我回報完成流程。原流程圖片仍是歷史內容。本輪保留全部既有未提交內容與分支。

產品教學已交付：暫時隱藏入口並保留設定，比刪除前測功能容易恢復；畫面轉入遊戲而不呼叫前測 API，避免新增不實完成紀錄。無新資料表、套件、費用或服務。未改對外參數、權限及完成門檻，未新增真實個資傳送操作。

TDD：先改 hidden pre-survey 案例，原版仍停在前測而 timeout 失敗；轉址後通過。consent 同意後進遊戲、舊前測入口轉址且 ck_surveys 前測零紀錄、後測 iframe 新 origin/path 與既有學號 query、後測無 skip 均驗證。53 項安全範圍回歸全部通過：.screenshots/survey-link-regression.log，Node summary 53 passed／0 failed／0 skipped，exit0；沿用前輪11檔命令與 TEST_PHP_BINARY=C:/xampp/php/php.exe。git diff --check 通過。這不是全專案全套，仍受建刪其他測試庫限制，未commit／merge／push。

原 Apache8081 .screenshots/survey-link-live.mjs 用合成帳號驗證 .env 實際提供新後測網址、前測舊入口無紀錄轉入遊戲、同意後直接進遊戲；清理後不能登入，無 pageerror。攔截 SurveyCake 網域，以本地 fixture 代替外部問卷內容，未傳送合成學號到第三方、未送出問卷；不宣稱 SurveyCake 真實內容或送出流程已驗收。兩輪1280×800／375×812，consent／post 共8張截圖均讀回（.screenshots/survey-link-round{1,2}-{consent,post}-{desktop,mobile}.png）。八項人工自檢：層次（開始調查／後測提示）、留白與字體配色（沿用原版）、對齊（按鈕正常）、響應式（可讀無可見溢出）、狀態（同意門檻／直接跳轉）、動效（未新增）。Impeccable 沿用人工fallback，不宣稱hook掃描通過。

簡短 QA 以學生流程／施測者紀錄正確性驗證，沿用原權限與合成資料門檻測試，未擴大第三方主動測試。docs/two-stories.md 已記錄。lab http://127.0.0.1:8081/ 已生效；其他部署環境仍須同步 SURVEYCAKE_POST_URL（.env 不提交）。已套用 product-owner-teaching、test-driven-development、verification-before-completion、impeccable（人工）、emil-design-eng、playwright-cli，沿用已讀政策。下一步仍是既有完整測試環境與流程圖更新事項。

---

# 前輪狀態：實驗組回饋改為 30 秒（2026-10-28）

使用者僅要求實驗組回饋載入後倒數 40→30 秒。修改 story_game.php 與 story_content.php 的 feedback 時限、app.js 的顯示預設值、consent 的秒數說明、相關 HTTP／UI 測試。維持成功取得內容後起算、重整續算、可提前繼續及到期自動換關；控制組無倒數。其餘時限、研究揭露規則及計分不變。保留原分支與所有既有未提交內容；無新增表、套件、費用或服務。

TDD：HTTP 案例先觀察 40 !== 30 失敗，改後通過，並驗證實驗組兩故事初始 30、已過 20 秒剩 10、控制組 null。UI 驗證初始 0:30、將合成帳號起點調至 29 秒前後重整，自動換關。53 項安全範圍回歸全部通過（.screenshots/feedback30-regression.log，Node summary 53 passed／0 failed／0 skipped，exit0；沿用前輪 11 檔命令、TEST_PHP_BINARY=C:/xampp/php/php.exe）。兩 PHP lint、JS syntax、git diff --check 通過。原 Apache8081 .screenshots/feedback30-live.mjs 用合成帳號驗證 30 秒、續算、換關及控制組無倒數，無 pageerror、清理後不能登入。未呼叫真實 AI。

兩輪各桌機1280×800／手機375×812：schedule-visual 的 score／detailed 與 instructions-visual 的說明頁均截圖讀回。證據 .screenshots/schedule-roundfeedback30-{1,2}-* 及 instructions-roundfeedback30-{1,2}-*。截圖工具在縮視窗後會保留捲動位置，已重置 window／overlay／modal 捲動後重拍回饋，避免把捲動狀態誤當版面裁切。兩輪八項自檢：層次（時計／分數）、留白（原版）、字體（30秒清楚）、配色（原色）、對齊（右上）、響應式（探針校準無溢出）、狀態（兩種回饋／控制／倒數）、動效（未新增）。Impeccable 人工fallback，未宣稱自動hook掃描。簡短QA以學生與施測者角度驗證計時及組別差異，無新敏感入口，未擴完整資安模擬。已交付產品說明：沿用伺服器起點比只改畫面可靠，每故事六關用滿少1分鐘。

docs/two-stories.md 已更新最新時限與估算：實驗組每故事約36:25／36:52，整場含前後測安排約101:18，仍非硬上限。lab http://127.0.0.1:8081/ 工作區修改已生效；完整全套仍受既有建刪其他測試庫授權限制，未commit／merge／push。原流程圖舊時間與完整測試環境仍是既有待決項。套用 product-owner-teaching、test-driven-development、verification-before-completion、impeccable（人工）、emil-design-eng、playwright-cli，沿用已讀政策。

---

# 前輪狀態：訊問 1 分、作答 2 分、實驗組回饋 40 秒與休息 3 分（2026-10-27）

使用者在兩次要求只討論後，最新明確核可實作：影片不可暫停，實驗組每關回饋閱讀 40 秒，中場休息 5→3 分鐘，其餘依推薦訊問 1 分＋作答 2 分。優先採用這份明確時限；已說明實驗組每故事六次回饋加 4 分，無法同時保證 35 分鐘。保留原分支 fix/xiaomai-ui-followup 及所有既有未提交工作。

修改 story_game.php／story_content.php（訊問 60、combined 120、break 180、feedback 40）、story_ai.php（僅實驗組回饋取得成功後保存閱讀起點並回傳 remaining）、app.js（回饋倒數到期換關、重整續算、保留繼續按鈕；兩故事影片無暫停控制，播放後暫停事件自動恢復，正常速度；舊單故事模式不變）、review.css（回饋右上大時計／手機排版）、consent（新的時限說明）、相關測試。原研究揭露規則未變：實驗組第一故事只顯示分數，第二故事才有解析與 AI；控制組不加 40 秒，保留原完成提示。無新表、外部套件、服務、額外 AI 呼叫或計分更動。已有在途回合按原起點套用新短時限，可能到期，未批次改寫真實資料。

TDD 證據：訊問第 61 秒原不能前進→60 秒通過；四種分派休息原 300 秒→180 秒通過；回饋原無 readingRemaining→實驗組 40 秒／控制組 null／重讀剩餘 20 秒通過；UI 原無 feedbackClock→40 秒與重整後自動換關通過；影片原 controls=true→controls=false 且 pause 後自動繼續通過。第一次安全回歸 52/53，唯一失敗是休息 UI 仍預期 5:00，依新契約改期待 3:00 後局部重測及全範圍重跑通過。最終 .screenshots/schedule-final-regression.log：53 passed／0 failed／0 skipped，exit 0。命令為前輪相同 11 檔安全範圍、TEST_PHP_BINARY=C:/xampp/php/php.exe，非全專案全套。三份 PHP lint、JS syntax、git diff --check 通過。

原站 .screenshots/schedule-live.mjs 於 Apache 8081 僅用合成帳號驗證介紹／影片後／發言計時及新訊問 1 分、實驗組回饋 40 秒與到期第 2 關、控制組無回饋倒數、影片無暫停控制。無 pageerror，清理後登入失敗。測試不呼叫真實 AI，原站實驗組第一故事採分數回饋，隔離測試第二故事使用 fake AI。

前端兩輪 .screenshots/schedule-visual.mjs 各 1280×800／375×812，第一輪發現時鐘太小、手機落在分數下面，已放大及定位右上；第二輪 score/detailed 四張均讀回合格。consent 使用 instructions-visual.mjs 做 schedule1／schedule2 兩輪各桌機手機並讀回。八項自評：層次（時計／分數／內容）、留白（沿用滿版回饋）、字體（時間放大）、配色（既有橘色時計）、對齊（手機右上）、響應式（探針校準後確認無溢出）、狀態（控制／實驗、得分／詳細、倒數／自動前進）、動效（未新增）。Impeccable 仍是人工 fallback，未宣稱自動 hooks 掃描通過。簡短 QA 從學生閱讀和研究施測規則驗證，屬 AI 多角度檢查；無新敏感入口，未另做完整資安模擬。教學已交付主方案與既有純前端備案比較、資料流、成本與限制。

估算沿用已校準的 12 影片 duration：控制組每故事約 33:25／33:52；實驗組約 37:25／37:52。兩故事＋3 分休息＋前測 10／後測 10／實驗回饋 5 分：控制組約 95:18，實驗組約 103:18。可能因提前而縮短、AI／網路／完成提示而延長；不能保證瀏覽器關閉或斷線也準時。原 Picture1 舊故事 25 分與休息 5 分未重製；consent 已註明實際以新文字時限為準。詳 docs/two-stories.md 最新節。

lab http://127.0.0.1:8081/ 直接讀工作區已生效，未另建站。全專案測試仍受先前建刪其他資料庫授權限制，故未 commit／merge／push。下一步是原流程圖更新及完整驗證環境的既有待決事項。已套用 product-owner-teaching、systematic-debugging、test-driven-development、impeccable（人工）、emil-design-eng、playwright-cli、verification-before-completion；沿用已讀政策。

---

# 前輪狀態：25 秒介紹、60 秒發言、影片後 10 秒與總時長（2026-10-27）

使用者確認：六個人六種說法介紹固定 25 秒不能跳過、右上角倒數；每關六人發言 1 分鐘，六人全讀可提前，時間到自動進訊問；影片看完後 10 秒自動進同一關六人發言，保留前進按鈕。不是跳過整關。沿用既有分支 fix/xiaomai-ui-followup 與全部未提交修改，沒有覆寫他人工作。

修改 api/src/story_game.php、story_content.php、assets/js/game/app.js：介紹伺服器門檻與停用按鈕；影片完成保存才起算、重送不重設；發言進入起算；兩者沿用伺服器剩餘時間跨重整。為既有已在新限時階段但沒有起點的回合補起點。時間到進下一階段，暫時連線失敗重試。發言與影片後時間顯示既有右上 timer，保留照片／翻面排版。檢查時發現已完成影片重整仍提示開始播放，已修成顯示已看完且不自動重播。無新資料表、套件、付費服務、動畫、計分或作答變更。

TDD：介紹原 60 秒與可提前失敗→25 秒門檻通過；影片完成剩餘時間原 null 失敗→10 秒持久起點通過；瀏覽器原影片未完就顯示倒數失敗→完成後才啟動通過；重整錯誤要求重播失敗→已看完提示通過。新增兩個行為案例、修訂介紹案例；既有測試以 elapseIntroduction 僅調整合成帳號起點，不放寬流程斷言。覆蓋自動換頁、未讀完到期前進、全讀後提前前進、影片按鈕提前、重整續算及原權限／缺片門檻。產品理解檢查點已在回歸前交付：伺服器起點方案可靠且沿用既有儲存；只做前端倒數備案可被重整重設故不採用。

驗證：TEST_PHP_BINARY=C:/xampp/php/php.exe；安全範圍 11 檔回歸命令沿用前輪，.screenshots/timing-regression.log Node summary 53 passed／0 failed／0 skipped，exit 0（不是全專案全套）。node --check app.js 與 git diff --check 通過。原 Apache 8081 .screenshots/timing-live.mjs 用合成學生驗證介紹到期→影片、影片已完倒數→發言、發言到期→訊問，無 pageerror，清理後確認不能登入。

前端 .screenshots/timing-visual.mjs 兩輪各 1280×800／375×812，介紹、發言、影片後三頁均截圖讀回。最終 timing-round2-{intro,testimony,video}-{desktop,mobile}.png。八項自檢：層次（倒數與階段標籤）、留白（沿用緊湊卡片）、字體（時間可讀）、配色（既有計時色）、對齊（右上）、響應式（無橫向溢出）、狀態（停用／已完／可前進）、動效（未新增）。首輪已完影片仍要求播放的文案／按鈕問題已修；第二輪合格。溢出量測先用 4000px 探針校準：document.scrollWidth 因裁切無法測出探針，改用目標元素 bounding rect 後能正確分辨，不拿失準結果下結論。Impeccable 沿用缺引擎的人工檢查，未宣稱 hook 自動掃描通過。QA 以學生閱讀／施測者時間門檻角度檢查，屬 AI 檢查；未新增敏感輸入，不擴大資安模擬。

總時長：.screenshots/measure-videos.mjs 讀取實際 JSON 指向的 12 支影片 video.duration，先以已知 1 秒 fixture 校準。蛋糕 480.226009 秒、飲料 507.3 秒。各階段用滿加休息約 2 小時 12 分 18 秒；另加前測 10、後測 10、實驗回饋 5 分約 2 小時 37 分 18 秒。不是硬上限：可提前的階段會縮短，影片暫停／各關回饋／網路會增加。詳 docs/two-stories.md 最新節；原 Picture1 每故事 25 分與舊 90–100 分文案不符合實際，沒有擅改原圖或縮短其他階段，已向使用者指出。

lab 原網址 http://127.0.0.1:8081/ 直接讀工作區已生效。完整全套仍受 docs/open-questions.md 的建刪其他資料庫範圍限制，未 commit／merge／push、未另建站或宣稱正式發布。下一步為施測總時長／流程圖文字安排及完整驗證環境範圍決定。套用 systematic-debugging、product-owner-teaching、test-driven-development、impeccable（人工）、emil-design-eng、playwright-cli、verification-before-completion，沿用已讀技能與政策。

---

# 前輪狀態：修正六人發言混合翻面的大塊空洞（2026-10-27 後續）

使用者截圖為1、2已展開文字、3仍是照片，第二排被最高照片推下，文字下方出現大洞。根因是前輪只縮短卡片自身，tgrid仍按整排最高卡決定下一排起點；這是前輪漏驗的混合狀態。使用者已授權局部排版修正，沿用方形照片／衣著取景與點卡翻面，不重跑設計批准。

修改 app.js、review.css：用CSS Grid細列與原生ResizeObserver按卡片實際高度安排起點；桌機維持1／4、2／5、3／6固定三欄，各自緊接；手機單欄1至6，DOM順序不變。每次render清除舊觀察再註冊目前卡片；尺寸／字體引起高度變化會更新，僅值不同才寫style。欄數由CSS變數與斷點決定，避免舊inline欄位置產生隱含欄而誤判手機欄數。不新增套件／服務／費用，不改作答、已讀、計時、分數或原圖。備案硬拉卡片等高會把空白放回卡內，與使用者先前減空白要求相反，未採用。更新DESIGN與測試。保留既有未提交內容及fix/xiaomai-ui-followup分支。

TDD：新增 tests/story-ui.test.mjs 的 mixed testimony案例，原版兩個短卡下方間距超過250px而失敗（getBoundingClientRect逐對比同欄上下卡）；修改後通過。開發中首次修法在手機留下舊欄位且順序不符，測試抓到後以CSS欄數與明確逐欄累計行起點修復。案例涵蓋展開兩卡、翻回、縮至375px時不重疊／順序不亂、六卡讀完可前進；沿用playwright真實PHP與合成帳號。`.screenshots/mixed-visual.mjs` 兩故事／兩尺寸混合翻面與圖解碼、圖片比例、操作驗證兩輪通過。

兩輪各1280×800／375×812截圖均讀回，最終 `.screenshots/mixed-round2-desktop.png`、`mixed-round2-mobile.png`。八項兩輪合格：層次（人名／證詞清楚）、留白（各欄短卡下緊接下一人）、字體（原樣）、配色（原圖原色）、對齊（欄寬／上緣一致，非強迫每排同高）、響應式（單欄順序、無溢出且先以4000px探針校準）、狀態（已讀／照片／文字混合）、動效（未新增，保留原hover）。Impeccable沿用缺引擎人工fallback，未宣稱自動掃描通過。QA從學生混合閱讀、施測者確認讀取門檻未變兩角度驗證，屬AI檢查；未增加敏感入口，不新增完整資安模擬。產品理解與取捨已在回歸前說明。

原Apache8081 `.screenshots/mixed-live.mjs` 驗證原站混合卡同欄間距與翻面正常、無pageerror，合成帳號清理後不能登入。app.js語法、git diff --check通過。安全範圍11檔回歸命令同前輪，TEST_PHP_BINARY=C:/xampp/php/php.exe；`.screenshots/mixed-regression.log` Node summary：51通過／0失敗／0跳過，exit0。全專案全套仍受既有建刪其他資料庫限制，因此未commit／merge／push；lab直接讀工作區已生效，未另建站。下一步仍是完整驗證環境範圍決定。已套用systematic-debugging、product-owner-teaching、test-driven-development、impeccable（人工）、emil-design-eng、playwright-cli、verification-before-completion，沿用using-superpowers。

---

# 前輪狀態：移除圖片提示與須知標題（2026-10-27 後續）

使用者明確要求移除「點擊圖片可開啟完整尺寸，放大閱讀。」與「調查須知」。control/consent.html 刪除新舊說明區的圖片提示及雙故事須知h3，保留圖片連結與所有內文；tests/story-ui.test.mjs 的既有說明順序驗證改定位第一段說明，保留同意／前測操作測試。沒有新增功能、資料操作、費用或外部相依。直接刪除HTML文字比CSS隱藏更符合移除要求；圖片開啟原尺寸功能保持。保留所有既有差異與目前分支，不新增無關改動。

兩輪 `.screenshots/instructions-visual.mjs` 通過，1280×800及375×812均讀回；最終 `.screenshots/instructions-roundremove-labels-2-desktop.png`、`instructions-roundremove-labels-2-mobile.png`。八項兩輪皆合格：層次（流程圖直接接內文）、留白（原卡片）、字體／配色（原樣）、對齊（同一內容邊線）、響應式（既有4000px探針校準後無溢出）、狀態（載入完及原操作）、動效（未新增）。學生／施測者角度核對只少指定文字、規則仍在；未新增完整資安模擬。原Apache8081的consent HTTP200且原始位元組與磁碟完全相同；git diff --check通過。純文字刪除依測試政策不新增瑣碎斷言或人工紅燈；沿用既有流程測試。

安全範圍11檔回歸命令同前輪，TEST_PHP_BINARY=C:/xampp/php/php.exe；`.screenshots/remove-labels-regression.log` Node summary為50通過／0失敗／0跳過，實際退出碼0。既有全專案全套仍受建刪其他資料庫限制；未commit／merge／push，原lab直接提供工作區已生效。技能沿用 product-owner-teaching、impeccable（缺引擎人工fallback）、emil-design-eng、playwright-cli、verification-before-completion；測試與QA詳規沿用本對話已讀版本。

---

# 前輪狀態：六人發言卡露出更多衣著並收掉空白（2026-10-27 後續）

使用者截圖指定六人發言卡，要求人物露出更多、看到穿著、減少空白。只修改 assets/css/game/review.css：tgrid照片由固定210px／手機170px改為正方形比例；取消closed區96px最小高度、隱藏空trait、減少姓名上方距離，卡片靠頂避免被相鄰長說詞拉高。桌機三欄／手機單欄保留，兩故事均套用；介紹卡與訊問圖未改。原圖未改，計分／作答／資料庫不變。更新DESIGN與本文件，保留既有未提交內容及fix/xiaomai-ui-followup分支。

教學：像把狹長相框改成方框，增加上半身取景，把沒有文字的空白說明欄收掉。備案顯示完整直式原圖會讓卡片過長，故採方形取景；代價是比舊橫幅更高，需要向下捲動。沿用照片與CSS，無新相依／費用／外部服務；無新安全入口。已在回歸前交付產品效果、結構、替代方案與限制。

驗證：一次性瀏覽器驗收 `.screenshots/testimony-framing.mjs`（不為純CSS新增永久瑣碎測試），先以原畫面證明方形取景檢查失敗，再修改CSS通過；最初腳本括號語法錯誤已先修正，不將該錯誤當產品紅燈。照片寬高來自getBoundingClientRect；兩故事桌機／手機皆實際載入、點開／翻回六卡，已讀後可進訊問。溢出方法先以4000px探針校準。兩輪各1280×800／375×812已讀回；最終 `.screenshots/framing-round2-desktop.png`、`framing-round2-mobile.png`。八項兩輪均合格：層次（人物主導）、留白（空區已收）、字體（原樣）、配色（原圖及原底色）、對齊（卡片頂對齊）、響應式（無溢出／手機單欄）、狀態（已讀／翻面／前進）、動效（原互動保留、未新增動畫）。Impeccable沿用已揭露的人工fallback，未宣稱hook掃描通過。

QA：學生角度確認人物穿著可辨、文字區緊湊、翻面操作；施測者角度確認兩故事圖片與讀取門檻未改，屬AI多角度檢查。原Apache8081 `.screenshots/framing-live.mjs` 實測飲料正方形取景與點開／翻回通過，無pageerror；合成帳號清除後無法再登入。安全範圍11檔回歸命令同前輪，TEST_PHP_BINARY=C:/xampp/php/php.exe；`.screenshots/framing-regression.log` Node summary：50通過／0失敗／0跳過，exit0；git diff --check通過。未新增完整資安模擬。

lab原網址已生效。整個專案全套仍受既有建刪其他資料庫限制，50項不是全專案全套，因此未commit／merge／push。下一步仍是既有完整驗證環境範圍決定。已套用 product-owner-teaching、test-driven-development（一次性紅綠驗收）、impeccable（人工）、emil-design-eng、playwright-cli（既有Playwright）、verification-before-completion，沿用using-superpowers。

---

# 前輪狀態：接上使用者提供的兩故事人物照片（2026-10-27 後續）

使用者已將 cake／drink 照片放入 media，要求查看；沿用前輪補圖目的，直接接上明確對應的六位角色。cake 使用 media/cake/char_1.jpg 至 char_6.jpg；drink 使用 ref_zhou_yixing、ref_bai_erqing、ref_gu_sanyao、ref_han_sicheng、ref_xia_wuqiao、ref_tang_liuya.jpeg。已讀原圖尺寸並製作1200px檢視縮圖 `.screenshots/portrait-assets.jpg`，沒有改動原始素材。姓名依檔名對應，未逐一與影片核驗；林知遠、場景、物件不混入六位角色。

實作：兩份 api/stories JSON 僅更新 characters[].image；app.js 的介紹沿用圖片欄位，新增共用 portraitStyle 讓證詞卡／訊問大圖／小頭像依故事取圖，預載亦改讀角色照片，避免飲料只在介紹正確、其他頁仍用蛋糕圖片。舊單故事仍用原有素材；不改計分、角色文字或學生作答。tests/story-harness.mjs 的隔離缺片副本只額外複製兩故事圖片，不複製影片；有片模式仍用一秒fixture。更新 story-ui 測試、PRODUCT、two-stories、tests/README。保留 fix/xiaomai-ui-followup@19c82b0 的所有既有差異，不移動／覆蓋使用者素材。

產品理解檢查點在回歸前已交付：media照片→故事角色圖片地址→介紹／證詞／訊問；像讓同一人的名牌始終對上同一張照片。推薦直接讀使用者原路徑，備案複製到舊assets會多一套維護來源，因此未採用。原卡片裁切與角色互動沿用，沒有新套件／費用／外部服務或資料表；圖片檔名與故事內容是本機受控素材，未增加上傳或任意外部輸入入口。

TDD：新增 each story loads 瀏覽器案例先因蛋糕仍指向assets而失敗，修正後通過；逐一比對兩故事角色圖片src、decode實際載入，以及每位證詞照片／訊問照片／頭像的computed backgroundImage與實際圖片載入。原飲料測試由姓名占位改驗指定照片；缺片阻擋／有片實播仍通過。安全範圍11檔回歸命令同前輪，TEST_PHP_BINARY=C:/xampp/php/php.exe，`.screenshots/portraits-regression.log` Node summary：50通過／0失敗／0跳過，實際exit 0。app.js語法、git diff --check通過。

前端兩輪：`.screenshots/portraits-visual.mjs` 各1280×800／375×812，皆讀回；最終 `.screenshots/portraits-round2-desktop.png`、`portraits-round2-mobile.png`。八項兩輪均合格：層次（人物／姓名／職務）、留白（原卡片間距）、字體（原樣）、配色（原底色與使用者照片）、對齊（卡片一致）、響應式（手機兩欄無溢出，4000px探針先校準）、狀態（圖解碼、角色選取、倒數／前進）、動效（既有按鈕回饋、未新增動畫）。Impeccable沿用缺引擎的人工fallback，沒有宣稱hook掃描通過。QA以學生辨識人物、施測者防止故事串圖及缺片仍阻擋的角度實測，屬AI多角度檢查；未觸發新增完整資安模擬。

原lab驗收：`.screenshots/portraits-live.mjs` 真實Apache8081登入→蛋糕六圖decode→跨故事→飲料六圖decode通過、無pageerror，合成帳號清理後不能再登入。app.js及12張圖均HTTP200，原始位元組SHA256與磁碟一致（Node arrayBuffer／已知abc校準）。原網址已生效，未另建站。剩餘限制：全專案全套仍受既有禁止建刪其他資料庫限制，50項不等於全套；因此未commit／merge／push。下一步仍是既有完整測試環境範圍決定；人物照片缺少已解除。已套用 product-owner-teaching、test-driven-development、impeccable（人工）、emil-design-eng、playwright-cli（既有Playwright）、verification-before-completion，沿用using-superpowers。

---

# 前輪狀態：調查須知移至流程圖下（2026-10-27 後續）

使用者要求把截圖中的調查須知放到 Picture1 下方，原頁不再需要，並詢問是否有飲料人物照。已將完整計分／三步操作／自動保存說明移到 control/consent.html，取代原雙故事簡短說明，保留操作列圖；開場人物介紹倒數到時或點「開始調查」直接進第一關影片。舊 step 2 或離線到期的進度重新載入時接到遊戲。只改雙故事，舊單故事須知維持。改 assets/js/game/app.js、control/consent.html、tests/story-ui.test.mjs、PRODUCT.md、docs/two-stories.md 及本文件；保留 fix/xiaomai-ui-followup@19c82b0 上全部既有未提交內容。

人物素材答覆：搜尋 assets 與 media 的圖片及飲料／角色檔名，未找到可確認為飲料六人的獨立照片；已有 media/drink 六支影片。未擅自擷取、生成或套蛋糕照片；建議後續從影片擷取並核對姓名，本輪不宣稱照片已補齊。

產品理解已於回歸前交付：像把分散講義整併成一份，學生在前測前讀完整規則，介紹後直接開始。主方案沿用既有伺服器進度契約，前端依序完成 step 2／3；備案改資料表／流程版本成本及遷移風險較大，未採用。沒有新依賴、外部服務、費用、資料遷移或真實學生資料修改。計分與作答時間保持。手動提前開始介紹仍可用，影片觀看門檻不變。

TDD：介紹直接進影片測試先超時失敗、修正後通過；須知搬至流程圖下的測試先找不到標題失敗、修改後通過，仍驗證同意勾選才能進前測。更新原飲料手動開始與換故事按鈕期待。`.screenshots/instructions-visual.mjs` 驗證舊 step 2 恢復／重整與新說明頁，兩輪通過。QA 以學生（閱讀／手動與自動前進／重整）與施測者（規則完整、缺片仍阻擋）角度實測，屬 AI 多角度審查；未觸發登入／權限／個資等新變更，未新增完整資安模擬。合成帳號測後清除並確認登入失敗。

兩輪各1280×800／375×812截圖已讀回，最終 `.screenshots/instructions-round2-desktop.png`、`instructions-round2-mobile.png`。第一輪八項：層次／字體／配色受載入遮罩影響不可判定，留白／對齊被固定頁首遮住流程圖，響應式測量通過，狀態尚在載入，動效未新增；修正檢查工具等待既有 preloader 隱藏並避開固定頁首。第二輪八項：層次（圖→須知→步驟）清楚；留白沿原卡片；字體沿既有同意頁；配色原白底深字／原圖；對齊一致；響應式無水平溢出（先用4000px探針校準）；狀態同意／按鈕／圖片開啟可用；動效沿原按鈕，未寫動畫。手機圖較小仍可點開原尺寸。Impeccable 引擎缺失沿用已揭露人工檢查，不宣稱自動掃描通過。

安全範圍11檔回歸命令同前輪，TEST_PHP_BINARY=C:/xampp/php/php.exe，`.screenshots/instructions-regression.log`：Node summary 49通過／0失敗／0跳過，實際退出碼0。app.js語法與git diff --check通過。原lab `.screenshots/instructions-live.mjs` 通過倒數直接進影片與既有跨故事流程，無pageerror；首次因舊檢查仍等待已移除須知標題失敗，更新期待後通過。Node原始位元組SHA256比較（已知abc校準）確認原Apache8081提供的consent/app.js與磁碟一致，HTTP200。

剩餘限制：全專案全套仍受既有建刪其他資料庫限制；49項不是全專案全套，因此未commit／merge／push。lab直接讀工作區，原網址已生效；沒有另建站或正式發布宣稱。下一步為飲料人物照片來源／對應，以及既有完整測試環境範圍決定。已套用 product-owner-teaching、test-driven-development、impeccable（人工fallback）、emil-design-eng、playwright-cli（既有Playwright測試）、verification-before-completion，沿用using-superpowers。

---

# 前輪狀態：飲料故事人物圖片原因確認（2026-10-27 後續）

使用者提供「周一興／白二晴／顧三曜」等姓名卡截圖，要求查明偶爾無圖片。已確認該截圖是飲料故事的既有缺圖替代畫面：api/stories/drink-v2.json 六個 characters[].image 均為 null；story_content.php 原樣提供空圖片欄位，app.js:663 在缺圖時直接產生姓名 div，沒有建立 img 或發出人物照片下載。蛋糕 cake-20260929.json 六個角色都有 assets/img/game/char_1.jpg 至 char_6.jpg，逐項 fs.existsSync 確認檔案存在。因此此截圖的原因是飲料人物照片尚未設定，不是已證實的隨機載入失敗；兩故事切換可以解釋有時有圖的觀感，其他頁面偶發失敗未經本輪證實。

證據：Node 逐角色輸出 name/image/exists，比對有圖蛋糕作為對照；既有真實 Chrome 測試 `TEST_PHP_BINARY=C:/xampp/php/php.exe node --test --test-name-pattern='drink uses its own characters' tests/story-ui.test.mjs` 1 通過／0 失敗，驗證飲料姓名、未誤用蛋糕照片及前進保存。沿用 docs/two-stories.md 的缺照片使用姓名決策。本輪未修改產品程式或 UI，無需新增畫面兩輪或全套回歸，未 commit／push／部署。

產品理解：角色資料的 image 是照片地址，像名冊中的照片欄；目前飲料名冊照片欄空白，所以畫面顯示姓名。推薦補上與飲料影片角色一致的正式圖片並指定對應；備案維持姓名卡，可使用但識別體驗較弱。未擅自生成或套用蛋糕人物，沒有新增費用或改動學生資料。下一步需要確認飲料人物照片素材來源與人物對應；本輪是原因調查，不宣稱照片已補齊。已套用 systematic-debugging、product-owner-teaching、verification-before-completion，沿用 using-superpowers 與 Playwright 驗證方式。

---

# 前輪狀態：小麥圖片、關卡說明與介紹計時（2026-10-27）

本輪授權：實驗說明加入 Picture1.png 流程圖，說明下接 messageImage_1793005848507.jpg 操作列；兩故事選證據頁更新兩句操作說明，六關頁首依證詞／假設／推論／推論／因果／論點更新；一分鐘六人介紹計時移至右上角並放大。沿用 fix/xiaomai-ui-followup@19c82b0，保留所有既有未提交內容，沒有更動 .env、資料庫結構、真實學生作答或影片。

修改：control/consent.html 的雙故事說明放入原始圖片，新增 assets/img/game/experiment-timeline.png、experiment-navigation.jpg，可點開原圖閱讀；assets/js/game/app.js 共用六關文案與分類操作提示，介紹倒數沿用 topbar 計時元件；assets/css/game/review.css 讓單獨計時框在手機也靠右；tests/story-ui.test.mjs 增加介紹計時位置與字級驗證。局部決定：修正原訊息「請點思考」為「請思考」，保留其他既有提示、分類標籤、計分與流程；圖片是內容素材，沒有把圖中文字當作額外操作授權。原先缺少 STATUS.md，不另建專案骨架。

產品理解：學生先看完整流程圖，再讀說明及關卡操作圖；兩故事共用畫面依關號顯示任務，原倒數只改顯示位置。像換講義與移動教室的鐘；資料仍沿原有伺服器進度保存。主方案直接使用提供的圖片及既有計時元件，備案重畫流程圖／另造計時器較易偏離原意或分歧，故未採用。沒有新相依、費用或安全入口。手機原圖縮小後字較小，提供原尺寸開啟；維持原兩欄人物卡，可垂直捲動。

驗證：介紹倒數測試先失敗（topbar 中找不到 introClock），修改後通過，仍驗證到時自動進入調查須知。Playwright／Chrome 經真實 PHP／資料庫與合成帳號，`.screenshots/oct27-visual.mjs` 兩輪均通過：圖片載入及點開原圖、兩故事六關說明、分類點選、右上角計時與無 pageerror。橫向溢出檢查先以 4000px 探針確認方法能測出，再驗證畫面。兩輪各 1280×800／375×812 截圖已讀回；最終 `.screenshots/oct27-round2-desktop.png`、`oct27-round2-mobile.png`。八項自評兩輪皆合格：層次（頁首計時醒目）、留白（原版面）、字體（沿用且計時放大）、配色（既有橘色計時）、對齊（右側／人物卡）、響應式（無水平溢出）、狀態（計時／前進／圖片連結）、動效（保留原按鈕回饋，未寫動畫）。Impeccable 引擎缺少，context 未執行；依 PRODUCT／DESIGN／craft-floor 人工檢查，未宣稱自動 hook 通過，無忽略規則。

教學檢查點在回歸前已交付。沿用安全範圍 11 檔回歸：`TEST_PHP_BINARY=C:/xampp/php/php.exe node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs tests/immersion.test.mjs tests/story-content.test.mjs tests/stories.test.mjs tests/story-game.test.mjs tests/story-http.test.mjs tests/story-ui.test.mjs`，49 通過／0 失敗／0 跳過，exit 0，完整 `.screenshots/oct27-regression.log`。數字取自 Node 測試 summary，直接保留程序退出碼。app.js 語法及 git diff --check 通過。沒有獨立 build 流程。

QA：學生角度實測圖片開啟、介紹倒數、兩故事分類；施測者角度核對六關要求與既有計時行為，屬 AI 多角度檢查。只修改內容／呈現，未觸發新增完整資安模擬。原 lab `http://127.0.0.1:8081/` 的 `.screenshots/live-flow.mjs` 通過倒數及既有跨故事流程；合成帳號清理後確認不能登入。五個本輪產品檔案 HTTP 200 且原始位元組 SHA256 與磁碟一致（Node arrayBuffer，先以已知 abc SHA256 校準）。最初 PowerShell 將 HTTP 文字轉碼後比較不一致，未當作站點不同的證據；改讀原始位元組後一致。

剩餘限制：整個專案全套仍涉及既有禁止的建刪其他資料庫操作，49 項不是全專案全套；沿用 docs/open-questions.md 的既有阻塞，因此未 commit／merge／push。lab 直接提供工作區，這次修改已在原網址生效，沒有另建站或宣稱正式發布完成。真實 AI 品質及外部問卷送出不屬本輪驗證。下一步：處理完整隔離測試環境範圍後再依既定流程全測／合併／推送。

已套用 using-superpowers、product-owner-teaching、test-driven-development、impeccable（人工 fallback）、emil-design-eng、playwright-cli（沿用現有 Playwright 測試工具）、verification-before-completion。

---

# 前輪狀態：兩項缺片測試已修復（2026-10-18 後續）

使用者要求修好前輪兩項既有缺片測試。沿用 `fix/xiaomai-ui-followup@19c82b0` 與所有既有未提交內容。本輪只修改 `tests/story-harness.mjs`、`tests/story-http.test.mjs`、`tests/story-ui.test.mjs` 及測試／交接文件；沒有改產品程式、學生介面、環境設定或lab影片。

根因與修法：原測試直接使用工作區 media，飲料影片補齊後不再符合缺片前提。先重現 HTTP 預期409實得200、UI等待素材待補30秒逾時。測試工具新增 `media:'missing'/'present'` 選項，建立隨機命名的獨立暫存站點，複製程式及畫面資源但不複製media／.env；資料庫設定僅傳入子程序環境、AI固定本機假服務。缺片案例確認公開狀態available=false、影片網址404、完成觀看409且狀態未前進；原本越權斷言均保留。UI缺片案例確認待補／不可前進／重整保留。另以既有一秒影片fixture在副本驗證真實Chrome播放到ended、伺服器保存completed，再前進testimony，沒有假造ended或放寬斷言。

產品理解檢查點：像另外搭練習教室測試「教材缺少」與「教材齊備」，與lab現有影片脫鉤；資料流仍是真實Chrome→獨立PHP→既有合成學生紀錄。推薦真實副本而非只mock回應，代價是複製少量站點資源，但能驗證PHP實際檔案檢查與畫面一致。沒有新增套件、外部服務、付費或資料表。測試結束先清除自己的合成學生／分派序列、確認不能再登入，再停止服務並移除自己的暫存副本；刪除前確認實際路徑位於預期temp父目錄且符合自建名稱前綴，刪除後assert不存在。

驗證：兩個原失敗案例各自RED→GREEN；有片實播對照通過。`TEST_PHP_BINARY=C:/xampp/php/php.exe`，既有Playwright 1.63.0／Chrome。命令 `node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs tests/immersion.test.mjs tests/story-content.test.mjs tests/stories.test.mjs tests/story-game.test.mjs tests/story-http.test.mjs tests/story-ui.test.mjs`：**47通過／0失敗／0跳過，exit 0**，`.screenshots/media-fixture-regression.log`。3個測試JS語法與`git diff --check`通過。以PowerShell Get-FileHash SHA256保存六支飲料影片並逐路徑重算比較，全部相同（基準`.screenshots/media-test-fix-before.json`）。廣回歸後無可執行程式修改，只有文件更新；測試工具註解曾在測試期間澄清措辭，未改行為。

QA：學生角度確認缺片不誤放行、有片可實播與前進；維護者角度確認不受lab補片影響、清理自己的副本和合成帳號。這是AI多角度檢查。只修測試工具，沒有新的產品敏感變更或前端產出；沿用前輪仍有效的產品安全與畫面證據，不宣稱新增UI兩輪或完整資安模擬。

剩餘限制：本輪請求的兩項測試缺陷已解決，下方44/46結果是歷史紀錄。整個專案全套仍包含先前禁止的建刪其他資料庫操作，本輪未擴大授權；47項是11檔安全回歸，不是全專案全套。因此未commit／merge／push，產品原站沒有需重新部署的程式修改。下一步僅剩完整隔離測試環境範圍決定，見`docs/open-questions.md`。已套用product-owner-teaching、systematic-debugging、test-driven-development、verification-before-completion；沿用本對話已讀測試與QA政策。

---

# 前輪狀態：小麥流程調整（2026-10-18，lab 工作區已生效，未合併／推送）

最終回歸結果：上述安全範圍11個檔共46項，44通過／2既有缺片前提失敗／0跳過，exit 1，完整輸出 `.screenshots/flow-final-regression.log`；之後只有交接文件更新，沒有產品程式修改。不能合併或推送。

使用者貼出小麥要求並確認 lab 就是目前這台 Windows／XAMPP；一分鐘是「故事開頭六人角色介紹」，不是每關六人發言。實驗說明 → 前測 → 第一故事 → 強制休息五分鐘 → 第二故事 → 後測。沿用 `fix/xiaomai-ui-followup@19c82b0`，保留原本所有未提交內容，沒有 stash/reset、資料遷移或更改 `.env`。

本輪修改：`story_ai.php` 修正第一故事實驗組原本連分數也隱藏的問題，現在只提供本關與累積分類分數、不揭露解析、不呼叫 AI，第二故事維持原回饋。`story_game.php`／`api.js`／`app.js` 為每故事開頭介紹保存一分鐘計時，首次進入畫面才開始，重整續算、到時自動進入調查須知；沿用既有 events 表，無新增資料表。介紹原手動前進按鈕保留，五分鐘休息才是強制不可提前；休息沿用已存在的伺服器門檻，本輪驗證四種分派均受限。`ck_survey.php` 接上雙故事帳號，後測檢查兩故事完成、學生確認後開放成果；consent 進前測、第二故事完成進後測。維護說明見 `docs/two-stories.md` 最新節。

產品理解檢查點：學生能按最新順序完成研究，第一故事得分與第二故事 AI 回饋分開；瀏覽器向 PHP 保存進度，再讀 MySQL 的既有作答與時間紀錄。伺服器計時像施測老師的碼表，重整不重算；備案只在瀏覽器計時較少改動，但不能可靠保存，所以未採用。沿用問卷網址與資料表，無新供應商／費用，沒有改真實學生答案；第一故事少了 AI 請求但未量測省下費用。問卷送出仍由學生自我確認，不代表平台驗證收件；人工前進介紹仍可使用。舊單故事流程沒有新增雙故事倒數。

TDD：HTTP 第一故事得分先得到 undefined→修正後通過；介紹持久計時與到期轉頁先失敗→修正通過；真實 Chrome 第一故事得分視窗、介紹倒數自動跳頁、consent 前測路由、第二故事後測路由皆先紅後綠。問卷雙故事入口先 HTTP 500→修正後 200 且後測提前訪問 409。`TEST_PHP_BINARY=C:/xampp/php/php.exe`（8.0.30），鎖檔安裝 `tests/node_modules` Playwright 1.63.0（原路徑 PHP 8.2 已不存在）；沒有改鎖檔。五項本輪瀏覽器流程回歸 5/5 通過，`.screenshots/flow-focused-ui.log`；四種分派休息／問卷／登入私有檔保護／回饋／訊問選定 HTTP 5/5 通過。PHP 三個異動檔語法、JS 兩個異動檔語法與 `git diff --check` 通過。

較廣回歸命令沿用下方 11 檔安全範圍，初次 43 通過／2 失敗（45 項），記錄 `.screenshots/current-regression.log`；新增四分派案例後最終重跑記錄 `.screenshots/flow-final-regression.log`。兩項既有失敗是 HTTP `a student cannot write another student or future story, read their feedback, or skip missing media`（最後缺片斷言期待409但得到200）與 UI `drink uses its own characters, saves onboarding and clearly blocks a missing video`（等待缺片提示逾時）。目前 media/drink 六支影片已存在，這兩項測試的缺片前提過時；未刪除斷言、搬走真實影片或默默改成通過。整個專案全套仍受既有不得建刪其他資料庫限制，沒有執行，不能將局部回歸說成全套。

前端兩輪：`.screenshots/flow-visual.mjs` 以實際 PHP／MySQL／Chrome 產生每輪1280×800與375×812各一張，均讀回。最終 `.screenshots/flow-round2-desktop.png`、`flow-round2-mobile.png`。八項自評兩輪皆沿用原視覺：層次（介紹標題／次要倒數清楚）、留白（原卡片節奏）、字體（既有Work Sans與中文字體）、配色（灰白與橘）、對齊（卡片統一邊線）、響應式（手機原兩欄須垂直捲動、無元素超出視窗）、狀態（計時／前進／回饋／休息禁用／錯誤重試）、動效（原按鈕回饋、未新增動畫）。溢出測量先用4000px探針校準；document scrollWidth方法因既有裁切未能測出探針，已改用元素邊界並校準成功，沒有拿錯誤方法宣稱通過。Impeccable 引擎仍缺少，已揭露並讀PRODUCT／DESIGN人工檢查，未宣稱自動hook掃描通過。

QA與lab驗收：學生角度實測倒數／得分／換故事，施測者角度核對四分派都強制休息、第一故事無AI請求；屬AI角度審查，無真人專家認證。使用合成帳號與測試分派序列，測試AI用本機假服務、測試問卷網址預設清空避免送到真實平台。原站 Apache 的 `http://127.0.0.1:8081/` DocumentRoot 是本工作區，讀取 consent/app.js/api.js 的 HTTP 200 與SHA256皆符合磁碟。`.screenshots/live-flow.mjs` 在原站實際登入→介紹倒數自動跳頁→合成第一故事得分→完成故事→休息按鈕禁用→調整僅合成回合時間→進第二故事，通過且無pageerror；不呼叫真實AI。測後刪除自己合成帳號及分派序列，重新登入確認失敗。沒有另建站、變更Apache設定或正式資料。

剩餘限制／下一步：先把兩項缺片測試改成使用隔離的缺片fixture（不要移動現有影片），並處理完整測試環境的建刪資料庫授權限制，再依規則全測／合併main／重測／push。目前因既有失敗與全測限制，沒有commit／merge／push，不宣稱正式施測驗收完成；lab工作區檔案已被原站直接提供。真實AI品質、實際問卷送出及全部素材內容未驗證。技能：using-superpowers、product-owner-teaching、test-driven-development、impeccable（人工fallback）、emil-design-eng、playwright-cli、verification-before-completion。

---

# 前輪狀態：飲料配分優先次序已核可（2026-10-03 後續）

使用者對「逐人判定標籤優先，缺漏才用附錄，矛盾說明保留待老師修訂」明確回答「好」。已將此決議套用並記錄於 `api/stories/drink-v2.json` 的 scoringDecision／reviewStatus／reviewIssues；第二關韓四城有瑕疵、夏五喬合理、唐六雅合理，第三關顧三曜有瑕疵。原暫定分類值符合這次核可，沒有重寫既有分數；此次將核可狀態定案並補上逐人測試斷言。下方舊交接提到的「等待判準回覆」已解除。

產品理解：分類標籤就是計分答案；判定說明是解釋文字。按核可標籤計分可以維持確定規則，保留矛盾說明供老師修订可避免擅改原稿；備案是等老師重寫整份說明再定案，但使用者本輪已選前者。限制是說明文字仍可能與標籤不一致，老師修訂前不可宣稱教材完全一致。沒有新的流程、畫面、資料結構、外部服務或成本；不涉及搬動真實學生資料。

更新 `docs/open-questions.md`、`docs/two-stories.md`、PRODUCT 與原 spec／plan ledger，使配分不再列為待決。保留原分支 `fix/xiaomai-ui-followup@19c82b0` 與全部既有未提交內容；`.env` 及正式分派停用狀態未改。

驗證：先跑 `tests/story-content.test.mjs` 3/3 通過，逐人斷言涵蓋上述四人。`.screenshots/dual-story/audit.mjs` 比對來源表格與 JSON 的 36 則發言、判定說明、追問文字均一致；來源差異共 4 項、待決配分 0 項、唐六雅說明待修訂仍有註記。本輪只是核可資料及文件更新，沒有新行為，不為 metadata 製造人工紅燈。其後重跑前輪同一安全範圍的 11 個測試檔，**40 通過、0 失敗、0 跳過，exit 0**，完整命令同下方交接／維護說明，結果在 `.screenshots/dual-story/scoring-approved-regression.log`。`git diff --check` 通過；沿用仍有效的前端及安全檢查證據，未宣稱新增畫面或新安全模擬。

剩餘限制：飲料影片與照片仍待補、真實 AI 品質未驗證；整個專案全套仍受不得建刪其他資料庫的限制，故未提交／合併／推送／部署。原試玩站未同步。下一步是補素材與處理完整驗證環境，配分不需重複詢問使用者。已套用 product-owner-teaching、test-driven-development、verification-before-completion，沿用已讀技能與政策。

---

# 前輪狀態：蛋糕／第9杯飲料共用流程（2026-10-03，工作區實作，未啟用／未發布）

目標與核可：使用者要求以蛋糕六關框架製作飲料故事；新學生首次登入依 `1-1 → 1-2 → 2-1 → 2-2` 循環，1 控制／2 實驗，-1 蛋糕先／-2 飲料先，重登固定。問卷由老師處理。已確認第五關採逐人判定及附錄：白二晴、夏五喬合理，共兩則。缺飲料素材維持影片框架、顯示待補並阻擋前進，不能替換成文字閱讀。第二關判準矛盾、第三關顧三曜缺標籤仍待回覆，詳細見 `docs/open-questions.md`；不可推定第五關的核可涵蓋其他差異。

工作區／來源：`fix/xiaomai-ui-followup@19c82b0`。保留原有 DESIGN、HANDOFF、app.js、review.css、immersion 測試、.claude 與影片未提交內容；修改前 app／CSS 備份在 `.screenshots/dual-story/`。未 stash／reset、未建立新分支、未提交／合併／推送。原 `http://127.0.0.1:18079` 試玩站未同步本輪雙故事內容。新測試使用獨立 PHP 連接埠，已關閉。

實作：新增 `api/src/stories.php` 分派、`story_content.php` 公開欄位白名單、`story_game.php` 遊戲保存與流程、`story_ai.php` 共用訊問操弄及按故事回饋，公開入口 `api/public/story.php`。既有 login/state/results 為新帳號接到新流程；旧學生留在舊 API，防止新帳號反走舊 API 建回合。`api/stories/` 保存版本固定的蛋糕及飲料內容，Apache 與測試 router 都禁止公開下載。`api/migrations/2026_10_stories.sql`、`api/tools/install_stories.php` 僅在既有 `idealightsdg_cake` 新增六張表，未建刪資料庫或遷移既有學生。

共用前端：依 runId 區分本機備份，角色／影片／證詞依故事載入。第一故事完成後以「開始下一個故事」接續；第二故事完成後提示老師問卷，學生自行確認才解鎖各故事成果與真相。問卷確認不驗證外部繳交狀態。飲料缺照片用姓名識別、缺影片顯示待補；保留既有分類上／判斷下排版。consent 說明支援兩故事；最後一關按鈕改「完成這個故事」。

產品理解檢查點：一位學生的研究安排像資料夾封面，蛋糕與飲料各有一本獨立作答本（run_id）。瀏覽器送出 → 登入身分及回合核對 → 保存該故事資料 → 重新載入原進度。最新草稿與凍結答案存在 work，對話存在 messages，歷次草稿／影片／階段／提交時間追加在 events；相同請求重送不重複累計。主方案新增表保留歷史資料；備案修改所有舊表較少並存程式，但遷移風險較高。代價是舊匯出工具不會自動包含新表，尚無新教師匯出介面。沒有新增套件或外部供應商；兩故事增加使用 AI 的機會，實際費用及真實 AI 品質未量測。白話架構與維護說明見 `docs/two-stories.md`。

計畫／決策：`docs/superpowers/specs/2026-10-03-two-stories-design.md`、`docs/superpowers/plans/2026-10-03-two-stories.md`。局部決定包含新增表保留舊資料、伺服器 JSON 固定版本、沿用現有非 main 工作分支保留使用者畫面、以獨立測試分派序列避免消耗正式序號、來源矛盾維持草稿及停用；代價與理由已記 ledger。預設 `STORY_STUDY_ENABLED=0`，實際 `.env` 未修改。安裝新表不會自動啟用新學生研究。

TDD／驗證：每個新行為紅→綠，包括四種分配、重登固定、影片門檻／計時、草稿版本及凍結、分故事計分、兩組回饋／訊問共享、故事切換／成果、缺素材及角色畫面。獨立審查發現研究事件缺口，新增 events 後 `research events preserve draft revisions…` RED→GREEN；同時補足真實多 PHP 程序同時分派／同時開始第二故事；第六關錯誤後測文字以真實瀏覽器 RED→GREEN 修復。追加修復過關重試、過去關卡遲到草稿歸檔、提前進成果頁返回 409 提示而非通用 500。審查無未處理的已確認重大缺陷；並不代表全專案無缺陷。

最終安全範圍回歸：`node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs tests/immersion.test.mjs tests/story-content.test.mjs tests/stories.test.mjs tests/story-game.test.mjs tests/story-http.test.mjs tests/story-ui.test.mjs` → **40 通過、0 失敗、0 跳過，exit 0**，測試名稱與結果見 `.screenshots/dual-story/final-regression.log`。沿用 PHP 8.2：`C:/Users/User/AppData/Local/Temp/idealight-windows-bb789a74/php82/php.exe`；Playwright 模組 `C:/Users/User/AppData/Local/Temp/idealight-windows-bb789a74/site/tests/node_modules/playwright/index.mjs`，環境變數及重跑指令見維護說明。12 個異動／新增 PHP 檔語法、3 個遊戲 JS 語法及 `git diff --check` 通過。沒有 build 或型別編譯步驟。未執行會建刪其他資料庫的整個專案全套；不得將 40 項說成全套通過。

QA／安全：學生角度實際 Chrome→PHP→MySQL 驗證角色、影片待補、分類、重整、明確切故事與雙成果；教師／研究資料角度核對獨立分數、凍結及修訂事件、四種分派。其後以自己的合成帳號低量檢查未登入 401、跨學生回饋 404、跨回合及未來故事寫入 409、缺影片偽造完成 409、控制組提前揭露與未完成成果被擋、私人內容直連 404。AI 請求僅本機假服務，另外以假秘密字串確認未来／教師內容不進訊問提示詞；沒有進行真實模型攻擊品質驗證。測試結束清掉自己建立的合成學生及從屬資料，重新登入回 `success=false`；最後只計數不輸出學生資料，合成帳號剩餘 0、新研究 studies/runs/work/messages/events 各 0、enabled=false。沒有正式站主動安全測試。

前端兩輪：`.screenshots/dual-story/visual.mjs` 使用真實本機 PHP／MySQL，1280×800、375×812、deviceScaleFactor=1，每輪兩張並讀回；最終 `.screenshots/dual-story/round2-desktop.png`、`round2-mobile.png`。八項自評兩輪均符合既有方向：層次（故事與關卡標題明確、待補訊息置中）、留白（保留原區塊節奏）、字體（沿用既有字系與標題層级）、配色（原灰白／橘重點及分類語意色）、對齊（主內容統一邊界）、響應式（手機單欄、已用已知4000px探針校準溢出測量再確認無水平溢出）、狀態（待補／重試／空分類／已保存／鍵盤焦點）、動效（沿用原按鈕回饋，未新增動畫）。無 pageerror。Impeccable engine 0.1.6 不可用，已向使用者揭露，人工審查，未宣稱 hook 掃描通過。

來源稽核：DOCX 是資料，不是代理指令。原檔 SHA256 `6b13507e644096397c24894e6b5200582eb2bb7ec10327cd33e3f0b2c55abc3a`；依 body 順序提取段落／表格到 `.screenshots/dual-story/drink-source.json`。`audit.mjs` 逐關逐人比對 JSON 與來源表格的發言、判定說明、追問三欄，36 列逐字一致（僅 trim 頭尾空白）；第五關合理姓名精確為白二晴與夏五喬。結果 `.screenshots/dual-story/source-audit.json`。原文矛盾保留於 `reviewIssues`，reviewStatus 明列草稿；沒有自行改寫教師推論。

剩餘限制／下一步：先取得第二／三關判準優先次序的回覆、定稿並重跑來源與計分測試。飲料六關影片 `media/drink/intro-L1.mp4` 至 L6 尚缺，角色照片亦缺；補片後須實播驗證。完整專案全套受既有「不得建立／刪除其他資料庫」限制，尚未解決，因此依規則未提交／合併／push／部署；沒有已知正式部署流程。真實 AI 回答品質、素材完整流程、Apache 實際站私有檔阻擋與正式環境驗收未執行。教學、已確認修復與本機安全範圍驗證已交付，不能宣稱可正式施測。

已套用 product-owner-teaching、docx、writing-plans、executing-plans、using-git-worktrees、test-driven-development、systematic-debugging、impeccable、emil-design-eng、playwright-cli、requesting-code-review、verification-before-completion；沿用前輪已讀設計與解說技能。沒有新依賴、付費操作或破壞性遷移。

---

# 本輪狀態：依 Git 保存版還原分類與推理（2026-09-29）

使用者要求「證詞分類、我的判斷維持原本上一版排版，Git上面有」。已依目前 checkpoint 19c82b0 恢復上方整區分類／下方選人與理由並排，並恢復該版分類說明、頁首任務與前往推理按鈕。這是 Git 保存版，不是前輪未提交的左右兩大欄或四格。保留章節名稱、人物原話、加寬訊問對話及其他素材。僅從 git show 抽出相關函式／導覽，未整檔 checkout；比較確認 viewEvidence 到 viewRanking 前的函式文字與 19c82b0 完全相同。review.css 移除 workspace 相關覆寫；DESIGN.md 同步。分支 fix/xiaomai-ui-followup，修改仍未提交。

產品理解：回到學生先完整分類、再往下選人寫理由的順序；相比前輪四格，較接近使用者要保留的流程，代價是頁面較長。資料仍經原草稿服務存回既有資料庫，沒有資料格式、權限、題目或費用改動；沒有新增套件。先備份 `.screenshots/immersion/restore-layout.app.js.before`／`restore-layout.review.css.before`，只還原本輪範圍。

驗證：調整既有 immersion 流程測試，先觀察「Judgment follows the complete classification area, including unclassified cards」失敗，再還原後2/2通過；保留分類、前往推理、選人、理由重整還原與未完成不能送出驗證。局部回歸 `node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs tests/immersion.test.mjs`：15通過、0失敗、0跳過、exit 0；沿用既有 PLAYWRIGHT_MODULE／TEST_PHP_BINARY。app.js 語法、git diff --check 通過。

桌機1280×800／手機375×812兩輪均執行並讀回截圖，第一輪工作區、第二輪原試玩站：`.screenshots/immersion/restore-layout-round2-desktop.png`、`restore-layout-round2-mobile.png`。驗收脚本 restore-layout.mjs 以公開劇本與合成狀態實際操作分類／移回、前往判斷、保存與重整；以4000px探針校準無水平溢出檢查。八項自評：層次（分類先、推理後）、留白（恢復原間距）、字體（既有字系與標題）、配色（保留合理綠／破綻玫紅）、對齊（分類全寬）、響應式（手機單欄）、狀態（空區／已分類／選人／未完成送出正常）、動效（沿用原互動，無新增）兩輪通過。Impeccable 引擎仍不可用，人工依既有規範檢視，未宣稱自動掃描通過。

學生／施測者簡短QA：restore-live.mjs 用原本受限的合成帳號流程，兩組各自走真實Chrome→PHP→idealightsdg_cake，分類／選人／理由重整保留、計時與組別顯示正確、served JS/CSS 與工作區 hash 一致、無pageerror與HTTP錯誤，沒有AI請求；finally清除本次合成帳號並確認無法登入。未修改真實學生資料；純排版還原未觸發完整資安模擬。

同步前確認原站app.js／review.css等於本輪備份版本，再同步到 `C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6/site`；`http://127.0.0.1:18079/control/game.html` 已套用。全套仍因既有禁止建立／刪除其他資料庫限制而未執行，未提交／合併／推送，沒有正式部署流程。下一步在原網址檢視已恢復的版面。已套用 product-owner-teaching、impeccable、emil-design-eng、test-driven-development、karpathy-guidelines、playwright-cli、verification-before-completion。

---

# 本輪狀態：分類與推理四格排列（2026-09-28）

使用者核可參考圖：上排合理說法／破綻證據牆，下排待分類／我的判斷（選人與理由），並將分類操作說明移到頁首原關卡說明位置。已在 fix/xiaomai-ui-followup@19c82b0 的既有未提交修改上完成，保留原有修改、加寬對話與素材。app.js 拆出共用分類說明及 wall／tray 輸出，combined 按四格組合；review.css 以等寬雙欄排列，上排跨兩欄，清除待分類既有上邊距以對齊下排。舊 evidence 階段保留原結構。DESIGN.md 同步核可排列。

產品理解：主方案以相同欄寬左右對照已分類證詞，再在下排分類／判斷；備案保留整條判斷右欄較省改動，但不符合使用者示意。手機改為依序向下閱讀。資料仍沿用既有草稿服務與資料庫，未新增套件、費用、答案提示或輸入契約；長證詞增加頁高，仍須捲動。本輪局部決定：兩欄等寬、32px 間距，保留原有按鈕、導覽與文字。已交付教學與限制。

TDD：在既有 tests/immersion.test.mjs 的分類／選人／草稿還原流程加入真實瀏覽器區塊位置斷言，先因「Judgment belongs below the classified groups」失敗；實作後抓到 .tray 原有 margin-top 造成下排未對齊，依原樣式定位修正後 2/2 通過。收尾回歸（既有 PLAYWRIGHT_MODULE／TEST_PHP_BINARY）：`node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs tests/immersion.test.mjs` → 15 通過、0 失敗、0 跳過，exit 0；app.js 語法、git diff --check 通過。其後僅更新交接與設計文件。

兩輪桌機1280×800／手機375×812截圖：`.screenshots/immersion/four-grid.mjs` 第一輪工作區、第二輪原試玩站，均讀回截圖。最终 `.screenshots/immersion/four-grid-round2-desktop.png`、`four-grid-round2-mobile.png`。八項自評：層次（分類上、操作下）、留白（32px 欄間與既有卡片內距）、字體（沿用 Work Sans／中文後備、標題層級）、配色（紙白灰、合理綠與破綻玫紅原語意色）、對齊（上下兩列同邊界）、響應式（375單欄無水平溢出）、狀態（空區／有卡片／選人／focus／未完成送出鎖定正常）、動效（沿用既有按鈕回饋，未寫新動畫）兩輪通過。溢出偵測以已知4000px探針校準。Impeccable 引擎仍不可用，沿用既有設計脈絡與人工檢查，不宣稱自動掃描通過。

簡短QA採學生、施測者與鍵盤操作角度，驗證兩分類區與待分類往返、四格/手機順序、導覽焦點、選人理由重整還原。`.screenshots/immersion/live.mjs` 另以既有明確合成帳號流程走真實 Chrome→PHP→指定 idealightsdg_cake，兩組均確認草稿重整保留、計時與各組顯示、served files hash一致、無pageerror／HTTP錯誤，未呼叫AI；finally清除本次合成帳號並確認無法再登入。沒有觸及真實學生資料，純版面調整未觸發完整資安模擬。

同步前確認試玩站 app.js／review.css SHA256 等於本輪修改前版本，備份 `.screenshots/immersion/four-grid.app.js.before`、`four-grid.review.css.before` 後同步至 `C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6/site`。原網址 `http://127.0.0.1:18079/control/game.html` 已套用。全套仍受既有不能建刪其他資料庫限制，未提交／合併／推送，沒有正式部署流程。下一步可在原網址查看四格；不得將本輪局部回歸當成全套發布驗收。已套用 product-owner-teaching、impeccable、emil-design-eng、test-driven-development、karpathy-guidelines、systematic-debugging、playwright-cli、verification-before-completion。

---

# 本輪狀態：訊問對話區加寬（2026-09-28）

使用者要求右側人物資訊再往右、對話視窗加大。沿用 fix/xiaomai-ui-followup@19c82b0 的未提交沉浸感修改，只把 review.css 的原話側欄比例由 .7fr 改為 .4fr，保留 240px 最小寬與既有手機排列。其餘既有未提交檔案保留。本輪局部決定採約 71% 對話／29% 參照，沒有新增功能、資料流、相依或費用；相較隱藏原話，縮窄右欄可保留對照能力，代價是長原話換行較多。

驗收：`.screenshots/immersion/chat-width.mjs` 使用公開劇本與合成 API 狀態，第一輪工作區、第二輪原本機站，均以 Chrome 1280×800／375×812 執行並讀回兩張截圖。瀏覽器 bounding box 實測桌機對話 497.64→604.28px、右欄 348.34→241.70px；手機保持 341px 單欄。溢出偵測先用 4000px 探針確認會報真，再移除驗收。學生／施測者／鍵盤角度 QA：切換人物後原話與公開資料完全相同、輸入框可聚焦、沒有水平溢出與 pageerror、無 AI 請求。純版面變更未觸發完整資安模擬，未改寫研究資料。

兩輪八項自評：層次（對話加寬、原話從屬）、留白（保留既有區塊與內距）、字體（原有 Work Sans／中文後備與標題層级）、配色（紙白灰與橘色操作）、對齊（並排邊界一致）、響應式（手機上下、無水平溢出）、狀態（選人／空對話／鍵盤焦點正常，既有流程回歸通過）、動效（沿用既有按鈕回饋，未新增）均符合本輪範圍。最終圖：`.screenshots/immersion/chat-width-round2-desktop.png`、`chat-width-round2-mobile.png`。Impeccable 引擎缺少且無法建立快取，改採既有 PRODUCT／DESIGN 與人工審查，未宣稱自動掃描通過。

回歸：沿用既有 PLAYWRIGHT_MODULE／TEST_PHP_BINARY，`node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs tests/immersion.test.mjs`：15 通過、0 失敗、0 跳過，exit 0；`git diff --check` 通過。此次為可逆單行樣式調整，未另增永久測試；保留實際畫面驗收腳本。全套仍受既有不得建刪其他資料庫限制，未以局部回歸冒稱全套，未提交／合併／推送。

已確認原試玩站 CSS 等於修改前工作區，備份 `.screenshots/immersion/chat-width.css.before` 後同步至 `C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6/site/assets/css/game/review.css`，兩份 SHA256 相同且 HTTP 讀回包含新比例。原網址 `http://127.0.0.1:18079/control/game.html` 已套用；沒有正式部署流程。下一步可直接在原網址檢視寬度。已套用 using-superpowers、product-owner-teaching、impeccable、emil-design-eng、playwright-cli、verification-before-completion。

---

# 本輪狀態：沉浸感第 2／3／4 項已套用本機（2026-09-28）

使用者要求「改改看，但改之前先把這版 git 保存」。先提交 1a1d568，再整合既有遠端 18b6e63，得到 checkpoint **19c82b0fa0319e3b511e8e62b569c5570c237f77**；已推送 origin/fix/xiaomai-ui-followup，git ls-remote 確認相同 SHA，之後才開始本輪 UI 修改。main 未動。大型影片與本機設定保持原狀，不在 checkpoint 內。

本輪修改：app.js 顯示原章節名稱；訊問選人後以靜態照片及精確原始發言作參照；combined 整理為「證詞分類／我的判斷」，桌機並排、手機上下，提供可鍵盤操作並移動焦點的區域導覽。調查須知同步改用區域名稱。review.css 沿用淺灰紙白、橘色重點與桌機 80% 密度，不新增動畫、圖片生成、相依或費用。沒有改題目、提示、正解、分組、計時、送出條件或後端契約。

產品理解：前端像同一本案件資料夾的頁面編排；玩家查看既有材料，操作仍交由既有草稿 API 保存，再由 state 還原。主方案縮短找材料與填答的距離；備案僅改標題雖更省改動但查找改善有限，因此依已核可範圍實作。長篇證詞仍需捲動；不壓縮或改写證詞以避免額外教學提示。手機沒有強制縮放，順序閱讀。

TDD：新增 tests/immersion.test.mjs。先觀察缺少原話 complementary 區域而失敗，最小實作後通過；下一個行為先觀察缺少作答導覽而失敗，實作後通過。驗證切換角色保留輸入／共用倒數、原話 HTML 逸出且不觸發 AI、導覽焦點、分類／選人／理由草稿重整還原與未分類完不可送出。

回歸命令（既有 PLAYWRIGHT_MODULE、TEST_PHP_BINARY）：node --test --test-concurrency=1 tests/config.test.mjs tests/rank.test.mjs tests/media.test.mjs tests/test-config.test.mjs tests/ui-review.test.mjs tests/immersion.test.mjs → **15 通過、0 失敗、0 跳過，exit 0**。app.js 語法與 git diff --check 通過。

兩輪畫面：.screenshots/immersion/review.mjs 以公開劇本及合成 API 狀態驗證1280×800／375×812。第一輪工作區，第二輪實際站。最終截图 `.screenshots/immersion/round2-desktop.png`、`round2-mobile.png` 均已讀回。桌機截 combined、手機截訊問；兩種尺寸均操作兩個階段。八項自評：層次（章節／區域／卡片清楚）、留白（章節24、欄32、卡片16/20）、字體（沿用既有字系與標題層級）、配色（既有紙白灰與功能色）、對齊（兩欄同起點）、響應式（幾何量測無橫向溢出）、狀態（選人、草稿、空對話、disabled 與 focus 可用）、動效（沿用按鈕回饋，不新增動畫）兩輪均通過。第一輪合成公開設定少了 ck_state 額外組合的 combined 秒數，已修正驗收 fixture，第二輪確認 4:00 倒數；不是產品計時缺陷。溢出測量先插入已知4000px元素校準，發現單看 scrollWidth 會受既有 overflow/zoom 影響，改用元素 bounding box 並確認能辨識探針，再移除探針驗收。Impeccable 自動引擎仍不可用，人工審查，不宣稱自動掃描通過。

同步前逐一 git hash-object 核對既有站 app.js／review.css 等於 checkpoint，備份 .screenshots/immersion/*.before，再同步至 `C:/Users/User/AppData/Local/Temp/idealight-preview-e2102de6/site`，SHA256 相同。實際網站 `http://127.0.0.1:18079/control/game.html`。

學生／施測者／鍵盤使用者簡短 QA：查原話、切換角色與作答區、未完成不允許送出、兩組既有顯示差異均正常；沒有新增答案線索。`.screenshots/immersion/live.mjs` 用指定 idealightsdg_cake 中明確命名的合成帳號、固定組別1與2，各自走真實 Chrome→PHP→MySQL；無 API 攔截替代草稿。驗證輸入、分類、選人與理由經重整保留，計時顯示、實际 served files hash、一組無分數／二組有分數、無 pageerror／HTTP 4xx/5xx。禁止 AI 請求，實際0次。首輪測試 fixture 誤把 onboarding_step 放在 ck_runs，已按真實 ck_run_settings 契約修正後通過；不是產品修改。兩次執行皆 finally 清除合成帳號並確認不能再登入。未動真實學生、不消耗自動分派序號、不調用付費 AI。

剩餘限制／下一步：本輪新 UI、測試與本節交接仍在 fix/xiaomai-ui-followup 工作區未提交；改版前 checkpoint 已在遠端。全套測試會建刪其他資料庫，受使用者既有資料庫限制不能執行，因此不合併 main、不推送本輪新 UI、不正式部署。沒有新增正式站，原本機網址已套用。需要修改時延續本工作區；不要將 checkpoint 誤認為包含新版 UI。已套用 product-owner-teaching、impeccable、emil-design-eng、test-driven-development、playwright-cli、verification-before-completion。

---

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

# 本輪狀態：CapCut 授權嘗試與六關草稿阻塞（2026-09-26）

使用者明確要求授權已安裝的 `capcut_creation`，依 `docs/ai-video-story-brief.md` 製作六關可編輯草稿，且每次扣點生成前先顯示預估點數。沿用工作分支 `fix/xiaomai-ui-followup`，保留開工時既有的 `HANDOFF.md`、影片指南、故事稿與七支未追蹤試播 MP4，沒有覆寫素材。

依 CapCut `mcp-auth` 流程檢查：本機外掛 0.2.0 的線上版本查詢回報 `unknown`（安裝文件無法取得）；原生 Codex CLI 確認 `capcut_creation` 已啟用；本輪沒有可呼叫的受保護 `capcut_creation` 工具。授權前兩個指定地區查詢均因 DNS 無法解析而失敗，因此**地區未經驗證**。登入 helper 取得官方 `www.capcut.com` OAuth 授權網址，但 Codex 內建瀏覽器回報 `Browser is not available: iab`；依技能規定未改用系統瀏覽器，已中止同一 helper，完成事件為 `success:false`、`Authorization was interrupted before completion`。沒有登入成功、草稿、生成、扣點或網站影片替換。

下一步：在可用的 Codex 內建瀏覽器工作階段重新執行官方 OAuth，等待 helper 成功完成，再檢查受保護工具是否可用；逐關建立可編輯草稿。每一次扣點生成都先展示該次模型、參數與預估點數，等使用者確認後才提交。授權頁的密碼與驗證碼只由使用者在官方頁輸入，不傳到對話。此輪未全測、合併、推送或部署，因六關成品尚未建立。技能：`CapCut:mcp-auth`、`CapCut:video-editing`、`hyperframes`（確認使用者明確指定 CapCut）、`product-owner-teaching`。

---

# 本輪狀態：CapCut × Codex 外掛安裝與指定 Word 製片稿（2026-09-26）

使用者指定 `~/Downloads/消失的月蝕巧克力莓果千層蛋糕_六關角色對話_教師解析版(1).docx` 作為六關影片版本，並要求連接 Codex／CapCut 製片。工作分支 `fix/xiaomai-ui-followup`，開工 HEAD `8807e0f`；原有七個未追蹤 `media/intro-*.mp4` 均保留，未覆蓋。Word 擷取文字 SHA-256 `7c87600baca2c703862f6f97e84399121d30fd6d7e3e4526333ef246481b1d02`，與同目錄不帶 `(1)` 的檔案擷取文字相同。本輪依使用者指定檔製作[六關製片工作稿](docs/ai-video-story-brief.md)，並更新[AI 影片指南](docs/ai-video-production-guide.md)的工具狀態；逐關保留揭露順序，教師解析不放進前五關。

CapCut 官網的 [CapCut × Codex](https://www.capcut.com/tools/capcut-x-codex) 指向官方安裝說明與外掛包。安裝包來自其指定 HTTPS 位址；先檢查 ZIP 路徑／展開大小及 manifest。使用目前 `/Applications/ChatGPT.app/Contents/Resources/codex` 安裝 `CapCut@CapCut` **0.2.0** 到本機 Codex；`plugin list` 顯示 installed/enabled，`mcp get capcut_creation --json` 顯示 enabled 並指向 `https://www.capcut.com/api/external_mcp`。這是外掛**安裝完成**，不是 CapCut 帳號授權完成。沒有修改專案程式或新增相依。

本次對話的 Codex 內建瀏覽器不可用，且沒有可呼叫的 CapCut MCP 工具；因此未執行外掛 OAuth 授權，也未透過外掛生成／剪輯。官方說明的授權前國家查詢（`ifconfig.co`）遭自動批准審核拒絕，理由是會向 CapCut 以外第三方送出裝置網路資訊；未改用替代查詢繞過。下次應在新 Codex 工作階段只執行 `capcut_creation` 授權，再讀製片稿操作外掛；不重新安裝，不登入 `capcut_creation_resource`。登入憑證與驗證碼只在官方授權畫面輸入，不貼到對話。

macOS CapCut 9.4.7-beta1 已登入；AI 影片介面可見 Dreamina Seedance 2.5／2.0／2.0 Fast／2.0 Mini、MiniMax H3。Seedance 2.5 的當下 10 秒／720p 設定顯示估計 370 點、餘額 1,200 點（直接讀取編輯器欄位，非六片成本）。點進 AI 影片時 CapCut 自動建立空白專案 `0926`；未按生成，未扣點，未輸入故事素材，未匯出影片。先做分鏡與準確文字，再逐鏡估點；若需要付費或超出已持有點數，先取得具體成本決策。

驗證：Word 六段開頭實際擷取、兩份 Word 擷取文字雜湊一致；外掛安裝與 MCP URL 透過 Codex CLI JSON 確認；`git diff --check` 通過。此輪是製片輸入與安裝，沒有正式影片可做學生／教師播放 QA；情境審查與未來驗收已寫入製片稿。未跑可能建立／刪除其他資料庫的專案全測，未碰唯一指定庫 `idealightsdg_cake`。未合併／推送／部署，原因是正式影片與帳號授權未完成，既有全測限制也仍在。剩餘待決：第三關 Word「原始檔」稱呼與 AI 角色補充回答的提前揭露風險；本輪按 Word 原文記錄，不擅改研究內容。技能：using-superpowers、product-owner-teaching、docx、hyperframes（僅確認使用者已指定 CapCut）、computer-use。

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
