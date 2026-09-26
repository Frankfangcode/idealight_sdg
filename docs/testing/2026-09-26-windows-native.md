# Windows 原生相容性驗證（2026-09-26）

來源 `main@1bda91d`。在 Windows 原生 Apache／MariaDB／Chrome 完成既有 35 項測試；PHP 8.0.30 最小設定與 PHP 8.2.12 對照環境皆 **35 通過、0 失敗、0 跳過，退出碼 0**。產品 PHP／JS／SQL 無需修改。

**既有 XAMPP 完整 PHP 設定仍有待排除的穩定性問題**：即使測試全過，Apache 子程序仍曾崩潰。通過紀錄適用於下述隔離設定，不代表既有 8080 站台已完成正式驗收。本輪未修改該站台、原 `.env` 或研究資料。

## 實際環境

| 項目 | 本輪設定 |
|---|---|
| 作業系統／Shell | Windows，PowerShell 5.1，OS build 26100 |
| Apache | XAMPP Apache 2.4.58 Win64；獨立設定、`127.0.0.1:18082` |
| PHP | 既有 8.0.30 ZTS；另下載官方 8.2.12 ZTS x64 到暫存資料夾作版本對照 |
| 資料庫 | XAMPP MariaDB 10.4.32；另建 datadir、`127.0.0.1:33080`，`idealight_test_windows` |
| Node／Playwright／Chrome | 22.18.0／鎖定 1.63.0／153.0.8010.53 |
| AI／問卷 | `127.0.0.1:18080`，`local-test`；沒有呼叫真實模型 |
| 網站來源 | 複製 Git 追蹤檔案建立快照，不複製原 `.env`；另寫合成測試設定 |

本機 3306 實際由另一套 MySQL 佔用，XAMPP 客戶端連線時回報缺少 `caching_sha2_password.dll`。因此另建測試 MariaDB；沒有變更現有服務的帳號、驗證方式或資料。

## 驗收結果

