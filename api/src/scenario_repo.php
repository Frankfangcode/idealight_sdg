<?php
/**
 * 劇本讀取層 —— 正解隔離的關卡在這裡。
 *
 * 規則：教師判定（ck_testimonies.correct / criterion）與判準
 * （ck_levels.ranking_criterion）只由 ck_answer_key() 與 ck_grading_data()
 * 取用，兩者都只在伺服器端被呼叫。給前端的 payload 一律走 ck_level_payload()，
 * 該函式的 SELECT 不含任何正解欄位 —— 不是靠事後 unset，是根本沒撈出來。
 */

require_once __DIR__ . '/db.php';

/** 目前登入者的學號；未登入回傳 null。 */
function ck_current_stu_id(): ?string
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    return $_SESSION['stu_id'] ?? null;
}

/**
 * 要求登入，未登入直接以 401 結束請求。
 * 舊的 chat.php 允許前端自帶 stu_id（預設 'guest'），任何人都能冒用他人學號，
 * 也能藉此把別人的作答讀出來。新的端點一律以 session 為準。
 */
function ck_require_stu_id(): string
{
    $stu = ck_current_stu_id();
    if ($stu === null || $stu === '') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => '尚未登入'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    return $stu;
}

/** 公開設定（is_public = 1）。 */
function ck_public_config(): array
{
    $rows = db()->query('SELECT ck_key, ck_value FROM ck_config WHERE is_public = 1')->fetchAll();
    $out = [];
    foreach ($rows as $r) {
        $out[$r['ck_key']] = json_decode($r['ck_value'], true);
    }
    return $out;
}

/** 單一設定值，不分公開與否（伺服器端使用）。 */
function ck_config(string $key)
{
    $stmt = db()->prepare('SELECT ck_value FROM ck_config WHERE ck_key = ?');
    $stmt->execute([$key]);
    $v = $stmt->fetchColumn();
    return $v === false ? null : json_decode($v, true);
}

/** 六個角色的公開資料。 */
function ck_characters(): array
{
    return db()->query(
        'SELECT char_key, name, role, trait FROM ck_characters ORDER BY sort_no'
    )->fetchAll();
}

function ck_level_count(): int
{
    return (int)db()->query('SELECT COUNT(*) FROM ck_levels')->fetchColumn();
}

/**
 * 給前端的關卡內容。
 * 刻意不 SELECT correct / criterion / followup / ranking_criterion。
 * ck_questions（教師版可用追問）也不出前端：訊問改為自由打字後，
 * 它只當 AI 角色的口徑依據，給受試者看等於提示他該問什麼。
 */
function ck_level_payload(int $levelNo): ?array
{
    $pdo = db();

    $stmt = $pdo->prepare(
        'SELECT level_no, name, skills, task, reasonable_count, video_src, video_script
         FROM ck_levels WHERE level_no = ?'
    );
    $stmt->execute([$levelNo]);
    $level = $stmt->fetch();
    if (!$level) {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT char_key, text FROM ck_testimonies WHERE level_no = ? ORDER BY char_key'
    );
    $stmt->execute([$levelNo]);
    $testimonies = [];
    foreach ($stmt->fetchAll() as $r) {
        $testimonies[$r['char_key']] = ['text' => $r['text']];
    }

    // 判準預設不出前端（見 ck_config.SHOW_RANKING_CRITERION 的說明）
    $criterion = null;
    if (ck_config('SHOW_RANKING_CRITERION') === true) {
        $stmt = $pdo->prepare('SELECT ranking_criterion FROM ck_levels WHERE level_no = ?');
        $stmt->execute([$levelNo]);
        $criterion = $stmt->fetchColumn() ?: null;
    }

    return [
        'rankingCriterion' => $criterion,
        'no'              => (int)$level['level_no'],
        'name'            => $level['name'],
        'skills'          => $level['skills'],
        'task'            => $level['task'],
        'reasonableCount' => (int)$level['reasonable_count'],
        'video'           => ['src' => $level['video_src'], 'script' => $level['video_script']],
        'testimonies'     => $testimonies,
    ];
}

/**
 * 該關的正解對照表：char_key => 'reasonable' | 'flaw'。
 * ★ 僅供伺服器端判定使用，不得直接回傳前端。
 */
