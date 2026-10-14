<?php
/**
 * Desportivo de Canelas FC — configuração e funções partilhadas do PHP.
 * Sem base de dados: os dados públicos estão em /data (JSON) e os pedidos
 * recebidos (contactos, sócios, bilhetes, encomendas) ficam em /storage (JSON).
 */

declare(strict_types=1);

// ---- Configuração (editar) ----
const DATA_DIR    = __DIR__ . '/../data';
const STORAGE_DIR = __DIR__ . '/../storage';
const CLUB_ID     = 'canelas';
// Email que recebe aviso de cada novo pedido. Deixar vazio para não enviar.
const NOTIFY_EMAIL = '';
// Palavra-passe da página php/admin.php. MUDAR antes de publicar o site!
const ADMIN_PASSWORD = 'mudar-esta-palavra-passe';
// Limite de envios por IP (por formulário) numa janela de 10 minutos
const RATE_LIMIT = 5;

date_default_timezone_set('Europe/Lisbon');

/** Envia JSON e termina. */
function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400, array $fields = []): never
{
    respond(['ok' => false, 'erro' => $message, 'campos' => (object) $fields], $status);
}

/** Lê um ficheiro JSON de /data. */
function read_data(string $name): array
{
    $file = DATA_DIR . '/' . basename($name) . '.json';
    if (!is_file($file)) {
        fail('Dados não encontrados.', 404);
    }
    $data = json_decode((string) file_get_contents($file), true);
    if (!is_array($data)) {
        fail('O ficheiro ' . basename($file) . ' tem um erro de formatação.', 500);
    }
    return $data;
}

/** Lê um ficheiro JSON de /storage (devolve [] se não existir). */
function read_storage(string $name): array
{
    $file = STORAGE_DIR . '/' . basename($name) . '.json';
    if (!is_file($file)) {
        return [];
    }
    $data = json_decode((string) file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

/** Acrescenta um registo a /storage/<nome>.json com bloqueio de ficheiro. */
function append_storage(string $name, array $record): void
{
    if (!is_dir(STORAGE_DIR) && !mkdir(STORAGE_DIR, 0775, true)) {
        fail('Não foi possível guardar o pedido. Contacta o clube por email.', 500);
    }
    $file = STORAGE_DIR . '/' . basename($name) . '.json';
    $fp = fopen($file, 'c+');
    if (!$fp || !flock($fp, LOCK_EX)) {
        fail('Não foi possível guardar o pedido. Tenta de novo dentro de momentos.', 500);
    }
    $raw = stream_get_contents($fp);
    $list = json_decode($raw ?: '[]', true);
    if (!is_array($list)) {
        $list = [];
    }
    $list[] = $record;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

/** Lê o corpo do pedido (JSON ou formulário clássico). */
function input(): array
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        fail('Método não permitido.', 405);
    }
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($type, 'application/json')) {
        $raw = file_get_contents('php://input', false, null, 0, 65536);
        $data = json_decode((string) $raw, true);
        return is_array($data) ? $data : [];
    }
    return $_POST;
}

/** Limpa texto: remove controlos, corta espaços e limita o tamanho. */
function clean(mixed $value, int $max = 200): string
{
    $s = is_scalar($value) ? (string) $value : '';
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
    return mb_substr(trim($s), 0, $max);
}

function valid_email(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function valid_phone(string $phone): bool
{
    return (bool) preg_match('/^[+0-9 ]{9,16}$/', $phone);
}

/** Proteção básica contra spam: campo-armadilha + limite de envios por IP. */
function guard(array $in, string $bucket): void
{
    if (!empty($in['website'])) {
        // Bot preencheu o campo escondido: fingimos sucesso
        respond(['ok' => true, 'mensagem' => 'Recebido.', 'referencia' => 'OK']);
    }
    $ip = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '0') . $bucket);
    $file = STORAGE_DIR . '/.limites.json';
    $now = time();
    $limits = is_file($file) ? (json_decode((string) file_get_contents($file), true) ?: []) : [];
    $limits = array_filter($limits, fn($t) => is_array($t) && max($t) > $now - 600);
    $hits = array_values(array_filter($limits[$ip] ?? [], fn($t) => $t > $now - 600));
    if (count($hits) >= RATE_LIMIT) {
        fail('Demasiados envios seguidos. Espera alguns minutos e tenta de novo.', 429);
    }
    $hits[] = $now;
    $limits[$ip] = $hits;
    @file_put_contents($file, json_encode($limits), LOCK_EX);
}

function reference(string $prefix): string
{
    return $prefix . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
}

/** Avisa o clube por email (se NOTIFY_EMAIL estiver preenchido). */
function notify(string $subject, array $record): void
{
    if (NOTIFY_EMAIL === '') {
        return;
    }
    $body = '';
    foreach ($record as $k => $v) {
        $body .= ucfirst((string) $k) . ': ' . (is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : $v) . "\n";
    }
    @mail(NOTIFY_EMAIL, '=?UTF-8?B?' . base64_encode('[Site] ' . $subject) . '?=', $body, "Content-Type: text/plain; charset=UTF-8");
}
