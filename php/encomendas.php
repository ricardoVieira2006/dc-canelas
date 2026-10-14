<?php
/** POST php/encomendas.php — encomenda da loja (preços recalculados no servidor) */
require __DIR__ . '/config.php';

$in = input();
guard($in, 'encomendas');

$produtos = array_column(read_data('produtos'), null, 'id');
$nome = clean($in['nome'] ?? '', 100);
$email = clean($in['email'] ?? '', 150);
$tel = clean($in['telefone'] ?? '', 20);
$socio = clean($in['socio'] ?? '', 6);
$notas = clean($in['notas'] ?? '', 500);
$itens = is_array($in['itens'] ?? null) ? array_slice($in['itens'], 0, 30) : [];

$erros = [];
if ($nome === '') $erros['nome'] = 'Preenche o nome.';
if (!valid_email($email)) $erros['email'] = 'Escreve um email válido.';
if (!valid_phone($tel)) $erros['telefone'] = 'Escreve um telemóvel válido.';
if ($socio !== '' && !ctype_digit($socio)) $erros['socio'] = 'Escreve só o número de sócio.';
if ($erros) fail('Corrige os campos assinalados.', 422, $erros);

$linhas = [];
$total = 0.0;
foreach ($itens as $item) {
    $p = $produtos[$item['id'] ?? ''] ?? null;
    $q = (int) ($item['qtd'] ?? 0);
    if (!$p || $q < 1 || $q > 20) continue;
    $tam = clean($item['tamanho'] ?? '', 6);
    if (!empty($p['tamanhos']) && !in_array($tam, $p['tamanhos'], true)) continue;
    $linhas[] = ['produto' => $p['nome'], 'tamanho' => $tam ?: null, 'quantidade' => $q, 'preco' => $p['preco']];
    $total += $p['preco'] * $q;
}
if (!$linhas) fail('O carrinho está vazio ou tem artigos inválidos.', 422);

$record = [
    'referencia' => reference('ENC'),
    'data' => date('c'),
    'estado' => 'nova',
    'nome' => $nome,
    'email' => $email,
    'telefone' => $tel,
    'socio' => $socio,
    'notas' => $notas,
    'itens' => $linhas,
    'total' => round($total, 2),
];
append_storage('encomendas', $record);
notify('Nova encomenda da loja', $record);

respond(['ok' => true, 'mensagem' => 'Encomenda recebida.', 'referencia' => $record['referencia'], 'total' => $record['total']]);
