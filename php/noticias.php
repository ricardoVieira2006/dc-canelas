<?php
/**
 * GET php/noticias.php           → lista (mais recentes primeiro)
 * GET php/noticias.php?categoria=Formação
 * GET php/noticias.php?id=<id>   → uma notícia
 */
require __DIR__ . '/config.php';

$news = read_data('noticias');
usort($news, fn($a, $b) => strcmp($b['data'], $a['data']));

if (isset($_GET['id'])) {
    $id = clean($_GET['id'], 120);
    foreach ($news as $n) {
        if ($n['id'] === $id) respond($n);
    }
    fail('Notícia não encontrada.', 404);
}

$cat = clean($_GET['categoria'] ?? '', 40);
if ($cat !== '') {
    $news = array_values(array_filter($news, fn($n) => $n['categoria'] === $cat));
}
respond($news);
