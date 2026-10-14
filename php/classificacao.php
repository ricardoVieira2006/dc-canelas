<?php
/**
 * GET php/classificacao.php
 * Lê data/classificacao.json, calcula jogos, pontos e diferença de golos
 * e devolve as equipas já ordenadas (pontos > diferença > golos marcados).
 */
require __DIR__ . '/config.php';

$db = read_data('classificacao');
$r = $db['regras'] ?? ['vitoria' => 3, 'empate' => 1, 'derrota' => 0];

foreach ($db['equipas'] as &$t) {
    $t['j'] = $t['v'] + $t['e'] + $t['d'];
    $t['dif'] = $t['gm'] - $t['gs'];
    $t['pts'] = $t['v'] * $r['vitoria'] + $t['e'] * $r['empate'] + $t['d'] * ($r['derrota'] ?? 0);
}
unset($t);

usort($db['equipas'], fn($a, $b) => [$b['pts'], $b['dif'], $b['gm']] <=> [$a['pts'], $a['dif'], $a['gm']]);
foreach ($db['equipas'] as $i => &$t) {
    $t['pos'] = $i + 1;
}
unset($t);

respond($db);
