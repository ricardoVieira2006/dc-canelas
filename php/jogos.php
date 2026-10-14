<?php
/**
 * GET php/jogos.php
 * Filtros opcionais: ?escalao=Seniores  ?competicao=elite  ?estado=proximos|resultados  ?limite=5
 * Devolve a mesma estrutura de data/jogos.json (com a lista filtrada).
 */
require __DIR__ . '/config.php';

$db = read_data('jogos');
$jogos = $db['jogos'] ?? [];

$escalao = clean($_GET['escalao'] ?? '', 40);
$competicao = clean($_GET['competicao'] ?? '', 40);
$estado = clean($_GET['estado'] ?? '', 20);
$limite = max(0, (int) ($_GET['limite'] ?? 0));

$jogos = array_values(array_filter($jogos, function ($j) use ($escalao, $competicao, $estado) {
    $jogado = isset($j['golosCasa']) && $j['golosCasa'] !== null;
    if ($escalao !== '' && ($j['escalao'] ?? '') !== $escalao) return false;
    if ($competicao !== '' && ($j['competicao'] ?? '') !== $competicao) return false;
    if ($estado === 'proximos' && $jogado) return false;
    if ($estado === 'resultados' && !$jogado) return false;
    return true;
}));

usort($jogos, fn($a, $b) => strcmp($a['data'], $b['data']));
if ($estado === 'resultados') {
    $jogos = array_reverse($jogos);
}
if ($limite > 0) {
    $jogos = array_slice($jogos, 0, $limite);
}

$db['jogos'] = $jogos;
respond($db);
