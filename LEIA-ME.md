# Desportivo de Canelas FC — site oficial

Site em **HTML5 + CSS3 + JavaScript (sem frameworks)**, com **PHP** apenas nos formulários e endpoints de dados e **JSON** como armazenamento (sem MySQL).

## Abrir o site no computador

O site lê os ficheiros JSON com `fetch`, por isso tem de ser aberto através de um servidor (abrir o `index.html` com duplo clique não funciona).

**Opção A — PHP instalado (recomendado, PHP 8.1 ou superior):**
```bash
cd dc-canelas
php -S localhost:8000 router.php
```
Abre http://localhost:8000

**Opção B — XAMPP / Laragon / MAMP:** copia a pasta para `htdocs` (ou `www`) e abre `http://localhost/dc-canelas/`.

**Opção C — sem PHP (ex.: extensão Live Server do VS Code):** o site funciona todo. Os formulários entram em *modo de demonstração* (guardam no navegador e avisam).

## Estrutura

```
index.html            Início
noticias.html         Lista de notícias com filtros e pesquisa
noticia.html          Notícia individual (noticia.html?id=...)
jogos.html            Calendário e resultados (filtros por vista, escalão e competição)
classificacao.html    Tabela completa (pontos e ordem calculados automaticamente)
plantel.html          Plantel por posição + ficha de cada jogador
clube.html            Identidade, valores, escalões e direção
bilhetes.html         Jogos em casa, preços e reserva de bilhetes
loja.html             Produtos, carrinho e encomenda
socios.html           Quotas, inscrição de sócio e Zona do sócio
contactos.html        Formulário, contactos e mapa

css/style.css         Todo o design. As cores, letras, raios e espaços estão nas variáveis :root no topo.
js/main.js            Partilhado: menu lateral, barra de topo, rodapé, pesquisa, carrinho, formulários.
                      O MENU edita-se uma só vez aqui (constante NAV).
js/<página>.js        Código de cada página.

data/*.json           Conteúdo público — é aqui que se atualiza o site no dia a dia.
php/*.php             Endpoints (ver abaixo).
storage/              Pedidos recebidos (dados pessoais). Protegido por .htaccess.
img/                  Imagens.
```

## Painel de administração

