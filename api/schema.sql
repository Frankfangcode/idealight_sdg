-- idealightsdg schema
-- 由 api/public/*.php 的 SQL 語句反推重建（原始 schema 檔未保留於 git）
-- 匯入方式：mysql -h 127.0.0.1 -u root -p < api/schema.sql

CREATE DATABASE IF NOT EXISTS idealightsdg
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE idealightsdg;

-- ---------------------------------------------------------------
-- students：學籍資料
-- register.php 靠「插入重複 stu_id 觸發例外」來判斷帳號已註冊，
-- 因此 stu_id 的唯一約束是程式邏輯的一部分，不可省略。
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  stu_id  VARCHAR(20) NOT NULL,
  name    VARCHAR(50) NOT NULL,
  gender  TINYINT     NOT NULL DEFAULT 3,  -- register.html: 1=男, 2=女；register.php 未選時預設 3
  age     INT              NULL,
  `group` VARCHAR(20)      NULL,           -- 實驗組別；GROUP 為保留字，查詢時務必加反引號
  PRIMARY KEY (stu_id),
  KEY idx_students_name (name)             -- login.php 以 stu_id + name 查詢
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- experiment_progress：每位學生目前進行到第幾個情境
-- save_response.php 使用 ON DUPLICATE KEY UPDATE，
-- 依賴 stu_id 為主鍵才能正確覆寫而非重複新增。
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS experiment_progress (
  stu_id           VARCHAR(20) NOT NULL,
  current_scenario INT         NOT NULL DEFAULT 1,
  updated_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (stu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- user_responses：各情境各步驟的填答內容
-- uniq_resp 是 save_response.php 的 ON DUPLICATE KEY UPDATE 依據，
-- 缺少此鍵會導致同一題重複作答時不斷新增資料列。
-- chat.php 以 (stu_id, scenario_id, step='step1') 取回填答內容組 prompt。
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_responses (
  id               INT         NOT NULL AUTO_INCREMENT,
  stu_id           VARCHAR(20) NOT NULL,
  scenario_id      INT         NOT NULL,           -- 1..8
  step             VARCHAR(10) NOT NULL,           -- 'step1'..'step4'
  q1_1_1           TEXT,                           -- 指出的認知偏誤
  q1_1_2_1         TEXT,                           -- 想法 1..5
  q1_1_2_2         TEXT,
  q1_1_2_3         TEXT,
  q1_1_2_4         TEXT,
  q1_1_2_5         TEXT,
  q1_1_3           VARCHAR(5),                     -- 決策選項 'A'/'B'/'C'
  q1_1_3_reason    TEXT,                           -- 決策理由
  q1_1_4           TEXT,                           -- 問題與可行解決方法
  decision_changed VARCHAR(5),                     -- 'Yes'/'No'
  change_reason    TEXT,
  created_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_resp (stu_id, scenario_id, step)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- ai_chat_logs：與 AI 的每一輪對話紀錄
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_chat_logs (
  id          INT         NOT NULL AUTO_INCREMENT,
  stu_id      VARCHAR(20) NOT NULL,
  scenario_id INT         NOT NULL,
  step        VARCHAR(10),
  ai_type     VARCHAR(20),                         -- 'irrational' / 'rational'
  user_input  TEXT,
  ai_response TEXT,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_chat_lookup (stu_id, scenario_id)        -- evaluate.php 以此條件撈取
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- ai_evaluations：AI 評分結果
-- evaluate.php 每次評分皆為 INSERT（不覆寫），故保留多筆歷史紀錄。
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_evaluations (
  id                  INT         NOT NULL AUTO_INCREMENT,
  stu_id              VARCHAR(20) NOT NULL,
  scenario_id         INT         NOT NULL,
  cognitive_score     INT,                         -- Q1-1-1 + Q1-1-2
  decision_score      INT,                         -- Q1-1-3 + Q1-1-4
  interaction_score   INT,                         -- Q1-2 + Q1-3
  total_score         INT,
  cognitive_comment   TEXT,
  decision_comment    TEXT,
  interaction_comment TEXT,
  created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_eval_lookup (stu_id, scenario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
