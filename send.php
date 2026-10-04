<?php
/*
  send.php - receives the contact form and emails it to the business.
  Change the setting below if enquiries should go somewhere else,
  then upload this file next to index.html.
*/

$TO      = 'ecoconstruction.build@gmail.com';   // where enquiries are sent
$SUBJECT = 'New enquiry from the website';

// ---------------------------------------------------------------- settings end

header('Content-Type: application/json; charset=utf-8');

function stop($code, $message) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    stop(405, 'Method not allowed.');
}

// Honeypot: a field hidden from people. Only robots fill it in.
if (!empty($_POST['website'])) {
    echo json_encode(['ok' => true]);   // pretend it worked, send nothing
    exit;
}

// Simple rate limit: one message per minute per visitor.
session_start();
if (isset($_SESSION['last_send']) && time() - $_SESSION['last_send'] < 60) {
    stop(429, 'Please wait a minute before sending another message.');
}

$name    = trim($_POST['name']    ?? '');
$email   = trim($_POST['email']   ?? '');
$service = trim($_POST['service'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $email === '') {
    stop(400, 'Please fill in your name and email address.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    stop(400, 'That email address does not look right.');
}
if (mb_strlen($name) > 100 || mb_strlen($service) > 100 || mb_strlen($message) > 5000) {
    stop(400, 'That message is too long.');
}

// Strip newlines so nobody can inject extra email headers.
$clean = function ($value) {
    return trim(str_replace(["\r", "\n", "%0a", "%0d"], ' ', $value));
};
$name    = $clean($name);
$email   = $clean($email);
$service = $clean($service);

$body = "New enquiry from the website\n\n"
      . "Name:    $name\n"
      . "Email:   $email\n"
      . "Service: $service\n"
      . "Sent:    " . date('d/m/Y H:i') . "\n\n"
      . "Message:\n" . $message . "\n";

$host    = $_SERVER['HTTP_HOST'] ?? 'localhost';
$headers = [
    'From: Website <no-reply@' . preg_replace('/[^a-z0-9.\-]/i', '', $host) . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=utf-8',
    'X-Mailer: PHP/' . phpversion(),
];

if (!mail($TO, $SUBJECT, $body, implode("\r\n", $headers))) {
    stop(500, 'The message could not be sent. Please call us instead.');
}

$_SESSION['last_send'] = time();
echo json_encode(['ok' => true]);
