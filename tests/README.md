# 隔離驗證

測試會新增合成學生、調整合成回合的時間，並建立／刪除 `idealight_test_install_*`、`idealight_test_migrate_*`、`idealight_test_review_migrate_*` 暫存資料庫。**不可指定正式資料庫或真實 AI 試玩網站。** `TEST_DB` 必須以 `idealight_test_` 開頭，`TEST_URL` 必須明確指定本機地址；這只是防呆，仍須確認網站端的 DB_NAME 也指向同一個隔離資料庫。

已實測環境與逐項結果見 [原相容性報告](../docs/testing/2026-09-26-xampp.md)及 [Windows 原生驗證](../docs/testing/2026-09-26-windows-native.md)。全套為 35 個測試案例。新建資料庫支援 MariaDB 10.4.32 與 MySQL；不代表任何舊資料備份都能直接跨引擎匯入。

## 相依與設定

Node 22 以上（本輪 Node 24.5）、Chrome、PHP（pdo_mysql/curl/openssl/mbstring）、mysql 命令列工具。從專案根目錄執行 `npm ci --prefix tests`；Playwright 版本由 tests/package-lock.json 固定，使用既有 Chrome。影片 fixture 已包含在 tests/fixtures，不需安裝 ffmpeg。

| 變數 | 用途／預設 |
|---|---|
| TEST_DB | 必填；隔離資料庫名稱 |
| TEST_URL | 必填；使用模擬 AI 的本機網站網址 |
| TEST_DB_HOST / TEST_DB_PORT | 127.0.0.1 / 3306 |
| TEST_DB_USER / TEST_DB_PASS | root / 空字串；僅用合成測試帳密 |
| TEST_MYSQL_BINARY | mysql；Windows 可填 C:\\xampp\\mysql\\bin\\mysql.exe |
| TEST_PHP_BINARY | php；Windows 可填 C:\\xampp\\php\\php.exe |
| TEST_DB_SOCKET | 選填；Mac/Linux socket，Windows 用 TCP 即可 |
| PLAYWRIGHT_MODULE | 選填外部安裝路徑；預設使用 tests/node_modules |

資料庫帳號須可建立、刪除上述測試前綴的資料庫。測試密碼透過 MYSQL_PWD 傳給子程序，不寫進命令列。不要把正式 .env 複製到測試站。

## Windows 重跑方式（PowerShell）

使用獨立的測試 checkout 與 XAMPP 本機測試資料庫服務；以下只用合成資料。先確認這台 MySQL 上沒有同名測試庫。已在 Windows PowerShell 5.1、PHP 8.0.30、MariaDB 10.4.32 驗證建表及測試工具；完整 35 項使用原生 Apache 2.4.58 執行，詳見原生驗證報告。

先在專案根目錄開 PowerShell，建立測試用建表檔（將 SQL 內部的資料庫名稱一起替換，不能只在 mysql 命令末尾指定名稱）：

```powershell
$schemaText = (Get-Content api/schema.sql -Raw -Encoding UTF8) + "`n" + (Get-Content api/schema_cake.sql -Raw -Encoding UTF8) + "`n" + (Get-Content api/seed_cake.sql -Raw -Encoding UTF8)
$schemaText = $schemaText.Replace('idealightsdg', 'idealight_test_windows')
$schemaPath = Join-Path $env:TEMP 'idealight-test-schema.sql'
[IO.File]::WriteAllText($schemaPath, $schemaText, (New-Object Text.UTF8Encoding($false)))
$mysqlSource = 'source ' + $schemaPath.Replace('\', '/')
& C:\xampp\mysql\bin\mysql.exe --default-character-set=utf8mb4 -u root -e $mysqlSource
npm.cmd ci --prefix tests
```

上面使用本機空密碼；若已設密碼，用 `-p` 讓 mysql 提示輸入。不要使用正式研究資料庫。網站、PHP 子程序和測試命令三處的 DB 設定必須相同。PowerShell 5.1 讀取無 BOM 的 SQL 時必須指定 `-Encoding UTF8`；只在輸出時指定 UTF-8 無法修復已讀成亂碼的中文。先確認資料庫的實際連接埠及 `SELECT VERSION()`，不可假設 3306 一定是 XAMPP MariaDB；若使用其他連接埠，匯入命令也須帶 `--protocol=TCP -h 127.0.0.1 -P 連接埠`。