function ck_answer_key(int $levelNo): array
{
    $stmt = db()->prepare('SELECT char_key, correct FROM ck_testimonies WHERE level_no = ?');
    $stmt->execute([$levelNo]);
    return array_column($stmt->fetchAll(), 'correct', 'char_key');
}

/**
 * 回饋階段才發放的教師判定內容（逐則對照正解 + 哪裡有瑕疵 + 還可以追問）。
 * 呼叫端必須先確認該關已提交判斷，且該受試者屬於實驗組。
 */
function ck_feedback_payload(int $levelNo): array
{
    $pdo = db();

    $stmt = $pdo->prepare(
        'SELECT char_key, correct, criterion, followup FROM ck_testimonies WHERE level_no = ? ORDER BY char_key'
    );
    $stmt->execute([$levelNo]);
    $items = [];
    foreach ($stmt->fetchAll() as $r) {
        $items[$r['char_key']] = [
            'correct'   => $r['correct'],
            'criterion' => $r['criterion'],
            'followup'  => $r['followup'],
        ];
    }

    $stmt = $pdo->prepare('SELECT conclusion, ai_feedback_opening FROM ck_levels WHERE level_no = ?');
    $stmt->execute([$levelNo]);
    $level = $stmt->fetch() ?: [];

    return [
        'testimonies'       => $items,
        'conclusion'        => $level['conclusion'] ?? null,
        'aiFeedbackOpening' => $level['ai_feedback_opening'] ?? null,
    ];
}

/** 評分／AI 回饋用的教師端資料（含判準）。★ 不得回傳前端。 */
function ck_grading_data(int $levelNo): array
{
    $stmt = db()->prepare(
        'SELECT name, skills, ranking_criterion, ai_feedback_opening, conclusion
         FROM ck_levels WHERE level_no = ?'
    );
    $stmt->execute([$levelNo]);
    return $stmt->fetch() ?: [];
}

/**
 * 取得或建立這位受試者的實驗回合。
 *
 * 組別編碼（students.`group`）：
 *   '1' → 實驗組（AI 角色共享問話紀錄；每關結束即時回饋）
 *   '2' → 控制組（AI 角色彼此獨立）
 *
 * 用數字而非 'experiment'／'control'，是為了不讓受試者從任何地方
 * （網址、localStorage、DevTools）看出自己被分到哪一組。
 * 內部的 ck_runs.cond 仍存語意值 —— 那是給研究者看的，不出前端。
 *
 * cond 在第一次建立時凍結：中途改組別不會讓已收的資料變成無法解讀。
 * 未設定時以鎖定的分派序號交替控制／實驗組；無法辨識的既有組別拒絕重分。
 */
