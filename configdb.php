<?php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') exit(0);

$host = "sql209.hstn.me";
$user = "mseet_40413842";
$pass = "6Nwmi8dLjuZH";
$db   = "mseet_40413842_users";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die(json_encode(["ok" => false, "message" => "Koneksi gagal: " . $conn->connect_error]));
}

function json_response($data, $code=200){
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// Ambil user_id dari tabel sessions
function getUserIdByToken($token){
    global $conn;
    if(empty($token)) return null;
    
    $stmt = $conn->prepare("SELECT user_id FROM sessions WHERE token = ? AND expires_at > NOW() LIMIT 1");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    
    return $row['user_id'] ?? null;
}
?>