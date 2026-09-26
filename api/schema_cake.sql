-- 〈消失的月蝕巧克力莓果千層蛋糕〉六關批判思考實驗 — schema
--
-- 設計原則：
--   1. 內容表（ck_levels / ck_characters / ck_testimonies / ck_questions）與
--      作答表分離。教師判定與正解只存在內容表，API 不對前端輸出。
--   2. 前綴 ck_ 與既有的 SDG 認知偏誤實驗（students 以外的表）區隔，
--      兩個實驗共用 students 學籍表與同一個資料庫。
--   3. 內容表由 api/tools/import_scenario.php 從 demo/js/scenario.js 匯入，
--      不手動維護；改劇本請改 scenario.js 後重跑匯入。
--
-- 匯入：mysql -h 127.0.0.1 -u root -p idealightsdg < api/schema_cake.sql

USE idealightsdg;

-- =================================================================
-- 內容表（正解在這裡，不出前端）
-- =================================================================

-- 六個角色。key 為 '1'..'6'，名字本身帶編號（一承、二寧…）故不另標 A-F。
CREATE TABLE IF NOT EXISTS ck_characters (
  char_key VARCHAR(4)   NOT NULL,
  name     VARCHAR(50)  NOT NULL,
  role     VARCHAR(100) NOT NULL,
  trait    VARCHAR(255) NOT NULL,
  sort_no  INT          NOT NULL,
  PRIMARY KEY (char_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 六個關卡。ranking_criterion 與 ai_feedback_opening 供評分／回饋使用，
-- 屬於教師端資料，同樣不對前端輸出。
CREATE TABLE IF NOT EXISTS ck_levels (
  level_no            INT          NOT NULL,
  name                VARCHAR(100) NOT NULL,
  skills              VARCHAR(255) NOT NULL,   -- 該關訓練的批判思考技巧
  task                TEXT         NOT NULL,   -- 給受試者看的關卡任務說明
  reasonable_count    INT          NOT NULL,   -- 合理發言數，作為匯入時的檢核值
  video_src           VARCHAR(255),
  video_script        TEXT,
  conclusion          TEXT,                    -- 階段性結論（回饋階段顯示）
  ranking_criterion   TEXT,                    -- 判準（教師端，評分用）
  ai_feedback_opening TEXT,                    -- 本關總結提示（AI 回饋開場）
  PRIMARY KEY (level_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 角色發言。correct 與 criterion 是教師判定＝正解，絕不可經 API 外流。
CREATE TABLE IF NOT EXISTS ck_testimonies (
  level_no  INT        NOT NULL,
  char_key  VARCHAR(4) NOT NULL,
  text      TEXT       NOT NULL,                          -- 發言原文（可出前端）
  correct   ENUM('reasonable','flaw') NOT NULL,           -- ★正解
  criterion TEXT       NOT NULL,                          -- ★判定理由
  followup  TEXT,                                         -- 可用追問（回饋階段才出）
  PRIMARY KEY (level_no, char_key),
  CONSTRAINT fk_testimony_level FOREIGN KEY (level_no) REFERENCES ck_levels (level_no) ON DELETE CASCADE,
  CONSTRAINT fk_testimony_char  FOREIGN KEY (char_key) REFERENCES ck_characters (char_key) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 教師版的「可用追問」與角色回答。
-- 訊問改為自由打字後，這些不再是給受試者點選的選項，也不出前端；
-- 改當作 AI 角色的口徑依據：被問到類似問題時，要照這裡的事實與語氣回答
-- （見 api/src/interrogation.php）。內容嚴格限制在該關已揭露的資訊內。
CREATE TABLE IF NOT EXISTS ck_questions (
  id       INT        NOT NULL AUTO_INCREMENT,
  level_no INT        NOT NULL,
  char_key VARCHAR(4) NOT NULL,
  seq      INT        NOT NULL,          -- 同一角色同一關的第幾個問題
  q        TEXT       NOT NULL,
  a        VARCHAR(20) NOT NULL,         -- 是／否／不知道
  detail   TEXT       NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_question (level_no, char_key, seq),
  CONSTRAINT fk_question_level FOREIGN KEY (level_no) REFERENCES ck_levels (level_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 單值設定與大塊 JSON（PHASE_SECONDS、INTERROGATION、ZONES、
-- RANKING_QUESTION、SHOW_OWN_CLASSIFICATION、brief、truth、debrief）。
-- is_public = 0 的項目不對前端輸出。
CREATE TABLE IF NOT EXISTS ck_config (
  ck_key    VARCHAR(64) NOT NULL,
  ck_value  JSON        NOT NULL,
  is_public TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (ck_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- 作答表
-- =================================================================

-- 一位受試者跑一輪遊戲。cond 由 students.`group` 帶入後凍結，
-- 避免中途改組別導致資料無法解讀。
CREATE TABLE IF NOT EXISTS ck_runs (
  id          INT         NOT NULL AUTO_INCREMENT,
  stu_id      VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  cond        ENUM('experiment','control') NOT NULL,
  started_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP   NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_run (stu_id),
  CONSTRAINT fk_run_student FOREIGN KEY (stu_id) REFERENCES students (stu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 目前進度。phase 對應前端 PHASES 陣列。
-- 重整或關掉瀏覽器後由此續跑（DEMO 的 sessionStorage 版本做不到）。
CREATE TABLE IF NOT EXISTS ck_progress (
  stu_id     VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  level_no   INT         NOT NULL DEFAULT 1,
  phase      VARCHAR(20) NOT NULL DEFAULT 'video',
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (stu_id),
  CONSTRAINT fk_progress_student FOREIGN KEY (stu_id) REFERENCES students (stu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 訊問對話。六位角色都可以問、自由打字、不限次數，只以時間為限
-- （2026-09-17 會議決議；舊機制「六選二、每人限問一次」的 ck_interrogations 已停用）。
--
--   player    受試者打的問題
--   character AI 角色的回答。ai_ok = 0 代表 OpenAI 失敗、改用預寫的備援台詞，
--             分析時要能把這些回合挑出來
--   nudge     受試者閒置時角色主動開口的預寫台詞（不經 LLM，兩組相同）
--
-- 兩組的差異（AI 角色之間是否共享問話紀錄）不存在這張表裡，而是
-- 組 prompt 時決定要帶哪些列進去 —— 見 api/src/interrogation.php。
-- prompt_version 讓日後能追溯每句回答是在哪一版提示詞下產生的。
CREATE TABLE IF NOT EXISTS ck_chat_messages (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  stu_id         VARCHAR(50)  COLLATE utf8mb4_unicode_ci NOT NULL,
  level_no       INT          NOT NULL,
  char_key       VARCHAR(4)   NOT NULL,
  role           ENUM('player','character','nudge') NOT NULL,
  content        TEXT         NOT NULL,
  ai_ok          TINYINT(1)   NULL DEFAULT NULL,
  latency_ms     INT          NULL DEFAULT NULL,       -- 送出問題到回答完成
  model          VARCHAR(40)  NULL DEFAULT NULL,
  prompt_version VARCHAR(20)  NULL DEFAULT NULL,
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_chat_lookup (stu_id, level_no, id),
  CONSTRAINT fk_chat_student FOREIGN KEY (stu_id) REFERENCES students (stu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 各限時階段的伺服器端起算時間。
-- 訊問改成自由提問後，時間是唯一的限制，不能只靠前端倒數：
-- 逾時的提問由 ck_chat.php 依這裡的時間拒收；重整頁面也從這裡還原剩餘秒數，
-- 不會因為清掉 sessionStorage 就重新拿到一整段時間。
CREATE TABLE IF NOT EXISTS ck_phase_timers (
  stu_id     VARCHAR(50)  COLLATE utf8mb4_unicode_ci NOT NULL,
  level_no   INT          NOT NULL,
  phase      VARCHAR(20)  NOT NULL,
  started_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (stu_id, level_no, phase),
  CONSTRAINT fk_timer_student FOREIGN KEY (stu_id) REFERENCES students (stu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 證據牆分類。一位受試者在一關對每個角色只有一個分類結果。
-- is_correct 由後端比對 ck_testimonies.correct 後寫入，前端不參與判定。
CREATE TABLE IF NOT EXISTS ck_evidence (
  stu_id       VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  level_no     INT         NOT NULL,
  char_key     VARCHAR(4)  NOT NULL,
  -- unclassified：計時到期時尚未分類的角色。逾時不該讓整筆作答失敗，
  -- 「沒分類完」本身就是要保留的研究資料。
  zone         ENUM('reasonable','flaw','unclassified') NOT NULL,
  is_correct   TINYINT(1)  NOT NULL,
  timed_out    TINYINT(1)  NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (stu_id, level_no, char_key),
  CONSTRAINT fk_evidence_student FOREIGN KEY (stu_id) REFERENCES students (stu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 判斷階段：選出說法最不合理的一人 ＋ 理由。
-- 本案六人皆有涉入，故 is_flaw 只記錄所選對象在該關是否被判定為有瑕疵，
-- 不等於「答對」——真正的評分要看 reason 的推理品質（由 AI 依 ranking_criterion 評）。
CREATE TABLE IF NOT EXISTS ck_judgments (
  stu_id       VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  level_no     INT         NOT NULL,
  -- 逾時強制提交時可能還沒選人／理由未達字數，故兩欄可為 NULL
  pick_char    VARCHAR(4)  NULL,
  reason       TEXT        NULL,
  is_flaw      TINYINT(1)  NOT NULL,
  timed_out    TINYINT(1)  NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (stu_id, level_no),
  CONSTRAINT fk_judgment_student FOREIGN KEY (stu_id) REFERENCES students (stu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI 回饋（僅實驗組）。保留 prompt 版本以便日後追溯回饋內容的產生條件。
CREATE TABLE IF NOT EXISTS ck_feedback (
  id             INT         NOT NULL AUTO_INCREMENT,
  stu_id         VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  level_no       INT         NOT NULL,
  prompt_version VARCHAR(20) NOT NULL DEFAULT 'v1',
  ai_response    MEDIUMTEXT,
  created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_feedback_lookup (stu_id, level_no),
  CONSTRAINT fk_feedback_student FOREIGN KEY (stu_id) REFERENCES students (stu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 前測／後測問卷。問卷本身在 SurveyCake，這裡只記錄開啟與完成的時間點，
-- 供事後與 SurveyCake 匯出的資料以 stu_id 對接。
CREATE TABLE IF NOT EXISTS ck_surveys (
  stu_id       VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  kind         ENUM('pre','post') NOT NULL,
  opened_at    TIMESTAMP   NULL DEFAULT NULL,
  completed_at TIMESTAMP   NULL DEFAULT NULL,
  PRIMARY KEY (stu_id, kind),
  CONSTRAINT fk_survey_student FOREIGN KEY (stu_id) REFERENCES students (stu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 事件紀錄。研究資料匯出與流程分析用（停留時間、逾時、翻牌順序等）。
-- payload 用 JSON 收各事件的自由欄位，避免每加一種事件就改表。
CREATE TABLE IF NOT EXISTS ck_events (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  stu_id     VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  level_no   INT,
  phase      VARCHAR(20),
  event      VARCHAR(40) NOT NULL,
  payload    JSON,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_events_lookup (stu_id, created_at),
  CONSTRAINT fk_events_student FOREIGN KEY (stu_id) REFERENCES students (stu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Additive only. Run against the selected database after schema_cake.sql.
CREATE TABLE IF NOT EXISTS ck_allocation (
 id TINYINT NOT NULL PRIMARY KEY,
 next_group TINYINT NOT NULL DEFAULT 2
) ENGINE=InnoDB;
INSERT IGNORE INTO ck_allocation (id,next_group) VALUES (1,2);
CREATE TABLE IF NOT EXISTS ck_run_settings (
 run_id INT NOT NULL PRIMARY KEY,
 flow_version INT NOT NULL DEFAULT 2,
 onboarding_step INT NOT NULL DEFAULT 0,
 CONSTRAINT fk_settings_run FOREIGN KEY (run_id) REFERENCES ck_runs(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS ck_drafts (
 run_id INT NOT NULL,
 level_no INT NOT NULL,
 phase VARCHAR(20) NOT NULL,
 payload JSON NOT NULL,
 revision BIGINT NOT NULL,
 frozen TINYINT NOT NULL DEFAULT 0,
 updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 PRIMARY KEY(run_id,level_no,phase),
 CONSTRAINT fk_draft_run FOREIGN KEY(run_id) REFERENCES ck_runs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS ck_video_progress (
 run_id INT NOT NULL,
 level_no INT NOT NULL,
 position_seconds DOUBLE NOT NULL DEFAULT 0,
 completed TINYINT NOT NULL DEFAULT 0,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY(run_id,level_no),
 CONSTRAINT fk_video_run FOREIGN KEY(run_id) REFERENCES ck_runs(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS ck_feedback_audit (
 feedback_id INT NOT NULL PRIMARY KEY,
 model VARCHAR(100) NOT NULL,
 prompt_version VARCHAR(30) NOT NULL,
 grading_criterion TEXT,
 request_messages JSON NOT NULL,
 raw_response MEDIUMTEXT,
 status VARCHAR(20) NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_audit_feedback FOREIGN KEY(feedback_id) REFERENCES ck_feedback(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