- 35 項的行為與順序對應[原報告的逐項表](2026-09-26-xampp.md#每項測試)：註冊登入、兩組分派／並行鎖、兩組完整六關、訊問串流及共享界線、草稿／斷線補存、逾時、共同提交／重試、後測／分數、安全界線、全新安裝及重複遷移皆通過。
- PHP 8.0.30 與 8.2.12 各檢查 27 個 API PHP，語法皆通過；46 個 Git 追蹤 JS／MJS 語法通過。
- MariaDB 匯入後有六關、36 則證詞；測試驗證中文保存。訊問成功紀錄的模型為 `local-test`。
- 真實 Apache 拒絕 `.env`／`.ENV`、SQL 大小寫變體、測試／文件／API 私有目錄，回應 403／404。
- 影片工具建立七支實體檔，SHA-256 均與原 `video.mp4` 一致，沒有符號連結；保留既有檔案的案例通過。
- 另以 Chrome 播放實際 51.050667 秒來源影片的開場複製檔，使用 16 倍速等待真正 `ended` 事件，確認下一步解鎖、進入六人介紹；沒有攔截影片請求或手動派送結束事件。頁面無未處理 JS 錯誤；登入、遊戲、CSS、影片公開資源回應 200。
- Git 追蹤檔沒有 Windows 保留名稱、大小寫碰撞或符號連結。

## 發現與處理

### PowerShell 5.1 中文匯入

實測 `Get-Content api/seed_cake.sql -Raw` 與明確 `-Encoding UTF8` 的字串不相同。原重現文件只在寫出時指定 UTF-8，無法修復讀取時的錯誤解碼。已修正 [tests/README.md](../../tests/README.md)，三份 SQL 均明確以 UTF-8 讀取，並使用 `npm.cmd` 避免 npm.ps1 執行原則差異。

### Apache 子程序崩潰

沿用 `C:/xampp/php/php.ini` 的初始全測雖然 35/35，Apache 卻兩次回報 `exited with status 3221226356`；Windows Application 事件記錄例外 `0xc0000374`、模組 `ntdll.dll`。只補回 XAMPP 的 `AcceptFilter http none` 並重新啟動後，仍發生一次。不能把此設定當作修復，也未證實是哪個擴充或設定造成。

改用以下隔離最小 PHP 設定後，PHP 8.0.30 全測 35/35，該輪沒有子程序崩潰。這只能證明此設定下的測試結果，未逐一定位原設定的差異，也不是長時間壓力測試。

```ini
[PHP]
extension_dir=C:/xampp/php/ext
extension=curl
extension=mbstring
extension=pdo_mysql
extension=openssl
date.timezone=Asia/Taipei
display_errors=Off
log_errors=On
```

### PHP 8.2.12 版本對照

使用 [PHP 官方 Windows 封存套件](https://downloads.php.net/~windows/releases/archives/php-8.2.12-Win32-vs16-x64.zip)，下載檔 SHA-256：`DB26EC72D352E7FE7F9B542A1E70D868EEC18332093BCA21EB74C2824B3D418F`（本機計算供重現辨識）。只解壓到暫存資料夾，未覆蓋 XAMPP PHP。

初次混用現有 Apache 時，CLI 可載入 cURL，但 Apache 載入失敗，相關四項測試失敗（31/35）。在隔離 Apache 設定中，先 `LoadFile` 同一 PHP 套件的 `libcrypto-3-x64.dll`、`libssl-3-x64.dll`、`libssh2.dll`、`nghttp2.dll`，再載入 `php8ts.dll`／`php8apache2_4.dll`，並將 `PHPIniDir`／`extension_dir` 指向隔離 PHP 8.2 目錄後，35/35 通過、退出碼 0。網站與所有 PHP 子程序都使用 8.2.12；該輪及實體影片驗證期間未出現 Apache 異常重啟或 PHP 錯誤。

## 本輪重現與原始紀錄

所有暫存資料保留於 `C:/Users/User/AppData/Local/Temp/idealight-windows-bb789a74`。裡面只有 Git 追蹤內容、合成資料及假 AI 設定，沒有複製正式密鑰。測試完成後停止本輪的 Apache、模擬服務與 MariaDB；重跑須先依設定啟動。

- `site/`：被測快照；`schema.sql`：UTF-8 建表及劇本；`db/`：隔離 MariaDB。
- `httpd.conf`、`php-minimal/php.ini`：PHP 8.0 最小設定；`httpd82.conf`、`php82/php.ini`：8.2 對照設定。Apache 使用獨立 session 路徑、`AllowOverride All`、只監聽本機。
- `windows-baseline.log`：35/35，但原設定發生崩潰。
- `windows-final.log`：35/35，但補 AcceptFilter 後仍崩潰。
- `windows-minimal.log`：PHP 8.0 最小設定 35/35，31.821 秒，該輪沒有崩潰。
- `windows-php82.log`：cURL DLL 未補齊前 31/35，退出碼 1。
- `windows-php82-final.log`：PHP 8.2 全測 35/35，31.125 秒，退出碼 0。
- `apache-error.log`、`apache82-error.log`：保留失敗及成功環境的原始日誌；預期的私有路徑拒絕也會記為 authz error。
- `native-media-smoke.log`、`site/tests/native-smoke.mjs`：實體影片／公開資源補充驗證。

啟動上述隔離服務後，從 `site` 執行：

```powershell
$env:TEST_DB='idealight_test_windows'
$env:TEST_URL='http://127.0.0.1:18082'
$env:TEST_DB_PORT='33080'
$env:TEST_MYSQL_BINARY='C:/xampp/mysql/bin/mysql.exe'
$env:TEST_PHP_BINARY='C:/Users/User/AppData/Local/Temp/idealight-windows-bb789a74/php82/php.exe'
node tests/run.mjs
```

## 仍未驗證

既有正式 Apache 設定的穩定性、真實 AI／TLS 憑證與回答品質、正式 SurveyCake、七支正式關卡影片、正式研究資料搬移及長時間多人負載。本輪没有重跑另一套 MySQL，也沒有以其既有學生資料測試；先前 MySQL 35/35 證據仍見原報告。沒有變更正式站設定或安裝系統服務。
