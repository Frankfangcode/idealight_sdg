-- 訊問機制改版：六選二、每人限問一次 → 六人皆可問、自由打字、不限次數只限時間
-- （2026-09-17 會議決議）
--
-- 已部署的環境執行這一支即可，不需要重建資料庫：
--   mysql -h 127.0.0.1 -u root -p idealightsdg < api/migrations/2026_09_interrogation_chat.sql
-- 全新環境照 README 跑 schema_cake.sql + seed_cake.sql，內容已包含這裡的變更。
-- 可重複執行。
--
-- 舊的 ck_interrogations 表刻意不在這裡 DROP：若該環境跑過前導測試，
-- 裡面是舊機制收到的資料，要不要留由研究者決定。新程式不再讀寫它。

-- Use the database selected by the caller. Preserve the existing student key type/collation.
SET @ck_student_column = (
 SELECT CONCAT(COLUMN_TYPE, ' CHARACTER SET ', CHARACTER_SET_NAME, ' COLLATE ', COLLATION_NAME)
 FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='students' AND COLUMN_NAME='stu_id'
);

SET @ck_ddl = CONCAT('CREATE TABLE IF NOT EXISTS ck_chat_messages (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  stu_id         ', @ck_student_column, '  NOT NULL,
  level_no       INT          NOT NULL,
  char_key       VARCHAR(4)   NOT NULL,
  role           ENUM(''player'',''character'',''nudge'') NOT NULL,
  content        TEXT         NOT NULL,
  ai_ok          TINYINT(1)   NULL DEFAULT NULL,
  latency_ms     INT          NULL DEFAULT NULL,
  model          VARCHAR(40)  NULL DEFAULT NULL,
  prompt_version VARCHAR(20)  NULL DEFAULT NULL,
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_chat_lookup (stu_id, level_no, id),
  CONSTRAINT fk_chat_student FOREIGN KEY (stu_id) REFERENCES students (stu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
PREPARE ck_stmt FROM @ck_ddl;
EXECUTE ck_stmt;
DEALLOCATE PREPARE ck_stmt;

SET @ck_ddl = CONCAT('CREATE TABLE IF NOT EXISTS ck_phase_timers (
  stu_id     ', @ck_student_column, '  NOT NULL,
  level_no   INT          NOT NULL,
  phase      VARCHAR(20)  NOT NULL,
  started_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (stu_id, level_no, phase),
  CONSTRAINT fk_timer_student FOREIGN KEY (stu_id) REFERENCES students (stu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
PREPARE ck_stmt FROM @ck_ddl;
EXECUTE ck_stmt;
DEALLOCATE PREPARE ck_stmt;

DELETE FROM ck_config WHERE ck_key = 'MAX_INTERROGATIONS';

INSERT INTO ck_config (ck_key, ck_value, is_public)
VALUES ('INTERROGATION', '{"seconds": 150, "graceSeconds": 3, "maxChars": 200, "nudgeIdleSeconds": 25}', 1)
ON DUPLICATE KEY UPDATE ck_key = ck_key;
