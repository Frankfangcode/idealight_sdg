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
 * 訊問問題只給題目文字，角色的回答要實際發問後才由 ask.php 發放。
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

    $stmt = $pdo->prepare(
        'SELECT id, char_key, seq, q FROM ck_questions WHERE level_no = ? ORDER BY char_key, seq'
    );
    $stmt->execute([$levelNo]);
    $questions = [];
    foreach ($stmt->fetchAll() as $r) {
        $questions[$r['char_key']][] = ['id' => (int)$r['id'], 'seq' => (int)$r['seq'], 'q' => $r['q']];
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
        'questions'       => $questions,
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
 *   '1' → 實驗組（每關結束提供 AI 教學回饋）
 *   '2' → 控制組（僅完成訊息）
 *
 * 用數字而非 'experiment'／'control'，是為了不讓受試者從任何地方
 * （網址、localStorage、DevTools）看出自己被分到哪一組。
 * 內部的 ck_runs.cond 仍存語意值 —— 那是給研究者看的，不出前端。
 *
 * cond 在第一次建立時凍結：中途改組別不會讓已收的資料變成無法解讀。
 * 未設定或無法辨識的值一律歸為實驗組，並記一筆到錯誤紀錄 ——
 * 靜默分組會讓問題拖到分析階段才被發現。
 */
function ck_run(string $stuId): array
{
    $pdo = db();

    $stmt = $pdo->prepare('SELECT * FROM ck_runs WHERE stu_id = ?');
    $stmt->execute([$stuId]);
    $run = $stmt->fetch();
    if ($run) {
        return $run;
    }

    $stmt = $pdo->prepare('SELECT `group` FROM students WHERE stu_id = ?');
    $stmt->execute([$stuId]);
    $group = (string)($stmt->fetchColumn() ?: '');

    $group = trim($group);
    if ($group === '2') {
        $cond = 'control';
    } elseif ($group === '1') {
        $cond = 'experiment';
    } else {
        // 舊資料相容：先前用文字標記的帳號仍能正確分組
        $isControl = stripos($group, 'control') !== false || mb_strpos($group, '控制') !== false;
        $cond = $isControl ? 'control' : 'experiment';
        error_log("[ck_run] {$stuId} 的 group 值為「{$group}」，非 1／2，暫歸為 {$cond}");
    }

    $pdo->prepare('INSERT INTO ck_runs (stu_id, cond) VALUES (?, ?)')->execute([$stuId, $cond]);
    $pdo->prepare('INSERT IGNORE INTO ck_progress (stu_id, level_no, phase) VALUES (?, 1, ?)')
        ->execute([$stuId, 'video']);

    $stmt = $pdo->prepare('SELECT * FROM ck_runs WHERE stu_id = ?');
    $stmt->execute([$stuId]);
    return $stmt->fetch();
}

/**
 * 實驗組才有 AI 逐則回饋（控制組只有完成訊息）。
 *
 * 這是整個實驗唯一的操弄變項，也是 demo 版 hasAiFeedback() 的替代。
 * demo 原本的條件是 condition==='experiment' && session==='post'，
 * 因為當時設計是遊戲跑兩輪、只有後測輪給回饋；現行設計是遊戲跑一輪、
 * 前後各接一份 SurveyCake 問卷，所以 session 條件移除。
 * 若日後改回兩輪，只需在這裡加回 session 判斷。
 */
function ck_has_ai_feedback(array $run): bool
{
    return $run['cond'] === 'experiment';
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
