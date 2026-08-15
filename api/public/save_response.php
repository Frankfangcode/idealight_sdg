<?php
require_once '../src/db.php';

header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$pdo = db();

try {
    $stu_id = $input['stu_id'] ?? 'guest';
    $scenario_id = (int)($input['scenario_id'] ?? 1);
    $step = $input['step'] ?? '';

    // 使用 INSERT ... ON DUPLICATE KEY UPDATE 語法，确保 8 個情境的所有步驟都能正確保存或更新
    $sql = "INSERT INTO user_responses (
                stu_id, scenario_id, step, 
                q1_1_1, q1_1_2_1, q1_1_2_2, q1_1_2_3, q1_1_2_4, q1_1_2_5, 
                q1_1_3, q1_1_3_reason, q1_1_4, 
                decision_changed, change_reason
            ) VALUES (
                :stu_id, :scenario_id, :step, 
                :q1_1_1, :q1_1_2_1, :q1_1_2_2, :q1_1_2_3, :q1_1_2_4, :q1_1_2_5, 
                :q1_1_3, :q1_1_3_reason, :q1_1_4, 
                :decision_changed, :change_reason
            ) ON DUPLICATE KEY UPDATE 
                q1_1_1 = VALUES(q1_1_1),
                q1_1_2_1 = VALUES(q1_1_2_1),
                q1_1_2_2 = VALUES(q1_1_2_2),
                q1_1_2_3 = VALUES(q1_1_2_3),
                q1_1_2_4 = VALUES(q1_1_2_4),
                q1_1_2_5 = VALUES(q1_1_2_5),
                q1_1_3 = VALUES(q1_1_3),
                q1_1_3_reason = VALUES(q1_1_3_reason),
                q1_1_4 = VALUES(q1_1_4),
                decision_changed = VALUES(decision_changed),
                change_reason = VALUES(change_reason)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':stu_id' => $stu_id,
        ':scenario_id' => $scenario_id,
        ':step' => $step,
        ':q1_1_1' => $input['q1_1_1'] ?? null,
        ':q1_1_2_1' => $input['q1_1_2_1'] ?? null,
        ':q1_1_2_2' => $input['q1_1_2_2'] ?? null,
        ':q1_1_2_3' => $input['q1_1_2_3'] ?? null,
        ':q1_1_2_4' => $input['q1_1_2_4'] ?? null,
        ':q1_1_2_5' => $input['q1_1_2_5'] ?? null,
        ':q1_1_3' => $input['q1_1_3'] ?? null,
        ':q1_1_3_reason' => $input['q1_1_3_reason'] ?? null,
        ':q1_1_4' => $input['q1_1_4'] ?? null,
        ':decision_changed' => $input['decision_changed'] ?? null,
        ':change_reason' => $input['change_reason'] ?? null
    ]);

    // 同時更新實驗進度表
    $pdo->prepare("INSERT INTO experiment_progress (stu_id, current_scenario) VALUES (?, ?) ON DUPLICATE KEY UPDATE current_scenario = VALUES(current_scenario)")
        ->execute([$stu_id, $scenario_id]);

    echo json_encode(['success' => true, 'scenario_id' => $scenario_id, 'step' => $step]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
