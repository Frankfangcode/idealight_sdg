# 隔離驗證

這些測試會新增合成學生、調整合成回合的時間，schema 測試會建立並刪除 `idealight_test_install_*` 暫存資料庫。**不可指定正式資料庫。** helpers 強制 `TEST_DB` 以 `idealight_test_` 開頭。網站仍使用正式程式，只把資料庫、AI 與問卷導向本機測試服務。

本輪工具：Node 24、PHP 8.5（pdo_mysql/curl/mbstring）、MySQL 9.6、Chrome、Playwright。正式資料表採 MySQL 8 的 `utf8mb4_0900_ai_ci`；MariaDB 不能直接套用本 SQL。

本輪環境設在 `/tmp/idealight-revision`：

- MySQL datadir `mysql-test/`，socket `run/mysql.sock`，port `33079`，資料庫 `idealight_test_review`。
- 僅此隔離 MySQL 的 `root@127.0.0.1` 測試密碼為 `test-not-used`（不是正式憑證）。
- PHP session 放在 `run/`；HTTP port `18079`；AI/問卷替身 `18080`。
- Playwright 裝在 `browser/`；`test-video.mp4` 是 ffmpeg 產生的一秒灰色測試片，瀏覽器只攔截影片請求，不放進產品 media。

啟動 MySQL 的示例（先建立目錄，以 `mysqld --initialize-insecure --datadir=...` 初始化；只能指向新的空目錄）：

```sh
mysqld --no-defaults --datadir=/tmp/idealight-revision/mysql-test --socket=/tmp/idealight-revision/run/mysql.sock --port=33079 --bind-address=127.0.0.1 --mysqlx=OFF
```

在這個隔離 MySQL 建立 `idealight_test_review`，把 schema.sql、schema_cake.sql、seed_cake.sql 中的 `idealightsdg` **全部**替換為 `idealight_test_review` 後依序匯入。建立上述僅限本機的測試帳號。不得直接在正式 MySQL 執行測試。

啟動兩個服務（在專案根目錄）：

```sh
node tests/fake-llm.mjs
DB_HOST='127.0.0.1;port=33079' DB_NAME=idealight_test_review DB_USER=root DB_PASS=test-not-used LLM_API_KEY=test LLM_BASE_URL=http://127.0.0.1:18080 LLM_MODEL=local-test SURVEYCAKE_POST_URL=http://127.0.0.1:18080/survey php -d session.save_path=/tmp/idealight-revision/run -S 127.0.0.1:18079 -t . tests/router.php
```

安裝測試瀏覽器驅動與製作測試影片：

```sh
npm install --prefix /tmp/idealight-revision/browser playwright @playwright/cli
ffmpeg -f lavfi -i color=c=gray:s=640x360:d=1 -c:v libx264 -pix_fmt yuv420p /tmp/idealight-revision/test-video.mp4
```

執行：

```sh
TEST_DB=idealight_test_review node --test --test-concurrency=1 tests/*.test.mjs
```

單一紅綠循環只指定當前 `*.test.mjs`。Chrome 須已安裝；Playwright module 可用 `PLAYWRIGHT_MODULE` 指定其他路徑。测试檔名和結果即是驗證清單。PHP 內建伺服器不讀 .htaccess，router.php 僅為本機模擬私有路徑；正式 Apache 的保護仍須部署後驗證。

`phase()` 和直接 SQL 更新 timer 只用於避免每個測試真的等待 150 / 240 秒；六關 workflow 的其餘切換、提交、AI 紀錄與後測皆經真實 HTTP/PDO/MySQL。並行分組另啟獨立 PHP 程序，確實測到資料庫交易鎖。測試不驗證真實模型串供品質、SurveyCake 回傳或正式影片內容。