function ck_run(string $stuId): array
{
    $pdo = db();
    $get = $pdo->prepare('SELECT r.*, COALESCE(s.flow_version,1) AS flow_version,
        COALESCE(s.onboarding_step,3) AS onboarding_step
        FROM ck_runs r LEFT JOIN ck_run_settings s ON s.run_id=r.id WHERE r.stu_id=?');
    $get->execute([$stuId]);
    if ($run = $get->fetch()) return $run;
    $pdo->beginTransaction();
    try {
        // A single locked row serializes simultaneous first logins. Recheck after acquiring it.
        $next = (int)$pdo->query('SELECT next_group FROM ck_allocation WHERE id=1 FOR UPDATE')->fetchColumn();
        $get->execute([$stuId]);
        if ($run = $get->fetch()) { $pdo->commit(); return $run; }
        $student = $pdo->prepare('SELECT `group` FROM students WHERE stu_id=? FOR UPDATE');
        $student->execute([$stuId]);
        $row = $student->fetch();
        if (!$row) throw new RuntimeException('Student not found');
        $group = trim((string)$row['group']);
        if (in_array($group, ['2','control','控制組'], true)) $cond = 'control';
        elseif (in_array($group, ['1','experiment','實驗組'], true)) $cond = 'experiment';
        elseif ($group === '') {
            if (!in_array($next,[1,2],true)) throw new RuntimeException('Allocation not initialized');
            $group = (string)$next;
            $cond = $next === 2 ? 'control' : 'experiment';
            $pdo->prepare('UPDATE students SET `group`=? WHERE stu_id=?')->execute([$group,$stuId]);
            $pdo->prepare('UPDATE ck_allocation SET next_group=? WHERE id=1')->execute([$next===2?1:2]);
        } else throw new RuntimeException('Unknown existing group; researcher must confirm');
        $pdo->prepare('INSERT INTO ck_runs (stu_id,cond) VALUES (?,?)')->execute([$stuId,$cond]);
        $id=(int)$pdo->lastInsertId();
        $pdo->prepare('INSERT INTO ck_run_settings(run_id) VALUES (?)')->execute([$id]);
        $pdo->prepare('INSERT IGNORE INTO ck_progress(stu_id,level_no,phase) VALUES (?,1,?)')->execute([$stuId,'video']);
        $pdo->commit();
        $get->execute([$stuId]);
        return $get->fetch();
    } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
}

/**
 * 實驗組才有 AI 逐則回饋（控制組只有完成訊息）。
 *
 * 2026-09-17 會議後這不再是唯一的操弄變項：主要操弄改為訊問時 AI 角色之間
 * 是否共享問話紀錄（見 interrogation.php）。回饋時機的新設計（實驗組每關即時、
 * 控制組後測完成後統一給）由 ck_feedback / ck_results 的門檻實作。
 * demo 原本的條件是 condition==='experiment' && session==='post'，
 * 因為當時設計是遊戲跑兩輪、只有後測輪給回饋；現行設計是遊戲跑一輪、
 * 前後各接一份 SurveyCake 問卷，所以 session 條件移除。
 * 若日後改回兩輪，只需在這裡加回 session 判斷。
 */
function ck_has_ai_feedback(array $run): bool
{
    return $run['cond'] === 'experiment';
}

/** 某階段的限時秒數；0 代表不限時。訊問的秒數另存在 INTERROGATION 設定裡。 */
function ck_phase_seconds(string $phase): int
{
    if ($phase === 'interrogation') {
        $cfg = ck_config('INTERROGATION');
        if (is_array($cfg) && isset($cfg['seconds'])) {
            return (int)$cfg['seconds'];
        }
    }
    $all = ck_config('PHASE_SECONDS');
    if ($phase === 'combined') return (int)($all['evidence'] ?? 60) + (int)($all['ranking'] ?? 180);
    return (int)($all[$phase] ?? 0);
}

/** 記下限時階段的起算時間。重複呼叫不會重設 —— 重整頁面拿不回時間。 */
function ck_timer_start(string $stuId, int $levelNo, string $phase): void
{
    if (ck_phase_seconds($phase) <= 0) {
        return;
    }
    db()->prepare('INSERT IGNORE INTO ck_phase_timers (stu_id, level_no, phase) VALUES (?, ?, ?)')
        ->execute([$stuId, $levelNo, $phase]);
}

/**
 * 該階段還剩幾秒（可為負值＝已逾時）；不限時的階段回傳 null。
 * 經過時間在 MySQL 端計算，避免 PHP 與資料庫時區設定不同造成誤差。
 */
function ck_timer_remaining(string $stuId, int $levelNo, string $phase): ?float
{
    $total = ck_phase_seconds($phase);
    if ($total <= 0) {
        return null;
    }
    ck_timer_start($stuId, $levelNo, $phase);

    $stmt = db()->prepare(
        'SELECT TIMESTAMPDIFF(MICROSECOND, started_at, NOW(3)) / 1000000
         FROM ck_phase_timers WHERE stu_id = ? AND level_no = ? AND phase = ?'
    );
    $stmt->execute([$stuId, $levelNo, $phase]);
    return $total - (float)$stmt->fetchColumn();
}

/** 記一筆事件（研究資料匯出用）。失敗不影響主流程。 */
function ck_log(string $stuId, ?int $levelNo, ?string $phase, string $event, array $payload = []): void
{
    try {
        db()->prepare(
            'INSERT INTO ck_events (stu_id, level_no, phase, event, payload) VALUES (?, ?, ?, ?, ?)'
        )->execute([
            $stuId, $levelNo, $phase, $event,
            $payload ? json_encode($payload, JSON_UNESCAPED_UNICODE) : null,
        ]);
    } catch (Throwable $e) {
        // 事件紀錄是輔助資料，寫不進去不該讓受試者的作答失敗
    }
}
