<?php
/**
 * 把 export_scenario.mjs 產生的 JSON 匯入內容表。
 *
 * 劇本的單一事實來源是 demo/js/scenario.js；本腳本只負責搬運，
 * 不在這裡編輯內容。改劇本 → 改 scenario.js → 重跑本腳本。
 *
 * 用法（在 idealight_sdg/ 底下執行）：
 *   node api/tools/export_scenario.mjs | php api/tools/import_scenario.php
 *   php api/tools/import_scenario.php scenario.json
 *
 * 整批包在交易裡：任何一步失敗就整個回滾，不會留下半套劇本。
 */

require_once __DIR__ . '/../src/db.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("本腳本只能由命令列執行\n");
}

$json = isset($argv[1]) ? file_get_contents($argv[1]) : stream_get_contents(STDIN);
if ($json === false || trim($json) === '') {
    fwrite(STDERR, "沒有讀到 JSON。請先跑 node api/tools/export_scenario.mjs\n");
    exit(1);
}

$data = json_decode($json, true);
if (!is_array($data) || !isset($data['SCENARIO'])) {
    fwrite(STDERR, "JSON 解析失敗或缺少 SCENARIO\n");
    exit(1);
}

$S = $data['SCENARIO'];
$pdo = db();

try {
    $pdo->beginTransaction();

    // 內容表整批重建。FK 有 ON DELETE CASCADE，但仍照相依順序刪，
    // 讓失敗時的錯誤訊息指向真正的問題而不是 FK。
    foreach (['ck_questions', 'ck_testimonies', 'ck_levels', 'ck_characters', 'ck_config'] as $t) {
        $pdo->exec("DELETE FROM {$t}");
    }

    // ---- 角色 ----
    $insChar = $pdo->prepare(
        'INSERT INTO ck_characters (char_key, name, role, trait, sort_no) VALUES (?, ?, ?, ?, ?)'
    );
    foreach ($S['characters'] as $i => $c) {
        $insChar->execute([$c['key'], $c['name'], $c['role'], $c['trait'], $i + 1]);
    }

    // ---- 關卡 ----
    $insLevel = $pdo->prepare(
        'INSERT INTO ck_levels
            (level_no, name, skills, task, reasonable_count,
             video_src, video_script, conclusion, ranking_criterion, ai_feedback_opening)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $insTesti = $pdo->prepare(
        'INSERT INTO ck_testimonies (level_no, char_key, text, correct, criterion, followup)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $insQ = $pdo->prepare(
        'INSERT INTO ck_questions (level_no, char_key, seq, q, a, detail) VALUES (?, ?, ?, ?, ?, ?)'
    );

    foreach ($S['levels'] as $L) {
        $insLevel->execute([
            $L['no'],
            $L['name'],
            $L['skills'],
            $L['task'],
            $L['reasonableCount'],
            $L['video']['src']    ?? null,
            $L['video']['script'] ?? null,
            $L['conclusion']        ?? null,
            $L['rankingCriterion']  ?? null,
            $L['aiFeedbackOpening'] ?? null,
        ]);

        foreach ($L['testimonies'] as $key => $t) {
            $insTesti->execute([
                $L['no'], (string)$key, $t['text'], $t['correct'], $t['criterion'], $t['followup'] ?? null,
            ]);
        }

        foreach (($L['questions'] ?? []) as $key => $qs) {
            foreach ($qs as $i => $q) {
                $insQ->execute([$L['no'], (string)$key, $i + 1, $q['q'], $q['a'], $q['detail']]);
            }
        }
    }

    // ---- 設定與大塊內容 ----
    // is_public = 0 的項目由 scenario_repo 過濾，不會出現在給前端的 payload。
    $insCfg = $pdo->prepare('INSERT INTO ck_config (ck_key, ck_value, is_public) VALUES (?, ?, ?)');
    $cfg = [
        ['PHASE_SECONDS',           $data['PHASE_SECONDS'],           1],
        ['MAX_INTERROGATIONS',      $data['MAX_INTERROGATIONS'],      1],
        ['ZONES',                   $data['ZONES'],                   1],
        ['RANKING_QUESTION',        $data['RANKING_QUESTION'],        1],
        ['SHOW_OWN_CLASSIFICATION', $data['SHOW_OWN_CLASSIFICATION'], 1],
        // 本關判準（ranking_criterion）要不要在推理階段顯示給受試者。
        // demo 是顯示的，但判準等同把該關有瑕疵的發言逐一點名
        // （例：關卡 1 的判準直接寫出「用間接線索指認人、用缺失畫面補完動作、
        // 用其他層架正常排除單點異常」三種瑕疵），顯示會讓題目失去鑑別度。
        // 預設關閉；這是研究設計的決定，要開就把值改成 true 後重跑匯入。
        ['SHOW_RANKING_CRITERION',  false,                            1],
        ['meta',                    ['id' => $S['id'], 'title' => $S['title'], 'subtitle' => $S['subtitle']], 1],
        ['brief',                   $S['brief'],                      1],
        // truth 與 debrief 是第 6 關結束後才揭露，交由專屬端點在完成後才發。
        ['truth',                   $S['truth'],                      0],
        ['debrief',                 $S['debrief'],                    0],
    ];
    foreach ($cfg as [$k, $v, $pub]) {
        $insCfg->execute([$k, json_encode($v, JSON_UNESCAPED_UNICODE), $pub]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    fwrite(STDERR, '匯入失敗，已回滾：' . $e->getMessage() . "\n");
    exit(1);
}

// ---- 匯入後檢核 ----
$counts = [];
foreach (['ck_characters', 'ck_levels', 'ck_testimonies', 'ck_questions', 'ck_config'] as $t) {
    $counts[$t] = (int)$pdo->query("SELECT COUNT(*) FROM {$t}")->fetchColumn();
}

// 每關的合理發言數必須等於 reasonable_count，否則代表判定資料在搬運中壞掉
$bad = $pdo->query(
    "SELECT l.level_no, l.reasonable_count,
            SUM(t.correct = 'reasonable') AS actual
     FROM ck_levels l
     JOIN ck_testimonies t ON t.level_no = l.level_no
     GROUP BY l.level_no, l.reasonable_count
     HAVING actual <> l.reasonable_count"
)->fetchAll();

echo "匯入完成\n";
foreach ($counts as $t => $n) {
    printf("  %-16s %d\n", $t, $n);
}

if ($bad) {
    fwrite(STDERR, "警告：以下關卡的合理發言數與檢核值不符\n");
    foreach ($bad as $r) {
        fwrite(STDERR, "  關卡 {$r['level_no']}：標 {$r['reasonable_count']}，實際 {$r['actual']}\n");
    }
    exit(1);
}
echo "  正解檢核  六關全數相符\n";
