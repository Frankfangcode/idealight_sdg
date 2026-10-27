-- Additive dual-story study. No existing table or record is altered.
CREATE TABLE IF NOT EXISTS ck_story_allocation (
 study_key VARCHAR(64) NOT NULL PRIMARY KEY,
 next_sequence BIGINT NOT NULL DEFAULT 1
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS ck_story_studies (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 stu_id VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
 study_key VARCHAR(64) NOT NULL,
 allocation_no BIGINT NOT NULL,
 cond ENUM('control','experiment') NOT NULL,
 code VARCHAR(3) NOT NULL,
 current_position INT NOT NULL DEFAULT 1,
 assigned_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 completed_at TIMESTAMP(3) NULL,
 released_at TIMESTAMP(3) NULL,
 UNIQUE KEY uniq_story_student(stu_id),
 UNIQUE KEY uniq_story_allocation(study_key,allocation_no),
 CONSTRAINT fk_story_study_student FOREIGN KEY(stu_id) REFERENCES students(stu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS ck_story_runs (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 study_id BIGINT NOT NULL,
 story_id VARCHAR(20) NOT NULL,
 story_version VARCHAR(40) NOT NULL,
 position INT NOT NULL,
 onboarding_step INT NOT NULL DEFAULT 0,
 level_no INT NOT NULL DEFAULT 1,
 phase VARCHAR(20) NOT NULL DEFAULT 'video',
 started_at TIMESTAMP(3) NULL,
 finished_at TIMESTAMP(3) NULL,
 UNIQUE KEY uniq_story_position(study_id,position),
 UNIQUE KEY uniq_story_run(study_id,story_id),
 CONSTRAINT fk_story_run_study FOREIGN KEY(study_id) REFERENCES ck_story_studies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS ck_story_work (
 run_id BIGINT NOT NULL,
 level_no INT NOT NULL,
 payload JSON NOT NULL,
 updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 PRIMARY KEY(run_id,level_no),
 CONSTRAINT fk_story_work_run FOREIGN KEY(run_id) REFERENCES ck_story_runs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS ck_story_messages (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 run_id BIGINT NOT NULL,
 level_no INT NOT NULL,
 char_key VARCHAR(4) NOT NULL,
 role ENUM('player','character','nudge') NOT NULL,
 content TEXT NOT NULL,
 reply_to BIGINT NULL,
 ai_ok TINYINT NULL,
 latency_ms INT NULL,
 model VARCHAR(100) NULL,
 prompt_version VARCHAR(40) NULL,
 created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 KEY story_messages_lookup(run_id,level_no,id),
 CONSTRAINT fk_story_message_run FOREIGN KEY(run_id) REFERENCES ck_story_runs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS ck_story_events (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 run_id BIGINT NOT NULL,
 level_no INT NOT NULL,
 event_key VARCHAR(120) NOT NULL,
 event_type VARCHAR(40) NOT NULL,
 payload JSON NOT NULL,
 created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uniq_story_event(run_id,level_no,event_key),
 CONSTRAINT fk_story_event_run FOREIGN KEY(run_id) REFERENCES ck_story_runs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
