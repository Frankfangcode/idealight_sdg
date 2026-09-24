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
