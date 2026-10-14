<?php
/** POST php/contactos.php — guarda a mensagem em storage/contactos.json */
require __DIR__ . '/config.php';

$in = input();
guard($in, 'contactos');

$nome = clean($in['nome'] ?? '', 100);
$email = clean($in['email'] ?? '', 150);
$assunto = clean($in['assunto'] ?? 'geral', 30);
$mensagem = clean($in['mensagem'] ?? '', 3000);

$erros = [];
if ($nome === '') $erros['nome'] = 'Preenche o nome.';
if (!valid_email($email)) $erros['email'] = 'Escreve um email válido.';
if (mb_strlen($mensagem) < 10) $erros['mensagem'] = 'A mensagem precisa de pelo menos 10 caracteres.';
if (($in['consentimento'] ?? '') !== 'sim') $erros['consentimento'] = 'Confirma a autorização para continuar.';
if ($erros) fail('Corrige os campos assinalados.', 422, $erros);

$record = [
    'referencia' => reference('MSG'),
    'data' => date('c'),
    'nome' => $nome,
    'email' => $email,
    'assunto' => $assunto,
    'mensagem' => $mensagem,
];
append_storage('contactos', $record);
notify("Nova mensagem: $assunto", $record);

respond(['ok' => true, 'mensagem' => 'Mensagem enviada.', 'referencia' => $record['referencia']]);
