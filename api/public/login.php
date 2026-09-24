<?php
session_start();
require_once __DIR__ . '/../src/scenario_repo.php';
$pdo = db();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stu_id = $_POST['ID'] ?? '';
    $stu_name = $_POST['name'] ?? '';

    if (!empty($stu_id) && !empty($stu_name)) {
        try {
            // 分別查詢，兼容兩代資料表不同的文字比對設定。
            $sql = "SELECT * FROM students WHERE stu_id = ? AND name = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$stu_id, $stu_name]);

            if ($stmt->rowCount() > 0) {
                $student = $stmt->fetch(PDO::FETCH_ASSOC);
                $progress = $pdo->prepare('SELECT current_scenario FROM experiment_progress WHERE stu_id=?');
                $progress->execute([$student['stu_id']]);
                $student['current_scenario'] = $progress->fetchColumn() ?: 1;
                
                session_regenerate_id(true);
                ck_run($student['stu_id']);
                $_SESSION['stu_id'] = $student['stu_id'];
                $_SESSION['stu_name'] = $student['name'];

                // 從進度表撈出來的 current_scenario 數字。如果沒有紀錄(全新學生)，就預設給 1
                $current_scenario = isset($student['current_scenario']) ? intval($student['current_scenario']) : 1;

                // 獲取實驗組別欄位
                $group = $student['group'] ?? '';

                echo json_encode([
                    'success' => true,
                    'id' => $student['stu_id'],
                    'name' => $student['name'],
                    'group' => $group,
                    'current_scenario' => $current_scenario // 💥 正確回傳真正的資料庫題號！
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => '學號或姓名錯誤，請重新輸入!']);
            }
        } catch (Throwable $e) {
            error_log('[login] ' . $e->getMessage());
            echo json_encode(['success' => false, 'message' => '登入暫時失敗，請稍後重試或聯絡施測人員']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => '欄位不能為空']);
    }
}
?>