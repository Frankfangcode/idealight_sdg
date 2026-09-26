# Windows XAMPP 相容性與全測計畫

> 以 executing-plans 自行逐项執行，既有使用者授權包含測試與相容性局部修復，不重開產品設計。

**Goal:** 驗證 GitHub checkout 後的 Windows XAMPP / MariaDB 安裝路徑，修復實證阻塞，提供完整測試結果與 Windows 操作文件。
**Architecture:** 保留原 PHP/原生 JS 與資料表結構；相容性修正只調整全新安裝 SQL／遷移相容方式、測試環境參數、部署工具及素材搬移。原有 MySQL 資料不轉碼、不重建。
**Tech Stack:** PHP 8.x / Apache、MySQL、MariaDB 10.4（XAMPP）、Node 測試及 Playwright。
**Spec:** 本輪使用者要求；PRODUCT.md 行為不變。

## Global Constraints
保留 18079 真實 AI 試玩環境；自動測試使用不同網站連接埠與隔離 `idealight_test_*` 資料庫。金鑰與真實學生資料不進 Git。沒有 Windows 執行證據就不能宣稱 Windows 全測通過。

## Review Focus
MySQL 專用 collation 的匯入失敗；舊學生表外鍵定序不一致；Windows checkout 不保證支援 symlink；只拉程式不會帶入 .env 或學生資料；测试脚本不得依賴 Mac 絕對路徑。

## Task 1 基線與 SQL
- [x] 另開 18081 / idealight_test_windows，跑原有全部測試，記錄既有失敗。
- [x] 使用隔離 MariaDB 10.4 執行現有 schema+seed，先看到預期的 collation 失敗，再以共享 utf8mb4_unicode_ci 修全新安裝，重跑匯入與外鍵／中文保存驗證。
- [x] 對新增表遷移重複匯入測試，確認不改已有研究資料；遇到舊 collation 不直接轉換正式庫，提供安全檢查與相容方式。

## Task 2 可攜驗證與素材
- [x] 先以非預設資料庫連接設定測試現有 helper，失敗後移除硬寫的 socket/port/密碼，讓全套測試可指定 Windows mysql.exe/php.exe。
- [x] 明確區分 mock 全測與真實 AI 少量連線測試，加入啟動前的環境確認，避免再次誤用模擬服務試玩。
- [x] 以乾淨 Git 素材清單檢查影片可用性；保留原 video.mp4，為 Windows 提供實體測試素材／複製工具，不提交七份重複大檔或不可靠的 symlink。

## Task 3 全測與交付
- [x] MySQL 與 MariaDB 各跑全部測試；PHP/JS 語法檢查、Apache 私有路徑與公開資源檢查、Git 檔名大小寫／Windows 限制檢查。
- [x] 更新 Windows XAMPP 安裝及資料庫新建／升級／搬移說明，包含 .env、憑證、站台根路徑與影片。
- [x] 獨立審查、產品理解交付、HANDOFF 記錄各項成功／失敗／未驗證。
- [ ] 來源全測通過後合併 main、main 重跑、push 並確認遠端；無既有部署流程不另建站。
