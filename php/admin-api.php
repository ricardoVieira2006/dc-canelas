<?php
/**
 * php/admin-api.php — API usada pelo painel de administração (php/admin.php).
 * Só funciona com sessão de administrador iniciada e token CSRF válido.
 *
 *   GET  ?acao=ler&nome=jogos            → conteúdo de data/jogos.json (ou de storage/)
 *   POST ?acao=guardar   {nome, dados}    → grava o ficheiro (com cópia de segurança)
 *   POST ?acao=upload    ficheiro + pasta → guarda uma imagem em img/<pasta>/
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Strict',
    'cookie_secure' => !empty($_SERVER['HTTPS']),
]);

if (empty($_SESSION['admin'])) {
    fail('A sessão terminou. Entra de novo no painel.', 401);
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $token = $_SERVER['HTTP_X_CSRF'] ?? '';
    if (!is_string($token) || !hash_equals($_SESSION['csrf'] ?? '', $token)) {
        fail('O pedido expirou. Atualiza a página e tenta de novo.', 403);
    }
}

// Ficheiros que o painel pode ler e gravar (e mais nenhum)
const DATA_FILES = ['jogos', 'equipas', 'classificacao', 'noticias', 'plantel', 'produtos', 'clube'];
const STORAGE_FILES = ['encomendas', 'bilhetes', 'adesoes', 'contactos', 'socios'];
const IMAGE_FOLDERS = ['noticias', 'plantel', 'loja', 'equipas'];

function file_for(string $nome): string
{
    if (in_array($nome, DATA_FILES, true)) return DATA_DIR . "/$nome.json";
    if (in_array($nome, STORAGE_FILES, true)) return STORAGE_DIR . "/$nome.json";
    fail('Ficheiro desconhecido.', 400);
}

/** Verifica a forma básica de cada ficheiro antes de gravar, para não estragar o site. */
function check_shape(string $nome, mixed $dados): void
{
    $isList = is_array($dados) && array_is_list($dados);
    $ok = match ($nome) {
        'jogos' => is_array($dados) && isset($dados['jogos']) && is_array($dados['jogos']) && isset($dados['competicoes']),
        'classificacao' => is_array($dados) && isset($dados['equipas']) && is_array($dados['equipas']),
        'plantel' => is_array($dados) && isset($dados['jogadores']) && is_array($dados['jogadores']),
        'clube' => is_array($dados) && !array_is_list($dados),
        'equipas' => is_array($dados) && ($dados === [] || !array_is_list($dados)),
        default => $isList,
    };
    if (!$ok) fail('Os dados não têm o formato esperado. Nada foi gravado.', 422);
}

/** Cópia de segurança em storage/backups (guarda as 30 mais recentes de cada ficheiro). */
function backup(string $nome, string $file): void
{
    if (!is_file($file)) return;
    $dir = STORAGE_DIR . '/backups';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    @copy($file, "$dir/$nome-" . date('Ymd-His') . '.json');
    $all = glob("$dir/$nome-*.json") ?: [];
    sort($all);
    foreach (array_slice($all, 0, max(0, count($all) - 30)) as $old) @unlink($old);
}

function write_locked(string $file, mixed $dados): void
{
    $json = json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) fail('Não foi possível converter os dados.', 500);
    $fp = @fopen($file, 'c+');
    if (!$fp || !flock($fp, LOCK_EX)) {
        fail('Não foi possível gravar ' . basename($file) . '. Confirma que a pasta tem permissão de escrita.', 500);
    }
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, $json . "\n");
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

$acao = $_GET['acao'] ?? '';

if ($acao === 'ler') {
    $nome = (string) ($_GET['nome'] ?? '');
    $file = file_for($nome);
    if (!is_file($file)) respond(['ok' => true, 'dados' => in_array($nome, STORAGE_FILES, true) ? [] : null]);
    $dados = json_decode((string) file_get_contents($file), true);
    if ($dados === null && trim((string) file_get_contents($file)) !== 'null') {
        fail(basename($file) . ' tem um erro de formatação. Corrige-o à mão ou repõe uma cópia de storage/backups.', 500);
    }
    respond(['ok' => true, 'dados' => $dados]);
}

if ($acao === 'guardar') {
    $raw = file_get_contents('php://input', false, null, 0, 5 * 1024 * 1024);
    $in = json_decode((string) $raw, true);
    if (!is_array($in) || !isset($in['nome']) || !array_key_exists('dados', $in)) fail('Pedido inválido.', 400);
    $nome = (string) $in['nome'];
    $file = file_for($nome);
    check_shape($nome, $in['dados']);
    if (!is_dir(dirname($file))) @mkdir(dirname($file), 0775, true);
    backup($nome, $file);
    write_locked($file, $in['dados']);
    respond(['ok' => true, 'mensagem' => 'Guardado.']);
}

if ($acao === 'upload') {
    $pasta = (string) ($_POST['pasta'] ?? '');
    if (!in_array($pasta, IMAGE_FOLDERS, true)) fail('Pasta inválida.', 400);
    $f = $_FILES['ficheiro'] ?? null;
    if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK) fail('O envio da imagem falhou. Tenta uma imagem mais pequena (máx. 5 MB).', 400);
    if ($f['size'] > 5 * 1024 * 1024) fail('A imagem tem mais de 5 MB. Reduz o tamanho e tenta de novo.', 400);
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime] ?? null;
    if (!$ext || !@getimagesize($f['tmp_name'])) fail('Formato não suportado. Usa JPG, PNG ou WEBP.', 400);

    $base = strtolower(pathinfo((string) $f['name'], PATHINFO_FILENAME));
    $base = trim(preg_replace('/[^a-z0-9]+/', '-', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $base) ?: 'imagem') ?? '', '-') ?: 'imagem';
    $name = substr($base, 0, 40) . '-' . bin2hex(random_bytes(3)) . ".$ext";
    $dir = __DIR__ . "/../img/$pasta";
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    if (!move_uploaded_file($f['tmp_name'], "$dir/$name")) fail('Não foi possível guardar a imagem. Confirma as permissões da pasta img/.', 500);
    respond(['ok' => true, 'caminho' => "img/$pasta/$name"]);
}

fail('Ação desconhecida.', 400);
