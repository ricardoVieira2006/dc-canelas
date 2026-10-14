<?php
// Só para testes locais: php -S localhost:8000 router.php
// Bloqueia /storage (como o .htaccess faz no Apache) e serve o resto normalmente.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (str_starts_with($path, '/storage')) {
    http_response_code(403);
    exit('Acesso negado.');
}
return false;
