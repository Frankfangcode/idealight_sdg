# 小麥審閱新版 Implementation Plan

> 使用 executing-plans 在本分支逐項實作；使用者已授權開始，依本次對話規格，不重開設計核可。

**Goal:** 完成已核可的六關流程與資料保存修改，保留舊資料並提供可測試的版本。
**Architecture:** 沿用 PHP/JS，資料庫新增隔離的分派計數、草稿、影片進度與評語追溯資料；既有答案表保留。新回合採合併作答階段，舊回合維持可接續。
**Tech Stack:** PHP 8、PDO MySQL、原生 JS/CSS；Node 內建測試搭配真實 HTTP/隔離 MySQL。
**Spec:** PRODUCT.md、使用者提供的 CT exp system rev.docx 與 2026-09-24 小麥對話。

## Global Constraints
不更換框架、不增付費服務、不改串供提示詞、不做嘴型動畫、不覆寫既有研究資料。只在隔離資料庫測試；LLM 用本機測試服務代替計費呼叫，明示實際模型表現未驗證。

## Review Focus
重登與同時登入不可重分組；逾時及斷線不可丟草稿；分類與理由提交必須同成同敗；控制組不能提早查到解析與分數；未完成或未設定後測不能開啟成績。

## Task 1 分組與測試環境
Files: api/src/scenario_repo.php、api/public/login.php、api/schema_cake.sql、api/migrations/2026_09_review.sql、tests/integration.mjs。
- [x] 先以真實 HTTP 建兩位測試學生、首次登入、查 ck_runs，預期 control/experiment；重登保持，原程式會失敗。
- [x] 交易鎖定分派計數，再建立回合；已有 run/group 維持。登入呼叫 ck_run，不把組別放進新畫面。
- [x] 同測試檔重跑並測並行呼叫，通過後才進下一行為。

## Task 2 草稿與合併提交
Files: api/src/review.php、api/public/ck_draft.php、ck_response.php、ck_advance.php、ck_state.php。
- [x] 先寫保存草稿後清除瀏覽器暫存仍可由 ck_state 取回的失敗測試。
- [x] 新草稿表保存訊問未送出文字、對象、分類、選人與理由，回應版本，逾時凍結，重跑。
- [x] 再寫分類＋理由共同提交、重試不重複、過期鎖定、跨人越權與跳階阻擋的測試，逐一紅綠。
- [x] 實作 combined 的 240 秒共享時限，答案與進度在同一交易保存；保留舊 evidence/ranking 回合相容。

## Task 3 回饋與成績
Files: api/public/ck_feedback.php、ck_results.php、ck_survey.php、api/src/review.php。
- [x] 先測控制組後測前無分數解析、完成後可查六關分類總分與等級邊界。
- [x] 實作後端授權及結果；完成旗標必須有六關與問卷開啟紀錄。
- [x] 再測 AI 回應、判準、模型與提示詞版本保存且重查不重產，逐一實作。

## Task 4 學生操作頁
Files: assets/js/game/app.js、api.js、tokens.css、review.css、control/game.html、results.html、survey.html、login.html。
- [x] 先用瀏覽器流程測試驗證開場拆頁、影片未完不能前進，實作後通過。
- [x] 再測合併頁可改分類、理由不消失、逾時保留草稿、後測導向圖卡，逐一紅綠。
- [x] 套用核可視覺：灰底、大字、右下前進、明顯倒數、靜態人物。

## Task 5 驗證與收尾
- [x] 完成兩輪 1280×800 / 375×812 截圖與八項自評。
- [x] 學生、研究者角度 QA；登入、越權、重複提交、草稿 XSS、提前查分與跳階安全案例。
- [x] 更新 HANDOFF/README；交付產品理解檢查點；全測＋PHP/JS 語法與 git diff --check。
- [ ] 遠端 push／核對：目前 GitHub DNS 失敗。程式提交與本機整合可完成；沒有既有正式站部署流程，不另建站。