第一個視窗啟動模擬 AI／問卷並保持開啟：

```powershell
node tests/fake-llm.mjs
```

第二個視窗，設定僅供此程序使用的環境並啟動測試網站：

```powershell
$env:DB_HOST='127.0.0.1;port=3306'
$env:DB_NAME='idealight_test_windows'
$env:DB_USER='root'
$env:DB_PASS=''
$env:LLM_API_KEY='test'
$env:LLM_BASE_URL='http://127.0.0.1:18080'
$env:LLM_MODEL='local-test'
$env:SURVEYCAKE_POST_URL='http://127.0.0.1:18080/survey'
& C:\xampp\php\php.exe -S 127.0.0.1:18081 -t . tests/router.php
```

空密碼搭配的測試 checkout 不應包含正式 `.env`（部分 PowerShell 版本把空環境值移除；PHP 仍可使用預設空密碼）。如果有測試專用 .env，DB_PASS 也要一致。

第三個視窗執行：

```powershell
$env:TEST_DB='idealight_test_windows'
$env:TEST_URL='http://127.0.0.1:18081'
$env:TEST_DB_PORT='3306'
$env:TEST_DB_PASS=''
$env:TEST_MYSQL_BINARY='C:\xampp\mysql\bin\mysql.exe'
$env:TEST_PHP_BINARY='C:\xampp\php\php.exe'
node tests/run.mjs
```

`run.mjs` 自己列舉測試檔，不依賴 Windows shell 展開萬用字元。单一紅綠測試改用 `node --test tests/對應檔名.test.mjs`。

## 本輪 Mac／容器重現資訊

MySQL：隔離實例 TCP 33079，DB idealight_test_windows，PHP 8.5 網站 18081。MariaDB：官方 mariadb:10.4.32 容器 TCP 33080，PHP 8.2.12/Apache 網站 18082，映像由 tests/docker/Dockerfile 建立。兩個資料庫同名但在不同服務；模擬 AI 共用本機 18080。

```sh
TEST_DB=idealight_test_windows TEST_URL=http://127.0.0.1:18081 TEST_DB_PORT=33079 TEST_DB_PASS=test-not-used node tests/run.mjs
TEST_DB=idealight_test_windows TEST_URL=http://127.0.0.1:18082 TEST_DB_PORT=33080 TEST_DB_PASS=test-not-used TEST_MYSQL_BINARY=/tmp/idealight-revision/maria-client node tests/run.mjs
```

`test-not-used` 只是假資料庫的測試密碼。maria-client 是本機轉接腳本，呼叫容器自己的 mysql，並把 host port 33080 轉成容器內 3306；MySQL 9.6 客戶端缺少舊 MariaDB 所需的驗證 plugin，不能用它代替 XAMPP mysql.exe。此腳本不屬於產品依賴。

18079 是使用者真實 AI 試玩站，不能跑此套測試，也不應為了測試把它改回模擬 AI。容器的資料庫和網站皆綁定本機，網站快照不包含正式 .env。

## 驗證範圍與限制

資料庫保存、HTTP/PHP 邊界、Chrome 瀏覽器與交易鎖使用真實系統。`phase()` 與 SQL 調整合成 timer 省略等待 150/240 秒；AI、問卷用替身，影片請求使用一秒 fixture。新測試確認串流、AI 成功紀錄與兩組提示詞共享界線，**不驗證真實模型的回答品質**。

PHP 內建伺服器不讀 .htaccess，router.php 只模擬私有路徑規則；另已使用 Windows 原生 Apache 執行整套並驗證大小寫路徑保護。必須同時檢查 error log 是否有子程序異常重啟，不能只看 Node 的成功計數。本機原 PHP 設定曾出現原生崩潰，`AcceptFilter http none` 單獨不能排除；使用隔離的最小 PHP 設定後才取得無崩潰的測試紀錄，詳見報告。正式 SurveyCake、正式七支影片及舊 SDG 的外部 AI 流程仍待各自環境驗證。
