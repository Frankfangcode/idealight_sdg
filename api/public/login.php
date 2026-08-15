<?php
session_start();
require_once('../src/db.php');
$pdo = db();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stu_id = $_POST['ID'] ?? '';
    $stu_name = $_POST['name'] ?? '';

    if (!empty($stu_id) && !empty($stu_name)) {
        try {
            // 【核心修正】使用 LEFT JOIN 串接學籍表(students)與進度表(experiment_progress)，精確抓出該學號的進度
            $sql = "SELECT s.*, p.current_scenario 
                    FROM students s 
                    LEFT JOIN experiment_progress p ON s.stu_id = p.stu_id 
                    WHERE s.stu_id = ? AND s.name = ?";
                    
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$stu_id, $stu_name]);

            if ($stmt->rowCount() > 0) {
                $student = $stmt->fetch(PDO::FETCH_ASSOC);
                
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
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => '欄位不能為空']);
    }
}
?>