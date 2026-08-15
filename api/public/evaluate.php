<?php
require_once '../src/db.php';

header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);

$apiKey = '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';

$stu_id = $input['stu_id'] ?? 'guest';
$scenario_id = $input['scenario_id'] ?? 1;

$pdo = db();

// 1. 獲取用戶的所有填答
$stmt = $pdo->prepare("SELECT * FROM user_responses WHERE stu_id = ? AND scenario_id = ?");
$stmt->execute([$stu_id, $scenario_id]);
$responses = $stmt->fetchAll();

// 2. 獲取對話記錄
$stmt = $pdo->prepare("SELECT * FROM ai_chat_logs WHERE stu_id = ? AND scenario_id = ?");
$stmt->execute([$stu_id, $scenario_id]);
$chats = $stmt->fetchAll();

// 3. 建構 Prompt 給 AI 評分
// $prompt = "你是一個認知偏誤評量的專家。請針對以下填答內容進行評分並給出評論。\n\n";
// $prompt .= "填答內容：\n" . json_encode($responses, JSON_UNESCAPED_UNICODE) . "\n\n";
// $prompt .= "對話記錄：\n" . json_encode($chats, JSON_UNESCAPED_UNICODE) . "\n\n";
// $prompt .= "評分準則：\n";
// $prompt .= "1. 認知偏誤了解能力 (Q1-1-1 + Q1-1-2): 指出偏誤得1-2分。\n";
// $prompt .= "2. 創意問題決策能力 (Q1-1-3 + Q1-1-4): 理由合理性得1-2分。\n";
// $prompt .= "3. AI 互動後分數 (Q1-2 + Q1-3): 辨識 AI 偏誤或提出無偏誤想法加分。\n\n";
// $prompt .= "請回傳 JSON 格式：{ 'cognitive_score': 數字, 'decision_score': 數字, 'interaction_score': 數字, 'total_score': 數字, 'cognitive_comment': '50-100字', 'decision_comment': '50-100字', 'interaction_comment': '50-100字' }";

$prompt = "你是一個認知偏誤評量的專家，接下來我要你針對填答的內容進行評分。評分要依照以下準則：\n\n";

$prompt .= "填答內容：\n" . json_encode($responses, JSON_UNESCAPED_UNICODE) . "\n\n";

$prompt .= "對話記錄：\n" . json_encode($chats, JSON_UNESCAPED_UNICODE) . "\n\n";

$prompt .= "評分準則：\n";

$prompt .= "Q1-1-1 指出1種認知偏誤得1分，指出2種認知偏誤得2分；其餘得0分。\n";

$prompt .= "Q1-1-2 有認知偏誤的想法得0分；無認知偏誤，但為情境中提到的想法得1分；無認知偏誤，想法不是情境中提出的想法得2分。\n";

$prompt .= "Q1-1-3 選A且需判斷描述是否為支持決策的合理理由 (每一個合理理由得1分)\n";
$prompt .= "選B且需判斷描述是否為支持決策的合理理由 (每一個合理理由得1分)\n";
$prompt .= "選C且需判斷描述是否為支持決策的合理理由 (每一個合理理由得1分)\n";
$prompt .= "選C且只要寫一個合理的理由，額外加2分。\n";

$prompt .= "Q1-1-4 都沒寫，或有提出問題，但未提出可行的解決方法得0分；有提出問題，且提出可行的解決方法，得1分。\n";

$prompt .= "Q1-2 (與非理性AI互動對話)\n";
$prompt .= "1. 提出一個有認知偏誤的想法加0分。\n";
$prompt .= "2. 提出一個「沒有」認知偏誤的想法即加1分。\n";
$prompt .= "3. 指出一個AI所犯的認知偏誤加1分。\n";

$prompt .= "Q1-3 (與理性AI互動對話)\n";
$prompt .= "1. 提出一個有認知偏誤的想法加0分。\n";
$prompt .= "2. 提出一個「沒有」認知偏誤的想法即加1分。\n\n";

$prompt .= "計算完分數後，最終要給出包含以下三項和計算總分：\n";

$prompt .= "1. 對於認知偏誤了解的能力：Q1-1-1 + Q1-1-2\n";
$prompt .= "大約50-100字的總結文字描述評論對於認知偏誤了解的能力，需要明確指出認知偏誤的內容與名稱，並以讓人了解偏誤的內容。\n\n";

$prompt .= "2. 對於創意問題決策的能力：Q1-1-3 + Q1-1-4\n";
$prompt .= "大約50-100字的總結文字描述評論對於創意問題決策的能力，需要指出對於決策合理性的評論、好的鼓勵和可以改進的地方。\n\n";

$prompt .= "3. AI互動後分數：Q1-2 + Q1-3\n";
$prompt .= "大約50-100字的總結文字描述評論和AI互動的過程，指出互動過程中好的地方和可以改進的地方，給予評論或鼓勵。\n\n";

$prompt .= "請回傳 JSON 格式：";
$prompt .= "{";
$prompt .= "\"cognitive_score\": 數字,";
$prompt .= "\"decision_score\": 數字,";
$prompt .= "\"interaction_score\": 數字,";
$prompt .= "\"total_score\": 數字,";
$prompt .= "\"cognitive_comment\": \"50-100字\",";
$prompt .= "\"decision_comment\": \"50-100字\",";
$prompt .= "\"interaction_comment\": \"50-100字\"";
$prompt .= "}";

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);

$payload = [
    'model' => 'gpt-4o',
    'messages' => [['role' => 'user', 'content' => $prompt]],
    'response_format' => ['type' => 'json_object']
];

curl_setopt($ch, CURLOPT_POSTFIELDS, JSON_encode($payload));
$response = curl_exec($ch);
$res_data = JSON_decode($response, true);
$evaluation = JSON_decode($res_data['choices'][0]['message']['content'], true);

// 存入数据库
$stmt = $pdo->prepare("INSERT INTO ai_evaluations (stu_id, scenario_id, cognitive_score, decision_score, interaction_score, total_score, cognitive_comment, decision_comment, interaction_comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([
    $stu_id, $scenario_id, 
    $evaluation['cognitive_score'], $evaluation['decision_score'], $evaluation['interaction_score'], $evaluation['total_score'],
    $evaluation['cognitive_comment'], $evaluation['decision_comment'], $evaluation['interaction_comment']
]);

echo JSON_encode($evaluation);
?>