Abre **`/php/admin.php`** (ex.: http://localhost:8000/php/admin.php) e entra com a palavra-passe definida em `php/config.php` (`ADMIN_PASSWORD`). Enquanto a palavra-passe for a de origem, o painel não deixa entrar.

| Separador | O que faz |
|---|---|
| Painel | Resumo: resultados por lançar, encomendas, reservas, inscrições e mensagens novas, próximos jogos |
| Jogos | Lançar resultados (os jogos que já passaram aparecem no topo), marcar/editar/apagar jogos, pôr bilhetes à venda, gerir equipas adversárias (com emblema) e competições |
| Classificação | **Colar a tabela** copiada do zerozero ou da AF Porto (o painel lê as colunas, mostra uma pré-visualização e cria as equipas novas), ou editar os números à mão |
| Notícias | Escrever, editar e apagar notícias, com carregamento de foto |
| Plantel | Jogadores (foto, número, posição, estatísticas, destaque, capitão) e equipa técnica |
| Loja | Produtos, preços, promoções, tamanhos e fotos |
| Clube | Contactos, redes sociais, preços dos bilhetes, quotas de sócio, direção e escalões |
| Sócios | Lista de sócios e data até à qual têm as quotas pagas (é o que a Zona do sócio consulta) |
| Pedidos | Encomendas, reservas, inscrições e mensagens recebidas: ver, marcar como tratado, responder por email e criar o sócio a partir de uma inscrição |

Cada gravação guarda primeiro uma cópia do ficheiro anterior em `storage/backups/` (as 30 mais recentes de cada ficheiro). Para desfazer um erro, copia a cópia certa para `data/` (ou `storage/`) com o nome original.

As fotos carregadas vão para `img/noticias/`, `img/plantel/`, `img/loja/` e `img/equipas/` (JPG, PNG ou WEBP, até 5 MB).

**Como colar a classificação:** no zerozero (ou no site da AF Porto) seleciona a tabela com o rato, da primeira à última equipa, copia (Ctrl+C), cola no painel (Ctrl+V) e carrega em *Ler tabela*. Confirma a pré-visualização e carrega em *Aplicar e guardar*. As equipas são reconhecidas mesmo que o nome venha ligeiramente diferente (ex.: "Vandoma" = "AD Vandoma"); as que não existirem são criadas.

## Atualizar conteúdos à mão (alternativa ao painel)

| Quero… | Ficheiro |
|---|---|
| Lançar um resultado | `data/jogos.json` → preencher `golosCasa` e `golosFora` do jogo |
| Marcar um jogo novo | `data/jogos.json` → copiar um jogo e mudar `id`, `data`, `casa`, `fora`. `"bilhetes": true` põe-no à venda |
| Atualizar a classificação | `data/classificacao.json` → V, E, D, GM, GS de cada equipa (pontos e ordem são calculados) |
| Acrescentar uma equipa adversária | `data/equipas.json` |
| Publicar uma notícia | `data/noticias.json` → novo bloco; a imagem vai para `img/noticias/` |
| Alterar o plantel | `data/plantel.json` → `"destaque": true` mostra o jogador primeiro na página inicial |
| Produtos da loja | `data/produtos.json` |
| Preços de bilhetes, quotas, contactos, redes sociais, direção, escalões | `data/clube.json` |

Dica: no VS Code, um JSON com erro fica sublinhado a vermelho. Uma vírgula a mais no fim de uma lista é o erro mais comum.

## PHP

| Ficheiro | O que faz |
|---|---|
| `php/config.php` | Configuração: email de aviso (`NOTIFY_EMAIL`), palavra-passe de administração, limite anti-spam |
| `php/jogos.php` | GET jogos (filtros `?escalao=`, `?competicao=`, `?estado=proximos\|resultados`, `?limite=`) |
| `php/noticias.php` | GET notícias (`?categoria=`, `?id=`) |
| `php/classificacao.php` | GET classificação calculada e ordenada |
| `php/contactos.php` | POST mensagem → `storage/contactos.json` |
| `php/bilhetes.php` | POST reserva → `storage/bilhetes.json` (valida jogo, tipo e quantidade) |
| `php/encomendas.php` | POST encomenda → `storage/encomendas.json` (preços recalculados no servidor) |
| `php/socios.php` | `?acao=adesao` inscrição → `storage/adesoes.json`; `?acao=consulta` estado da quota (lê `storage/socios.json`) |
| `php/admin.php` | Painel de administração (ver secção acima) |
| `php/admin-api.php` | Leitura/gravação usada pelo painel (exige sessão de administrador e token CSRF) |

Todos os formulários têm validação no navegador **e** no servidor, campo-armadilha anti-bots e limite de envios por IP. Não há pagamentos online: bilhetes e loja são reservas pagas no local.

## Novidades em relação ao site base

- **Identidade amarelo e verde**: relvado com as linhas a amarelo no topo, faixas diagonais nas cores do clube, títulos com a faixa amarelo/verde e letra Barlow Condensed (estilo números de camisola).
- **Resumo da época no topo da página inicial**: lugar, pontos, golos e últimos jogos, calculados a partir da classificação.
- **Adicionar ao calendário**: no próximo jogo (página inicial) e na página Jogos (todos os jogos por disputar, respeitando os filtros). Gera um ficheiro .ics que abre no Google Calendar, iPhone ou Outlook.
- **Partilhar notícias** (no telemóvel abre a partilha nativa; no computador copia o link).
- **Barra de atalhos no fundo do ecrã no telemóvel**: Início, Jogos, Classificação, Loja e Menu.
- **Jogadores sem foto aparecem com a camisola amarela e o número** em vez de uma silhueta.
- **Revisão de acessibilidade (WCAG 2.1 AA)**: contraste verificado em todas as páginas, foco do teclado preso dentro das janelas abertas (pesquisa, ficha, carrinho, menu), alvos de toque com pelo menos 24 px, textos alternativos e rótulos em todos os campos.

## Antes de publicar

1. **Mudar `ADMIN_PASSWORD`** em `php/config.php` (a página de administração não abre enquanto a palavra-passe for a de origem).
2. Preencher email, telefone e morada reais em `data/clube.json`, e os links das redes sociais.
3. **Dados reais vs. exemplo.** São reais: a competição (1.ª Divisão AF Porto, Série 2, 2026/27), as 14 equipas da série, o 1.º jogo (Eja – Canelas a 20/09/2026), o telefone (917 364 597, da ficha do Google) e os links do Facebook e Instagram. São **de exemplo**: os resultados, a classificação, as datas dos jogos a partir da 2.ª jornada, os jogadores, as notícias (exceto o arranque da época), preços, quotas e nomes da direção. A forma mais rápida de pôr a classificação real é o painel: Classificação → colar a tabela do zerozero.
4. **Emblema e fotografias**: `img/emblema.png` é o emblema oficial (fundo transparente) e `img/emblema-badge.png` é a versão com disco branco usada sobre o verde (menu, topo, rodapé, jogos, ícone do separador em `img/favicon.png`). As fotografias do cabeçalho (`img/hero-canelas.jpg` e `img/plantel-equipa.jpg`) são de **Rita Silva** e do **Novum Canal**: mantive as marcas de água e o crédito no site. Confirma com os autores que autorizam o uso no site do clube. As capas das restantes notícias e os artigos da loja são ilustrações; troca-as por fotos reais no painel.
5. Confirmar o nome do campo e a morada em `data/clube.json` (estão como "Campo do Desportivo de Canelas" e "Canelas, Penafiel") e acrescentar um email, se o clube tiver. Sem email, a linha não aparece em Contactos.
6. Apagar o sócio de exemplo em `storage/socios.json` e colocar lá os sócios reais.
7. Dar permissão de escrita às pastas `storage/`, `data/` e `img/` no alojamento (normalmente 775): o painel grava nelas.
8. As letras vêm do Google Fonts (Barlow e Barlow Condensed). Se preferirem alojá-las no próprio site (melhor para RGPD), descarreguem os ficheiros e troquem o `<link>` no `<head>`.
