<?php
/** POST php/bilhetes.php — reserva de bilhetes, guardada em storage/bilhetes.json */
require __DIR__ . '/config.php';

$in = input();
guard($in, 'bilhetes');

$jogos = array_column(read_data('jogos')['jogos'], null, 'id');
$equipas = read_data('equipas');
$tipos = array_column(read_data('clube')['bilhetes'], null, 'tipo');

$jogoId = clean($in['jogo'] ?? '', 20);
$tipo = clean($in['tipo'] ?? '', 20);
$qtd = (int) ($in['quantidade'] ?? 0);
$nome = clean($in['nome'] ?? '', 100);
$email = clean($in['email'] ?? '', 150);
$tel = clean($in['telefone'] ?? '', 20);

$erros = [];
$jogo = $jogos[$jogoId] ?? null;
if (!$jogo || empty($jogo['bilhetes']) || $jogo['golosCasa'] !== null || strtotime($jogo['data']) < time()) {
    $erros['jogo'] = 'Este jogo não tem bilhetes à venda.';
}
if (!isset($tipos[$tipo])) $erros['tipo'] = 'Escolhe o tipo de bilhete.';
if ($qtd < 1 || $qtd > 10) $erros['quantidade'] = 'Podes reservar entre 1 e 10 bilhetes.';
if ($nome === '') $erros['nome'] = 'Preenche o nome.';
if (!valid_email($email)) $erros['email'] = 'Escreve um email válido.';
if ($tel !== '' && !valid_phone($tel)) $erros['telefone'] = 'Escreve um telemóvel válido.';
if ($erros) fail('Corrige os campos assinalados.', 422, $erros);

$record = [
    'referencia' => reference('BIL'),
    'data' => date('c'),
    'jogo' => $jogoId,
    'descricao' => ($equipas[$jogo['casa']]['curto'] ?? $jogo['casa']) . ' vs ' . ($equipas[$jogo['fora']]['curto'] ?? $jogo['fora']) . ' · ' . $jogo['data'],
    'tipo' => $tipos[$tipo]['nome'],
    'quantidade' => $qtd,
    'total' => round($tipos[$tipo]['preco'] * $qtd, 2),
    'nome' => $nome,
    'email' => $email,
    'telefone' => $tel,
];
append_storage('bilhetes', $record);
notify('Nova reserva de bilhetes', $record);

respond(['ok' => true, 'mensagem' => 'Reserva feita.', 'referencia' => $record['referencia'], 'total' => $record['total']]);
