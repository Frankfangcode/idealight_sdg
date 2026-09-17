<?php
/**
 * 關卡回饋。這是本實驗唯一的操弄變項：
 *   控制組（UI-05）：只給完成訊息，不揭露任何判定
 *   實驗組（UI-06）：逐則對照正解 + 哪裡有瑕疵 + 還可以追問 + AI 針對理由的評語
 *
 * 必須先提交判斷才拿得到 —— 否則就成了作答前的正解查詢介面。
 * AI 回饋會寫進 ck_feedback；同一關重複索取時直接回既有內容，
 * 避免受試者反覆重整刷出不同版本的回饋（那會破壞組間一致性，也燒錢）。
 */

require_once __DIR__ . '/../src/api.php';
require_once __DIR__ . '/../src/config.php';

$stuId = ck_require_stu_id();
$run   = ck_run($stuId);

$in      = ck_input();
$levelNo = ck_valid_level((int)($in['levelNo'] ?? $_GET['levelNo'] ?? 0));

$pdo = db();

$stmt = $pdo->prepare('SELECT pick_char, reason, is_flaw FROM ck_judgments WHERE stu_id = ? AND level_no = ?');
$stmt->execute([$stuId, $levelNo]);
$judgment = $stmt->fetch();
if (!$judgment) {
    ck_fail('尚未提交這一關的判斷', 409);
}

// ---- 控制組：完成訊息，不揭露判定 ----
if (!ck_has_ai_feedback($run)) {
    ck_log($stuId, $levelNo, 'feedback', 'view', ['cond' => 'control']);
    ck_json([
        'success'  => true,
        'detailed' => false,   // 不回組別名稱，只回「有沒有詳細回饋」
        'message'  => '你已完成這一關的推理。稍後會進入下一關。',
    ]);
}

// ---- 實驗組：逐則對照 + AI 評語 ----
$feedback = ck_feedback_payload($levelNo);

// 受試者自己的作答，用來組 AI 的 prompt 並在畫面上對照
$stmt = $pdo->prepare('SELECT char_key, zone, is_correct FROM ck_evidence WHERE stu_id = ? AND level_no = ?');
$stmt->execute([$stuId, $levelNo]);
$evidence = [];
foreach ($stmt->fetchAll() as $r) {
    $evidence[$r['char_key']] = ['zone' => $r['zone'], 'isCorrect' => (bool)$r['is_correct']];
}

// 已產生過就直接回，不重新呼叫 AI
$stmt = $pdo->prepare(
    'SELECT ai_response FROM ck_feedback WHERE stu_id = ? AND level_no = ? ORDER BY id DESC LIMIT 1'
);
$stmt->execute([$stuId, $levelNo]);
$aiResponse = $stmt->fetchColumn() ?: null;

if ($aiResponse === null) {
    $grading    = ck_grading_data($levelNo);
    $characters = array_column(ck_characters(), 'name', 'char_key');

    $lines = [];
    foreach ($feedback['testimonies'] as $key => $t) {
        $mine = $evidence[$key] ?? null;
        $lines[] = sprintf(
            '%s（%s）：教師判定 %s；學生分類 %s%s',
            $characters[$key] ?? $key,
            $key,
            $t['correct'] === 'reasonable' ? '合理' : '有瑕疵',
            $mine ? ($mine['zone'] === 'reasonable' ? '合理' : '有瑕疵') : '未分類',
            $mine && !$mine['isCorrect'] ? '（與判定不符）' : ''
        );
    }

    $system = "你是批判思考課程的助教，正在給學生單一關卡的回饋。\n"
        . "本關訓練的技巧：{$grading['skills']}\n"
        . "本關判準：{$grading['ranking_criterion']}\n\n"
        . "要求：\n"
        . "1. 針對學生選出「說法最不合理的人」的理由，評論他的推理品質——"
        . "重點是他有沒有指出該說法從哪一項觀察跳到哪一個結論，而不是他選了誰。\n"
        . "2. 若他只憑角色身分、說話語氣或直覺判斷，要明確指出這一點。\n"
        . "3. 若他的證據牆分類與教師判定不符，挑最關鍵的一兩則說明差在哪裡。\n"
        . "4. 約 200-300 字，分 2-3 個短段落，語氣直接但不責備。\n"
        . "5. 不要重述題目，也不要條列所有六個人。";

    // 逾時提交可能沒選人、理由也可能空白。這時要讓 AI 知道是時間到，
    // 而不是把空白當成敷衍作答來評。
    $pickLine = $judgment['pick_char'] === null
        ? '【學生選出最不合理的人】未選擇（推理階段時間到，系統自動送出）'
        : '【學生選出最不合理的人】' . ($characters[$judgment['pick_char']] ?? $judgment['pick_char'])
          . '（該角色在本關的教師判定為' . ($judgment['is_flaw'] ? '有瑕疵' : '合理') . '）';

    $reasonLine = trim((string)$judgment['reason']) === ''
        ? '【學生的理由】未填寫（時間到）'
        : "【學生的理由】\n{$judgment['reason']}";

    $user = "【本關總結提示】\n{$feedback['aiFeedbackOpening']}\n\n"
        . "【階段性結論】\n{$feedback['conclusion']}\n\n"
        . "【判定與學生分類對照】\n" . implode("\n", $lines) . "\n\n"
        . $pickLine . "\n" . $reasonLine;

    // AI 掛掉或金鑰沒設定時，逐則對照的部分仍要照常顯示——
    // 那是 UI-06 的主體，不該因為外部 API 失敗就讓實驗組看不到回饋。
    try {
        $aiResponse = ck_openai_chat([
            ['role' => 'system', 'content' => $system],
            ['role' => 'user',   'content' => $user],
        ]);
    } catch (Throwable $e) {
        error_log('[ck_feedback] AI 回饋失敗：' . $e->getMessage());
        $aiResponse = null;
    }

    $pdo->prepare(
        'INSERT INTO ck_feedback (stu_id, level_no, prompt_version, ai_response) VALUES (?, ?, ?, ?)'
    )->execute([$stuId, $levelNo, 'v1', $aiResponse]);
}

ck_log($stuId, $levelNo, 'feedback', 'view', ['cond' => 'experiment', 'aiOk' => $aiResponse !== null]);

ck_json([
    'success'     => true,
    'detailed'    => true,
    'testimonies' => $feedback['testimonies'],   // 正解在這裡才第一次出前端
    'conclusion'  => $feedback['conclusion'],
    'evidence'    => $evidence,
    'judgment'    => ['pickChar' => $judgment['pick_char'], 'isFlaw' => (bool)$judgment['is_flaw']],
    'ai'          => $aiResponse,
    'aiFailed'    => $aiResponse === null,
]);
