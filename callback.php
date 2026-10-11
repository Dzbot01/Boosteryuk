<?php
ini_set('display_errors', 0);
error_reporting(0);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Callback-Secret");
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD']=='OPTIONS') exit(0);

// Ambil raw input dulu biar tau callback masuk walau DB mati
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(["ok"=>true,"msg"=>"callback active - GET ok"]);
    exit;
}

$SECRET = "BOOSTERYUK123";
$headerSecret = $_SERVER['HTTP_X_CALLBACK_SECRET']?? '';
if ($headerSecret!== $SECRET) {
    http_response_code(403);
    echo json_encode(["ok"=>false,"message"=>"Forbidden"]);
    exit;
}

$merchant_ref = $data['merchant_ref']?? '';
$status = $data['status']?? '';
$amount_callback = $data['amount']?? $data['amount_received']?? 0;

if ($status!== 'PAID') {
    echo json_encode(["ok"=>true,"message"=>"ignore $status"]);
    exit;
}

// Baru load DB - bungkus try
try {
    include __DIR__. "/configdb.php";
} catch (Throwable $e) {
    echo json_encode(["ok"=>false,"message"=>"configdb include error: ".$e->getMessage()]);
    exit;
}

if (!isset($conn) || $conn->connect_error) {
    echo json_encode(["ok"=>false,"message"=>"DB connect failed: ".($conn->connect_error?? 'no conn'), "host"=>$host?? 'no host']);
    exit;
}

$exp = explode("-", $merchant_ref);
$user_id = intval($exp[1]?? 0);
$amount_final = intval($amount_callback);

if ($user_id <= 0) {
    echo json_encode(["ok"=>false,"message"=>"User ID not found in $merchant_ref"]);
    exit;
}

// Update - pakai query langsung biar gak prepare error
$user_id = intval($user_id);
$amount_final = intval($amount_final);
$sql = "UPDATE users SET saldo = saldo + $amount_final WHERE id = $user_id";
if ($conn->query($sql)) {
    file_put_contents(__DIR__. "/tripay_log.txt", date("Y-m-d H:i:s")." $merchant_ref $user_id +$amount_final\n", FILE_APPEND);
    echo json_encode(["ok"=>true,"message"=>"Saldo updated $user_id +$amount_final", "affected"=>$conn->affected_rows]);
} else {
    echo json_encode(["ok"=>false,"message"=>"Query fail: ".$conn->error, "sql"=>$sql]);
}
?>