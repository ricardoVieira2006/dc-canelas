<?php
/**
 * php/admin.php — Painel de administração do site.
 * Entrada protegida pela palavra-passe ADMIN_PASSWORD (php/config.php).
 * O painel em si é desenhado por js/admin.js e grava através de php/admin-api.php.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Strict',
    'cookie_secure' => !empty($_SERVER['HTTPS']),
]);
header('X-Frame-Options: DENY');
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');

$h = fn($v) => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
$erro = '';
$defaultPw = ADMIN_PASSWORD === 'mudar-esta-palavra-passe';

if (isset($_GET['sair'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: admin.php');
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['password'])) {
    $tries = $_SESSION['tries'] ?? 0;
    if ($tries >= 5 && time() - ($_SESSION['last_try'] ?? 0) < 300) {
        $erro = 'Demasiadas tentativas. Espera 5 minutos.';
    } elseif (!$defaultPw && hash_equals(ADMIN_PASSWORD, (string) $_POST['password'])) {
        session_regenerate_id(true);
        $_SESSION = ['admin' => true, 'csrf' => bin2hex(random_bytes(32))];
        header('Location: admin.php');
        exit;
    } else {
        $_SESSION['tries'] = $tries + 1;
        $_SESSION['last_try'] = time();
        $erro = $defaultPw
            ? 'Define primeiro a tua palavra-passe em php/config.php (linha ADMIN_PASSWORD).'
            : 'Palavra-passe errada.';
        usleep(600000);
    }
}
$logged = !empty($_SESSION['admin']);
?>
<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Administração · Desportivo de Canelas FC</title>
  <link rel="icon" href="../img/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/admin.css">
  <?php if ($logged): ?><script src="../js/admin.js" defer></script><?php endif; ?>
</head>
<body class="admin" <?= $logged ? 'data-csrf="' . $h($_SESSION['csrf']) . '"' : '' ?>>
<?php if (!$logged): ?>
  <main class="admin-login">
    <div class="panel">
      <div style="text-align:center;margin-bottom:18px">
        <img src="../img/emblema-badge.png" alt="" width="64" height="64" style="margin:0 auto 10px">
        <h1 class="panel__title" style="justify-content:center;margin:0">Administração</h1>
        <p style="color:var(--text-muted);font-size:.85rem;margin:6px 0 0">Desportivo de Canelas FC</p>
      </div>
      <form class="form" method="post">
        <div class="field"><label for="pw">Palavra-passe</label><input class="input" id="pw" type="password" name="password" required autofocus autocomplete="current-password"></div>
        <?php if ($erro): ?><div class="form-status is-error"><?= $h($erro) ?></div><?php endif; ?>
        <?php if ($defaultPw && !$erro): ?><div class="form-status is-error" style="display:block">Antes de entrares, muda a palavra-passe em <strong>php/config.php</strong> (linha ADMIN_PASSWORD).</div><?php endif; ?>
        <button class="btn btn--primary" type="submit">Entrar</button>
        <a class="link-more" href="../index.html" style="justify-content:center">Voltar ao site</a>
      </form>
    </div>
  </main>
<?php else: ?>
  <div class="admin-shell">
    <aside class="admin-side">
      <a class="admin-brand" href="../index.html" target="_blank" rel="noopener"><img src="../img/emblema-badge.png" alt="" width="36" height="36"><span>Desportivo<br><small>Administração</small></span></a>
      <nav class="admin-nav" id="admin-nav" aria-label="Secções do painel"></nav>
      <div class="admin-side__foot">
        <a class="btn btn--ghost btn--sm btn--block" href="../index.html" target="_blank" rel="noopener">Ver o site</a>
        <a class="btn btn--soft btn--sm btn--block" href="?sair=1">Sair</a>
      </div>
    </aside>
    <main class="admin-main" id="admin-main" tabindex="-1">
      <div class="skeleton" style="min-height:300px"></div>
    </main>
  </div>
  <div class="overlay" id="a-modal" role="dialog" aria-modal="true"><div class="dialog dialog--wide" id="a-modal-body"></div></div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
<?php endif; ?>
</body>
</html>
