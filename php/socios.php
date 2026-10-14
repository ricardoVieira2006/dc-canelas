<?php
/**
 * POST php/socios.php?acao=adesao   — guarda pedido de inscrição em storage/adesoes.json
 * POST php/socios.php?acao=consulta — consulta quota em storage/socios.json (n.º + email)
 */
require __DIR__ . '/config.php';

$acao = $_GET['acao'] ?? '';
$in = input();

if ($acao === 'adesao') {
    guard($in, 'adesao');
    $clube = read_data('clube');
    $quotas = array_column($clube['quotas'], null, 'id');

    $quota = clean($in['quota'] ?? '', 20);
    $nome = clean($in['nome'] ?? '', 120);
    $nasc = clean($in['nascimento'] ?? '', 10);
    $tel = clean($in['telefone'] ?? '', 20);
    $email = clean($in['email'] ?? '', 150);
    $morada = clean($in['morada'] ?? '', 250);

    $erros = [];
    if (!isset($quotas[$quota])) $erros['quota'] = 'Escolhe uma quota.';
    if ($nome === '') $erros['nome'] = 'Preenche o nome completo.';
    $d = DateTime::createFromFormat('Y-m-d', $nasc);
    if (!$d || $d > new DateTime()) $erros['nascimento'] = 'Escolhe uma data de nascimento válida.';
    if (!valid_phone($tel)) $erros['telefone'] = 'Escreve um telemóvel válido.';
    if (!valid_email($email)) $erros['email'] = 'Escreve um email válido.';
    if ($morada === '') $erros['morada'] = 'Preenche a morada.';
    if (($in['consentimento'] ?? '') !== 'sim') $erros['consentimento'] = 'Confirma a autorização para continuar.';
    if ($erros) fail('Corrige os campos assinalados.', 422, $erros);

    $record = [
        'referencia' => reference('SOC'),
        'data' => date('c'),
        'estado' => 'pendente',
        'quota' => $quotas[$quota]['nome'],
        'nome' => $nome,
        'nascimento' => $nasc,
        'telefone' => $tel,
        'email' => $email,
        'morada' => $morada,
    ];
    append_storage('adesoes', $record);
    notify('Nova inscrição de sócio', $record);
    respond(['ok' => true, 'mensagem' => 'Inscrição recebida.', 'referencia' => $record['referencia']]);
}

if ($acao === 'consulta') {
    guard($in, 'consulta');
    $numero = clean($in['numero'] ?? '', 6);
    $email = mb_strtolower(clean($in['email'] ?? '', 150));
    if (!ctype_digit($numero) || !valid_email($email)) {
        fail('Escreve o número de sócio e o email.', 422);
    }
    foreach (read_storage('socios') as $s) {
        if ((string) $s['numero'] === $numero && mb_strtolower($s['email']) === $email) {
            respond(['ok' => true, 'socio' => [
                'numero' => $s['numero'],
                'nome' => explode(' ', $s['nome'])[0],
                'quota' => $s['quota'],
                'quotaPagaAte' => $s['quotaPagaAte'],
            ]]);
        }
    }
    fail('Não encontrámos um sócio com estes dados. Confirma o número e o email, ou contacta a secretaria.', 404);
}

fail('Pedido inválido.', 400);
