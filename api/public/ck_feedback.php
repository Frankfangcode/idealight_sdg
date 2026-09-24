<?php
/**
 * 關卡回饋。回饋時機與角色資訊共享是本實驗的兩項組別差異：
 *   控制組（UI-05）：只給完成訊息，不揭露任何判定
 *   實驗組（UI-06）：逐則對照正解 + 哪裡有瑕疵 + 還可以追問 + AI 針對理由的評語
 *
 * 必須先提交判斷才拿得到 —— 否則就成了作答前的正解查詢介面。
 * AI 回饋會寫進 ck_feedback；同一關重複索取時直接回既有內容，
 * 避免受試者反覆重整刷出不同版本的回饋（那會破壞組間一致性，也燒錢）。
 */

require_once __DIR__ . '/../src/api.php';
require_once __DIR__ . '/../src/config.php';
require_once __DIR__ . '/../src/review.php';

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

$canReveal = ck_has_ai_feedback($run) || ck_post_completed($stuId);

// 兩組都保存評語；只有符合揭露門檻時才回傳給學生。
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
            $mine && $mine['zone'] !== 'unclassified' ? ($mine['zone'] === 'reasonable' ? '合理' : '有瑕疵') : '未分類',
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
        . "3. 證據牆分類對了幾則，一律以下面的【分類結果】為準，不要自己重新比對。"
        . "全部相符時，不可以說他的分類有落差或需要改進；"
        . "有不符時，只談【分類結果】列出的那幾則，挑最關鍵的一兩則說明差在哪裡。\n"
        . "4. 約 200-300 字，分 2-3 個短段落，語氣直接但不責備。\n"
        . "5. 不要重述題目，也不要條列所有六個人。\n"
        . "6. 只用純文字。不要用 Markdown 或 LaTeX（例如 **粗體**、# 標題、\$\\rightarrow\$），"
        . "畫面不會轉譯這些符號，學生會直接看到原始碼。";

    // 逾時提交可能沒選人、理由也可能空白。這時要讓 AI 知道是時間到，
    // 而不是把空白當成敷衍作答來評。
    $pickLine = $judgment['pick_char'] === null
        ? '【學生選出最不合理的人】未選擇（推理階段時間到，系統自動送出）'
        : '【學生選出最不合理的人】' . ($characters[$judgment['pick_char']] ?? $judgment['pick_char'])
          . '（該角色在本關的教師判定為' . ($judgment['is_flaw'] ? '有瑕疵' : '合理') . '）';

    $reasonLine = trim((string)$judgment['reason']) === ''
        ? '【學生的理由】未填寫（時間到）'
        : "【學生的理由】\n{$judgment['reason']}";

    // 對錯由程式算好直接給結論。改用較小的模型（gemma-4-26b-a4b）後實測，
    // 讓它自己從對照表判斷時，六則全對也會寫出「你的分類與教師標準仍有落差」。
    $wrong = [];
    foreach ($feedback['testimonies'] as $key => $t) {
        if (!(($evidence[$key]['isCorrect'] ?? false))) {
            $wrong[] = $characters[$key] ?? $key;
        }
    }
    $resultLine = $wrong
        ? '六則中有 ' . count($wrong) . ' 則與教師判定不符：' . implode('、', $wrong)
        : '六則全部與教師判定相符。';

    $user = "【本關總結提示】\n{$feedback['aiFeedbackOpening']}\n\n"
        . "【階段性結論】\n{$feedback['conclusion']}\n\n"
        . "【判定與學生分類對照】\n" . implode("\n", $lines) . "\n\n"
        . "【分類結果】\n{$resultLine}\n\n"
        . $pickLine . "\n" . $reasonLine;

    // AI 掛掉或金鑰沒設定時，逐則對照的部分仍要照常顯示——
    // 那是 UI-06 的主體，不該因為外部 API 失敗就讓實驗組看不到回饋。
    $requestMessages = [['role'=>'system','content'=>$system],['role'=>'user','content'=>$user]];
    try {
        $aiResponse = ck_llm_chat($requestMessages);
    } catch (Throwable $e) {
        error_log('[ck_feedback] AI 回饋失敗：' . $e->getMessage());
        $aiResponse = null;
    }

    $rawResponse = $aiResponse;
    // 規則 6 的保險：模型偶爾還是會吐 LaTeX 箭頭與 Markdown 粗體
    if ($aiResponse !== null) {
        $aiResponse = preg_replace('/\$\\\\(?:right|Right|long)?arrow\$/u', '→', $aiResponse);
        $aiResponse = preg_replace('/\*\*(.+?)\*\*/u', '$1', $aiResponse);
    }

    $pdo->prepare(
        'INSERT INTO ck_feedback (stu_id, level_no, prompt_version, ai_response) VALUES (?, ?, ?, ?)'
    )->execute([$stuId, $levelNo, 'v3', $aiResponse]);
    $feedbackId=(int)$pdo->lastInsertId();
    $pdo->prepare('INSERT INTO ck_feedback_audit(feedback_id,model,prompt_version,grading_criterion,request_messages,raw_response,status) VALUES(?,?,?,?,?,?,?)')
        ->execute([$feedbackId,ck_llm_model(),'v3',$grading['ranking_criterion'],json_encode($requestMessages,JSON_UNESCAPED_UNICODE),$rawResponse,$rawResponse===null?'failed':'ok']);
}

if (!$canReveal) {
    ck_json(['success'=>true,'detailed'=>false,'message'=>'本關作答已保存。完成後測問卷後，可查看總分與解析。']);
}
ck_log($stuId, $levelNo, 'feedback', 'view', ['cond' => $run['cond'], 'aiOk' => $aiResponse !== null]);

ck_json([
    'success'     => true,
    'detailed'    => true,
    'testimonies' => $feedback['testimonies'],   // 正解在這裡才第一次出前端
    'conclusion'  => $feedback['conclusion'],
    'evidence'    => $evidence,
    'judgment'    => ['pickChar' => $judgment['pick_char'], 'isFlaw' => (bool)$judgment['is_flaw']],
    'ai'          => $aiResponse,
    'aiFailed'    => $aiResponse === null,
    'totalScore' => ck_score($stuId),
]);
