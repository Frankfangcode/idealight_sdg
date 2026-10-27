# Two stories Implementation Plan

> For agentic workers: use executing-plans inline; final independent review. User explicitly authorized implementation; no repeated design approval.

**Goal:** 共用蛋糕前端承載兩故事與四種循環分配，資料按故事回合隔離。
**Architecture:** 原有學生及單故事紀錄保留；新增 story repository 與 API，新學生使用双故事回合，舊學生維持舊 API。公共前端依 state 路由，研究資料與故事答案只在伺服器。
**Tech Stack:** 現有 PHP、PDO/MySQL、原生 JS/CSS、Node test、Playwright；不新增依賴。
**Spec:** ../specs/2026-10-03-two-stories-design.md

## Global Constraints
- 保留既有未提交修改；不覆寫素材或舊學生紀錄。
- 同一 idealightsdg_cake 資料庫，只新增表；不建立或刪除其他資料庫。
- 第五關兩則合理；缺影片保留影片步驟並顯示待補。
- 受限全套不得冒稱通過；未全測不得合併推送或部署。

## Review Focus
- 舊分頁、重試、重登不得更換故事或重新分配。
- 同時登入與第二故事開始需有鎖定與去重。
- 分類／推理計時、網路遲到資料不得覆寫凍結答案。
- 教師資料、未來劇情、跨帳號作答不得外洩。
- 飲料缺素材明確阻擋、不借用蛋糕素材；成果不串故事。

### Task 1: Story content and allocation
Files: api/stories/drink-v2.json; api/tools/install_stories.php; api/src/stories.php; api/migrations/2026_10_stories.sql; tests/stories.test.mjs.
- [x] 先測來源轉換與公開／私有資料隔離，紅→最小實作→綠（來源判準仍待核對）。
- [x] 先測四種分派、重登入、舊學生，紅→新增表與分派→綠。
- [x] 僅新增表與合成資料，不遷移舊紀錄；教學與驗證記錄見本輪 HANDOFF。

### Task 2: Shared story gameplay API
Files: api/src/story_game.php; api/public/story.php; api/public/login.php; api/src/interrogation.php; tests/story-game.test.mjs.
- [x] 每次一個行為：進度及影片門檻、計時、草稿、作答、訊問、回饋各自紅→綠。
- [x] 故事切換、跨人／舊分頁、控制組延後揭露、完成成果各自紅→綠。
- [x] 真實 HTTP／MySQL 驗證；清理後測試帳號無法登入；既有資料不遷移。

### Task 3: Shared frontend
Files: assets/js/game/api.js; assets/js/game/app.js; assets/js/game/results.js; assets/css/game/review.css; control/results.html; tests/story-ui.test.mjs.
- [x] 新故事載入與缺影片提示測試紅→綠。
- [x] 故事間銜接、重登、完成與分故事成果測試紅→綠。
- [x] 兩輪雙尺寸截圖與八項自評，維持既有視覺與微互動。

### Task 4: QA and handoff
- [x] 學生／教師情境 QA；合成帳號越權、跳步、舊回合請求安全測試。
- [x] 獨立程式審查與必要紅綠修復。
- [x] 必要語法檢查、可執行回歸、來源內容稽核，完整记录未測項。
- [x] 更新 HANDOFF、PRODUCT、README；全套受限，未提交／合併／推送／部署。

## Ledger
- 2026-10-03 follow-up: 使用者已明確核可逐人標籤優先、缺漏採附錄、矛盾說明保留。以下歷史 ledger 的 source-priority pending 已解除；素材／全套及發布限制仍在。飲料 JSON 更新核可紀錄，未改寫原文或既有分類值；測試明確鎖定第二關韓四城／夏五喬／唐六雅、第三關顧三曜判定。這是既有暫定值轉為核可資料與文件更新，沒有新的流程或資料庫遷移；不為 metadata 人為製造紅燈。
- Baseline: fix/xiaomai-ui-followup@19c82b0; pre-existing changes in HANDOFF, DESIGN, app.js, review.css, immersion test and media. Before copies under .screenshots/dual-story/.
- Ruling: user requested start implementation, which authorizes the discussed design; no repeated approval gates.
- Ruling: use additive new story tables to preserve all existing records and avoid destructive schema changes. Legacy backend remains for existing runs.
- Ruling: work in existing non-main branch because current uncommitted visual changes are the desired framework; edits are additive and backed up. No reset or stash.
- Ruling: global full suite requires forbidden create/drop databases; run safe regression and new same-database synthetic cases, disclose integration/merge blocker.
- Task 1–3 implemented and verified by the scoped regression; this does not mark launch readiness complete. Source judgments remain pending; no active study was enrolled.
- Ruling: immutable story JSON is kept outside public API responses with pinned versions instead of importing content into SQL tables — minimizes changes to legacy content; cost if wrong: future teacher editing needs a versioned content workflow.
- Ruling: current non-main branch retained to preserve approved uncommitted visual work — avoids losing the desired framework; cost: changes must be carefully staged when the full-suite blocker clears.
- Ruling: new tables rather than altering existing student records — preserves historical conditions and answers; cost: old exports do not include the new study tables.
- Ruling: second-level contradictory decisions and third-level missing label remain provisional; fifth-level approval is not extrapolated — avoids silently deciding research scoring; cost: feature stays disabled pending teacher response.
- Ruling: no destructive full-suite database setup, merge, push, deployment or preview overwrite — honors the existing database restriction and test gate; cost: this is a local verified implementation, not a released system.
- Final review: fresh independent reviewer found Important missing research events. Added ck_story_events and deduplicated server-timed history, research event test RED→GREEN.
- Final review: last-chapter label graded Important for experiment instructions, changed to「完成這個故事」in stories mode; real-browser story-switch test RED→GREEN.
- Final review: concurrent enrollment and simultaneous second-story start now exercised in separate PHP processes; allocation and a single story-start event verified. No deferred reviewer minors remain.
- Final review declined judgments: teacher-source conflicts stay pending; real AI quality stays untested (local fake only); production/full suite blocked; next-level retry and consent independently fixed and tested.
- Additional fixes RED→GREEN: own drink portraits and classification metadata; late past-chapter archives; next-level retry; consent dual-story instructions; early result request returns actionable 409 rather than generic 500.
- Evidence: .screenshots/dual-story/final-regression.log; source-audit.json; round2-desktop.png / round2-mobile.png. Detailed limits and commands: docs/two-stories.md and HANDOFF.md.
