<?php
require_once('../src/db.php');
$pdo = db(); // 使用 PDO 函數建立連線

// 檢查是否是 POST 方法
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stu_id = $_POST['ID'];      // 對應 input name="ID"
    $stu_name = $_POST['name'];  // 對應 input name="name"
    $gender = $_POST['gender'] ?? '3';
    $age = $_POST['age'] ?? null;

    // 檢查欄位是否為空
    if (!empty($stu_id) && !empty($stu_name) && !empty($gender) && !empty($age)) {
        try {
            $sql = "INSERT INTO students (stu_id, name, gender, age) VALUES (?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$stu_id, $stu_name, $gender, $age]);

            // 成功後導向
            header("Location: /login.html");
            exit;
        } catch (PDOException $e) {
            echo "<script>
                    alert('此帳號已重複註冊，請重新註冊！');
                    window.location.href = '/register.html';
                </script>";
        }
    } else {
        echo "欄位不能為空";
    }
} else {
    echo "錯誤的請求方式";
}
?>