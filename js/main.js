/* =========================================================================
   DESPORTIVO DE CANELAS FC — JavaScript principal (partilhado por todas as páginas)
   - Desenha a barra lateral, a barra superior e o rodapé (um só sítio para editar)
   - Carrega os dados (PHP se existir, senão os ficheiros JSON em /data)
   - Componentes reutilizáveis: jogo, classificação, resultados, notícias, plantel, loja
   - Pesquisa, carrinho, formulários, modais e mensagens
   ========================================================================= */

const FCT = (() => {
  "use strict";

  /* ---------- CONFIGURAÇÃO ---------- */
  const CONFIG = {
    clubId: "canelas",
    // "auto": tenta primeiro php/<nome>.php e, se não houver PHP, lê data/<nome>.json
    // true: usa sempre PHP · false: usa sempre JSON
    usePhp: "auto",
    cartKey: "fct-carrinho",
  };

  /* ---------- NAVEGAÇÃO (editar aqui para mudar o menu em todo o site) ---------- */
  const NAV = [
    { id: "inicio", label: "Início", href: "index.html", icon: "home" },
    { id: "noticias", label: "Notícias", href: "noticias.html", icon: "news" },
    { id: "jogos", label: "Jogos", href: "jogos.html", icon: "calendar" },
    { id: "classificacao", label: "Classificação", href: "classificacao.html", icon: "chart" },
    { id: "plantel", label: "Plantel", href: "plantel.html", icon: "users" },
    { id: "clube", label: "Clube", href: "clube.html", icon: "shield" },
    { id: "bilhetes", label: "Bilhetes", href: "bilhetes.html", icon: "ticket" },
    { id: "loja", label: "Loja", href: "loja.html", icon: "cart" },
    { id: "socios", label: "Sócios", href: "socios.html", icon: "user" },
    { id: "contactos", label: "Contactos", href: "contactos.html", icon: "help" },
  ];

  /* ---------- ÍCONES (SVG em linha) ---------- */
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    news: '<rect x="3" y="4" width="14" height="16" rx="2"/><path d="M17 8h3v10a2 2 0 0 1-2 2H7M7 8h6M7 12h6M7 16h4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>',
    chart: '<path d="M4 21V10M10 21V4M16 21v-8M22 21H2"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7M16 4a4 4 0 0 1 0 8M18 14c2.5.6 4 3 4 7"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-2a2 2 0 0 1 0-4 2 2 0 0 1 0-4V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M14 5v14" stroke-dasharray="2 2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    left: '<path d="m15 6-6 6 6 6"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    star: '<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9z"/>',
    heart: '<path d="M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11z"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 4.5h-5L8 10z"/><path d="M12 3v4M16 10l4.5-1.5M14.5 14.5 17 19M9.5 14.5 7 19M8 10 3.5 8.5"/>',
    facebook: '<path class="f" d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8.5c0-.3.2-.5.5-.5z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01"/>',
    youtube: '<path class="f" d="M22 8.2c-.2-1.6-1-2.7-2.6-2.9C17 5 12 5 12 5s-5 0-7.4.3C3 5.5 2.2 6.6 2 8.2 1.8 10 1.8 12 1.8 12s0 2 .2 3.8c.2 1.6 1 2.7 2.6 2.9C7 19 12 19 12 19s5 0 7.4-.3c1.6-.2 2.4-1.3 2.6-2.9.2-1.8.2-3.8.2-3.8s0-2-.2-3.8zM10 15V9l5.2 3z"/>',
    x: '<path d="M4 4l16 16M20 4 4 20" />',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  };
  const FILLED = new Set(["facebook", "youtube"]);
  function icon(name, cls = "") {
    const body = ICONS[name] || "";
    const fill = FILLED.has(name) ? " icon--fill" : "";
    return `<svg class="icon${fill} ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
  }

  /* ---------- UTILITÁRIOS ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const euro = (n) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n);
  const parseDate = (s) => new Date(s.length <= 10 ? s + "T00:00" : s);
  const fmt = (d, opts) => new Intl.DateTimeFormat("pt-PT", opts).format(typeof d === "string" ? parseDate(d) : d);
  const fmtTime = (d) => fmt(d, { hour: "2-digit", minute: "2-digit" });
  const fmtLong = (d) => fmt(d, { weekday: "long", day: "numeric", month: "long" });
  const fmtShort = (d) => fmt(d, { day: "numeric", month: "short", year: "numeric" });
  const monthAbbr = (d) => fmt(d, { month: "short" }).replace(".", "");
  const dayNum = (d) => String(parseDate(d).getDate()).padStart(2, "0");
  const qs = (k) => new URLSearchParams(location.search).get(k);

  function timeAgo(dateStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = parseDate(dateStr); d.setHours(0, 0, 0, 0);
    const diff = Math.round((today - d) / 86400000);
    if (diff <= 0) return "Hoje";
    if (diff === 1) return "Ontem";
    if (diff < 30) return `Há ${diff} dias`;
    return fmtShort(dateStr);
  }

  /* ---------- DADOS ---------- */
  const cache = {};
  let phpAvailable = CONFIG.usePhp === true ? true : CONFIG.usePhp === false ? false : null;

  async function fetchJson(url, options) {
    const res = await fetch(url, { cache: "no-cache", ...options });
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !type.includes("json")) throw new Error(`Resposta inválida de ${url}`);
    return res.json();
  }

  /** Lê um conjunto de dados: tenta php/<nome>.php e cai para data/<nome>.json */
  function load(name) {
    if (cache[name]) return cache[name];
    cache[name] = (async () => {
      if (phpAvailable !== false && ["jogos", "noticias", "classificacao"].includes(name)) {
        try {
          const data = await fetchJson(`php/${name}.php`);
          phpAvailable = true;
          return data;
        } catch (e) {
          if (phpAvailable === true) console.warn(e);
          phpAvailable = false;
        }
      }
      return fetchJson(`data/${name}.json`);
    })();
    return cache[name];
  }

  /** Junta jogos com as equipas e calcula estado/resultado do ponto de vista do clube */
  async function getMatches() {
    const [db, teams] = await Promise.all([load("jogos"), load("equipas")]);
    const list = db.jogos.map((j) => {
      const played = j.golosCasa !== null && j.golosCasa !== undefined;
      const home = j.casa === CONFIG.clubId;
      let outcome = null;
      if (played) {
        const our = home ? j.golosCasa : j.golosFora;
        const their = home ? j.golosFora : j.golosCasa;
        outcome = our > their ? "V" : our < their ? "D" : "E";
      }
      return {
        ...j,
        date: parseDate(j.data),
        played,
        home,
        outcome,
        homeTeam: { id: j.casa, ...(teams[j.casa] || { nome: j.casa, curto: j.casa, sigla: j.casa.slice(0, 3).toUpperCase() }) },
        awayTeam: { id: j.fora, ...(teams[j.fora] || { nome: j.fora, curto: j.fora, sigla: j.fora.slice(0, 3).toUpperCase() }) },
        competitionName: db.competicoes[j.competicao] || j.competicao,
        venue: j.local || (j.casa === CONFIG.clubId ? db.localCasa : "Campo do adversário"),
      };
    });
    list.sort((a, b) => a.date - b.date);
    return { epoca: db.epoca, competicoes: db.competicoes, list };
  }

  /** Classificação calculada a partir de V/E/D e golos (pontos, diferença, ordem) */
  async function getStandings() {
    const [db, teams] = await Promise.all([load("classificacao"), load("equipas")]);
    const r = db.regras || { vitoria: 3, empate: 1, derrota: 0 };
    const rows = db.equipas.map((t) => ({
      ...t,
      team: { id: t.id, ...(teams[t.id] || { nome: t.id, sigla: t.id.slice(0, 3).toUpperCase() }) },
      j: t.v + t.e + t.d,
      dif: t.gm - t.gs,
      pts: t.v * r.vitoria + t.e * r.empate + t.d * (r.derrota || 0),
    }));
    rows.sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gm - a.gm || a.team.nome.localeCompare(b.team.nome));
    rows.forEach((row, i) => (row.pos = i + 1));
    return { ...db, rows };
  }

  /* ---------- COMPONENTES ---------- */
  function crest(team, size = "") {
    if (team.emblema) return `<span class="${size ? "mini-crest" : "team__crest"}"><img src="${esc(team.emblema)}" alt=""></span>`;
    return size
      ? `<span class="mini-crest" aria-hidden="true">${esc(team.sigla)}</span>`
      : `<span class="team__crest team__crest--badge" aria-hidden="true">${esc(team.sigla)}</span>`;
  }

  function outcomeTag(o) {
    if (!o) return "";
    const map = { V: ["win", "Vitória"], D: ["loss", "Derrota"], E: ["draw", "Empate"] };
    return `<span class="tag tag--${map[o][0]}">${map[o][1]}</span>`;
  }

  function teamLabel(t) {
    return t.id === CONFIG.clubId ? "Canelas" : t.curto;
  }

  /** Cartão "Próximo jogo" com contagem decrescente */
  function nextMatchCard(m) {
    if (!m) return `<div class="empty">Ainda não há jogos marcados. Volta em breve.</div>`;
    return `
      <div class="match">
        <div class="team">${crest(m.homeTeam)}<span class="team__name">${esc(teamLabel(m.homeTeam))}</span></div>
        <div>
          <div class="match__date">${esc(fmtLong(m.date))}</div>
          <div class="match__time"><time datetime="${esc(m.data)}">${fmtTime(m.date)}</time></div>
          <span class="tag tag--blue">${m.home ? "Em casa" : "Fora"}</span>
          <div class="match__comp">${esc(m.competitionName)}${m.jornada ? ` · ${m.jornada}.ª jornada` : m.eliminatoria ? ` · ${esc(m.eliminatoria)}` : ""}</div>
          <div class="countdown" data-countdown="${m.date.toISOString()}" aria-label="Tempo até ao jogo"></div>
        </div>
        <div class="team">${crest(m.awayTeam)}<span class="team__name">${esc(teamLabel(m.awayTeam))}</span></div>
      </div>`;
  }

  function startCountdowns(root = document) {
    $$("[data-countdown]", root).forEach((el) => {
      const target = new Date(el.dataset.countdown).getTime();
      const tick = () => {
        let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
        const d = Math.floor(s / 86400); s %= 86400;
        const h = Math.floor(s / 3600); s %= 3600;
        const m = Math.floor(s / 60);
        el.innerHTML = [["dias", d], ["horas", h], ["min", m]]
          .map(([l, v]) => `<div><b>${String(v).padStart(2, "0")}</b><small>${l}</small></div>`).join("");
        return target > Date.now();
      };
      if (tick()) { const id = setInterval(() => tick() || clearInterval(id), 30000); }
    });
  }

  /** Linha de resultado (página inicial) */
  function resultRow(m) {
    const h = m.homeTeam, a = m.awayTeam;
    return `
      <li class="result">
        <div class="datebox"><b>${dayNum(m.data)}</b><small>${esc(monthAbbr(m.date))}</small></div>
        <span class="result__team result__team--home ${h.id === CONFIG.clubId ? "is-club" : ""}">${esc(teamLabel(h))}</span>
        <span class="score">${m.played ? `${m.golosCasa} - ${m.golosFora}` : fmtTime(m.date)}</span>
        <span class="result__team ${a.id === CONFIG.clubId ? "is-club" : ""}">${esc(teamLabel(a))}</span>
        <span class="result__tags"><span class="tag">${m.home ? "Em casa" : "Fora"}</span>${outcomeTag(m.outcome)}</span>
      </li>`;
  }

  /** Linha completa de jogo (página Jogos) */
  function fixtureRow(m) {
    const h = m.homeTeam, a = m.awayTeam;
    const tickets = m.bilhetes && !m.played ? `<a class="btn btn--primary btn--sm" href="bilhetes.html?jogo=${esc(m.id)}">${icon("ticket")}Bilhetes</a>` : "";
    return `
      <article class="fixture">
        <div class="datebox"><b>${dayNum(m.data)}</b><small>${esc(monthAbbr(m.date))}</small></div>
        <div class="fixture__match">
          <div class="fixture__team fixture__team--home ${h.id === CONFIG.clubId ? "is-club" : ""}"><span class="long">${esc(h.nome)}</span><span class="short">${esc(teamLabel(h))}</span>${crest(h, "mini")}</div>
          <span class="score ${m.played ? "" : "score--pending"}">${m.played ? `${m.golosCasa} - ${m.golosFora}` : fmtTime(m.date)}</span>
          <div class="fixture__team ${a.id === CONFIG.clubId ? "is-club" : ""}">${crest(a, "mini")}<span class="long">${esc(a.nome)}</span><span class="short">${esc(teamLabel(a))}</span></div>
        </div>
        <div class="fixture__meta">
          <span>${esc(m.competitionName)}${m.jornada ? ` · J${m.jornada}` : m.eliminatoria ? ` · ${esc(m.eliminatoria)}` : ""}</span>
          <div class="tags"><span class="tag">${esc(m.escalao)}</span><span class="tag">${m.home ? "Em casa" : "Fora"}</span>${outcomeTag(m.outcome)}</div>
          ${tickets}
        </div>
      </article>`;
  }

  /** Tabela de classificação. compact = versão da página inicial */
  function standingsTable(data, { compact = false, limit = null } = {}) {
    const rows = limit ? data.rows.slice(0, limit) : data.rows;
    const n = data.rows.length;
    const up = data.regras?.subida || 0, down = data.regras?.descida || 0;
    const head = compact
      ? `<tr><th>#</th><th class="l">Equipa</th><th>J</th><th>+/-</th><th>Pts</th></tr>`
      : `<tr><th>#</th><th class="l">Equipa</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GM</th><th>GS</th><th>+/-</th><th>Pts</th><th class="l">Forma</th></tr>`;
    const body = rows.map((r) => {
      const zone = !compact && r.pos <= up ? "zone zone--up" : !compact && r.pos > n - down ? "zone zone--down" : "";
      const name = `<span class="team-cell">${compact ? "" : crest(r.team, "mini")}${esc(r.team.nome)}</span>`;
      const dif = r.dif > 0 ? `+${r.dif}` : r.dif;
      return compact
        ? `<tr class="${r.id === CONFIG.clubId ? "is-club" : ""}"><td>${r.pos}</td><td class="l">${name}</td><td>${r.j}</td><td>${dif}</td><td class="pts">${r.pts}</td></tr>`
        : `<tr class="${r.id === CONFIG.clubId ? "is-club" : ""}"><td class="${zone}">${r.pos}</td><td class="l">${name}</td><td>${r.j}</td><td>${r.v}</td><td>${r.e}</td><td>${r.d}</td><td>${r.gm}</td><td>${r.gs}</td><td>${dif}</td><td class="pts">${r.pts}</td><td class="l"><span class="form-dots" aria-label="Últimos cinco jogos">${(r.forma || []).map((f) => `<i class="${f}" title="${{ V: "Vitória", E: "Empate", D: "Derrota" }[f]}">${f}</i>`).join("")}</span></td></tr>`;
    }).join("");
    return `<div class="table-wrap"><table class="league"><caption class="sr-only">${esc(data.competicao)} ${esc(data.epoca)}</caption><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
  }

  function newsCard(n) {
    return `
      <a class="news-card" href="noticia.html?id=${encodeURIComponent(n.id)}">
        <img src="${esc(n.imagem)}" alt="" loading="lazy">
        <div class="news-card__body">
          <div class="news-meta"><span class="cat">${esc(n.categoria)}</span><span class="sep"></span><time datetime="${esc(n.data)}">${esc(timeAgo(n.data))}</time></div>
          <h3>${esc(n.titulo)}</h3>
          ${n.resumo ? `<p>${esc(n.resumo)}</p>` : ""}
        </div>
        <span class="news-card__go" aria-hidden="true">${icon("arrow")}</span>
      </a>`;
  }

  function flag(code) {
    return `<span class="flag flag--${esc(code)}" title="${esc(code)}" aria-hidden="true"></span>`;
  }

  /** Camisola amarela com o número: usada quando o jogador ainda não tem foto */
  function shirtSvg(num) {
    return `<svg class="player__shirt" viewBox="0 0 200 200" aria-hidden="true"><path d="M62 28 L38 38 L10 72 L34 92 L50 76 L50 178 L150 178 L150 76 L166 92 L190 72 L162 38 L138 28 C130 42 70 42 62 28Z" fill="#ffd21f" stroke="#062014" stroke-width="3" stroke-linejoin="round"/><rect x="70" y="44" width="12" height="134" fill="#1f9d55"/><rect x="118" y="44" width="12" height="134" fill="#1f9d55"/><path d="M62 28 C70 42 130 42 138 28" fill="none" stroke="#062014" stroke-width="5"/><text x="100" y="138" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="64" fill="#062014">${esc(num)}</text></svg>`;
  }

  function playerCard(p) {
    return `
      <button class="player ${p.foto ? "" : "player--nophoto"}" type="button" data-player="${esc(p.id)}" aria-label="Ver ficha de ${esc(p.nome)}, número ${esc(p.numero)}">
        ${p.foto ? `<img src="${esc(p.foto)}" alt="" loading="lazy">` : shirtSvg(p.numero)}
        <span class="player__num">${p.numero}<span class="player__pos">${esc(p.posicao)}</span></span>
        <span class="player__info">
          <span class="player__name">${esc(p.nome)}${p.capitao ? " (C)" : ""}</span>
          <span class="player__role">${flag(p.nacionalidade)}${esc(p.funcao)}</span>
        </span>
      </button>`;
  }

  function productCard(p) {
    return `
      <article class="product">
        <div class="product__img">
          <img src="${esc(p.imagem)}" alt="${esc(p.nome)}" loading="lazy">
          ${p.etiqueta ? `<span class="tag tag--blue product__badge">${esc(p.etiqueta)}</span>` : ""}
        </div>
        <div class="product__body">
          <span class="product__cat">${esc(p.categoria)}</span>
          <h3 class="product__name">${esc(p.nome)}</h3>
          ${p.tamanhos ? `<label class="sr-only" for="size-${esc(p.id)}">Tamanho</label><select class="select" id="size-${esc(p.id)}" data-size-for="${esc(p.id)}">${p.tamanhos.map((t) => `<option>${esc(t)}</option>`).join("")}</select>` : ""}
          <div class="product__row">
            <span class="price">${euro(p.preco)}${p.precoAntigo ? `<s>${euro(p.precoAntigo)}</s>` : ""}</span>
            <button class="btn btn--soft btn--sm" type="button" data-add="${esc(p.id)}">${icon("cart")}Adicionar</button>
          </div>
        </div>
      </article>`;
  }

  /* ---------- CALENDÁRIO (.ics): adicionar jogos ao telemóvel ---------- */
  function icsDate(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  function icsEscape(s) { return String(s).replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n"); }
  function downloadIcs(matches, filename = "jogos-canelas.ics") {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Desportivo de Canelas FC//Jogos//PT", "CALSCALE:GREGORIAN"];
    matches.forEach((m) => {
      const end = new Date(m.date.getTime() + 2 * 3600e3);
      lines.push("BEGIN:VEVENT", `UID:${m.id}@desportivo-canelas`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(m.date)}`, `DTEND:${icsDate(end)}`,
        `SUMMARY:${icsEscape(`${m.homeTeam.curto} vs ${m.awayTeam.curto} (${m.escalao})`)}`, `LOCATION:${icsEscape(m.venue)}`, `DESCRIPTION:${icsEscape(m.competitionName)}`, "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(matches.length === 1 ? "Jogo pronto a adicionar ao calendário" : `${matches.length} jogos prontos a adicionar ao calendário`);
  }

  /* ---------- PARTILHAR ---------- */
  async function share(title, url = location.href) {
    if (navigator.share) { try { await navigator.share({ title, url }); return; } catch { return; } }
    try { await navigator.clipboard.writeText(url); toast("Link copiado"); } catch { prompt("Copia o link:", url); }
  }

  /* ---------- LAYOUT PARTILHADO ---------- */
  async function renderLayout() {
    const page = document.body.dataset.page;
    const club = await load("clube").catch(() => ({ redes: {} }));
    const redes = club.redes || {};
    const socialLinks = ["facebook", "instagram", "youtube", "x"]
      .filter((k) => redes[k])
      .map((k) => `<a href="${esc(redes[k] || "#")}" target="_blank" rel="noopener" aria-label="${k === "x" ? "X (Twitter)" : k[0].toUpperCase() + k.slice(1)}">${icon(k)}</a>`).join("");

    const sidebar = $("#sidebar");
    if (sidebar) {
      sidebar.className = "sidebar";
      sidebar.setAttribute("aria-label", "Menu principal");
      sidebar.innerHTML = `
        <a class="sidebar__brand" href="index.html">
          <img class="sidebar__crest" src="img/emblema-badge.png" alt="Emblema do Desportivo de Canelas FC" width="46" height="46">
          <span><span class="sidebar__name">Desportivo<br>de Canelas</span><span class="sidebar__place">Canelas · Penafiel</span></span>
        </a>
        <nav class="nav">
          ${NAV.map((n) => `${n.id === "bilhetes" ? '<span class="nav__sep" aria-hidden="true"></span>' : ""}<a class="nav__link" href="${n.href}" ${n.id === page ? 'aria-current="page"' : ""}>${icon(n.icon)}<span>${n.label}</span></a>`).join("")}
        </nav>
        <div class="sidebar__foot">
          <div class="socials">${socialLinks}</div>
          <div class="sidebar__venue">
            <img src="img/estadio.svg" alt="">
            <div><strong>${esc(club.estadio || "Campo do clube")}</strong><span>Canelas, Penafiel</span>
            <a href="${mapsLink(club)}" target="_blank" rel="noopener">Ver direções ${icon("arrow")}</a></div>
          </div>
        </div>`;
      const backdrop = document.createElement("div");
      backdrop.className = "nav-backdrop";
      document.body.appendChild(backdrop);
      backdrop.addEventListener("click", () => toggleNav(false));
    }

    const topbar = $("#topbar");
    if (topbar) {
      const solid = page !== "inicio";
      topbar.className = `topbar ${solid ? "topbar--solid" : ""}`;
      topbar.innerHTML = `
        <button class="icon-btn menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="sidebar">${icon("menu")}</button>
        <a class="topbar__brand" href="index.html">
          <img src="img/emblema-badge.png" alt="" width="44" height="44">
          <div><strong>Desportivo de Canelas FC</strong><span>Canelas · Penafiel · Futebol</span></div>
        </a>
        <button class="icon-btn" type="button" data-open-search aria-label="Pesquisar">${icon("search")}</button>
        <button class="icon-btn cart-btn" type="button" data-open-cart aria-label="Abrir carrinho">${icon("cart")}<span class="cart-btn__count" data-cart-count></span></button>
        <a class="btn btn--primary zone-btn" href="socios.html#zona">${icon("user")}<span>Zona do sócio</span></a>`;
      $(".menu-toggle", topbar).addEventListener("click", () => toggleNav());
    }

    const footer = $("#footer");
    if (footer) {
      footer.className = "footer";
      footer.innerHTML = `
        <div class="container footer__inner">
          <a class="footer__brand" href="index.html"><img src="img/emblema-badge.png" alt="" width="36" height="36"><div><strong>Desportivo de Canelas FC</strong><span>Clube de futebol · Canelas · Penafiel</span></div></a>
          <nav class="footer__nav" aria-label="Rodapé">${NAV.map((n) => `<a href="${n.href}">${n.label}</a>`).join("")}</nav>
          <p class="footer__copy">© ${new Date().getFullYear()} Desportivo de Canelas FC<br>Todos os direitos reservados.</p>
        </div>`;
    }

    // Barra inferior no telemóvel: as 4 páginas mais usadas + menu
    const TABS = ["inicio", "jogos", "classificacao", "loja"];
    document.body.insertAdjacentHTML("beforeend", `<nav class="tabbar" aria-label="Atalhos">${TABS.map((id) => NAV.find((n) => n.id === id)).map((n) => `<a href="${n.href}" ${n.id === page ? 'aria-current="page"' : ""}>${icon(n.icon)}<span>${n.label}</span></a>`).join("")}<button type="button" data-tab-menu aria-controls="sidebar" aria-expanded="false">${icon("menu")}<span>Menu</span></button></nav>`);
    $("[data-tab-menu]").addEventListener("click", () => toggleNav());

    hydrateIcons();
    injectOverlays();
    updateCartCount();
    document.addEventListener("keydown", (e) => {
      // Mantém o foco do teclado dentro da janela aberta (pesquisa, ficha, carrinho, menu no telemóvel)
      if (e.key === "Tab") {
        const box = $(".overlay.is-open .dialog") || $(".drawer.is-open") || (window.innerWidth <= 1024 && $(".sidebar.is-open"));
        if (box) {
          const f = $$('a[href], button:not([disabled]), input:not([type=hidden]):not(.hp), select, textarea, [tabindex]:not([tabindex="-1"])', box).filter((el) => el.offsetParent !== null);
          if (f.length) {
            const first = f[0], last = f[f.length - 1];
            if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
            else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        }
      }
      if (e.key === "Escape") { toggleNav(false); closeOverlays(); closeCart(); }
      if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    });
  }

  /** Atalhos no HTML: data-icon="nome" (ícone antes), data-icon-left (idem, em botões), data-arrow (seta depois) */
  function hydrateIcons(root = document) {
    $$("[data-icon]", root).forEach((el) => { el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)); el.removeAttribute("data-icon"); });
    $$("[data-icon-left]", root).forEach((el) => { el.insertAdjacentHTML("afterbegin", icon(el.dataset.iconLeft)); el.removeAttribute("data-icon-left"); });
    $$("[data-arrow]", root).forEach((el) => { el.insertAdjacentHTML("beforeend", icon("arrow")); el.removeAttribute("data-arrow"); });
  }

  function mapsLink(club) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(club?.mapsQuery || "Desportivo de Canelas Futebol Clube, Penafiel")}`;
  }

  function toggleNav(force) {
    const sb = $("#sidebar"), bd = $(".nav-backdrop"), btn = $(".menu-toggle");
    if (!sb) return;
    const open = force ?? !sb.classList.contains("is-open");
    sb.classList.toggle("is-open", open);
    bd?.classList.toggle("is-open", open);
    btn?.setAttribute("aria-expanded", String(open));
    $("[data-tab-menu]")?.setAttribute("aria-expanded", String(open));
    if (open) $(".nav__link", sb)?.focus();
  }

  /* ---------- OVERLAYS: pesquisa, ficha, carrinho, toast ---------- */
  function injectOverlays() {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="overlay" id="search-overlay" role="dialog" aria-modal="true" aria-label="Pesquisar no site">
        <div class="dialog">
          <div class="search-box">${icon("search")}<input type="search" id="search-input" placeholder="Pesquisar notícias, jogadores, jogos…" autocomplete="off"><button class="icon-btn" type="button" data-close aria-label="Fechar">${icon("close")}</button></div>
          <div class="search-results" id="search-results" aria-live="polite"><p class="search-empty">Escreve pelo menos duas letras.</p></div>
        </div>
      </div>
      <div class="overlay" id="modal-overlay" role="dialog" aria-modal="true"><div class="dialog dialog--wide" id="modal-body"></div></div>
      <div class="drawer-backdrop" id="cart-backdrop"></div>
      <aside class="drawer" id="cart" aria-label="Carrinho" aria-hidden="true">
        <div class="drawer__head"><h2>O teu carrinho</h2><button class="icon-btn" type="button" data-close-cart aria-label="Fechar carrinho">${icon("close")}</button></div>
        <div class="drawer__body" id="cart-body"></div>
        <div class="drawer__foot" id="cart-foot"></div>
      </aside>
      <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

    $$(".overlay").forEach((o) => o.addEventListener("click", (e) => { if (e.target === o || e.target.closest("[data-close]")) closeOverlays(); }));
    $("#search-input").addEventListener("input", debounce((e) => runSearch(e.target.value), 150));
    $("#cart-backdrop").addEventListener("click", closeCart);
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-search]")) openSearch();
      if (e.target.closest("[data-open-cart]")) openCart();
      if (e.target.closest("[data-close-cart]")) closeCart();
      const add = e.target.closest("[data-add]");
      if (add) addToCart(add.dataset.add);
      const pl = e.target.closest("[data-player]");
      if (pl) openPlayer(pl.dataset.player);
    });
  }

  let lastFocus = null;
  function openOverlay(id) { lastFocus = document.activeElement; $(id).classList.add("is-open"); document.body.style.overflow = "hidden"; }
  function closeOverlays() {
    $$(".overlay.is-open").forEach((o) => o.classList.remove("is-open"));
    if (!$("#cart")?.classList.contains("is-open")) document.body.style.overflow = "";
    lastFocus?.focus?.();
  }

  function openSearch() { openOverlay("#search-overlay"); setTimeout(() => $("#search-input").focus(), 30); }

  async function runSearch(q) {
    const out = $("#search-results");
    q = q.trim().toLowerCase();
    if (q.length < 2) { out.innerHTML = `<p class="search-empty">Escreve pelo menos duas letras.</p>`; return; }
    const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const nq = norm(q);
    const [news, squad, matches, products] = await Promise.all([load("noticias"), load("plantel"), getMatches(), load("produtos")]);
    const hits = [
      ...NAV.filter((n) => norm(n.label).includes(nq)).map((n) => ({ href: n.href, title: n.label, sub: "Página", tag: "Página" })),
      ...news.filter((n) => norm(n.titulo + " " + n.resumo).includes(nq)).map((n) => ({ href: `noticia.html?id=${n.id}`, title: n.titulo, sub: fmtShort(n.data), tag: "Notícia" })),
      ...squad.jogadores.filter((p) => norm(p.nome + " " + p.funcao).includes(nq)).map((p) => ({ href: `plantel.html#${p.id}`, title: `${p.numero} · ${p.nome}`, sub: p.funcao, tag: "Jogador" })),
      ...matches.list.filter((m) => norm(m.homeTeam.nome + " " + m.awayTeam.nome).includes(nq)).map((m) => ({ href: "jogos.html", title: `${m.homeTeam.curto} vs ${m.awayTeam.curto}`, sub: `${fmtShort(m.date)} · ${m.escalao}`, tag: "Jogo" })),
      ...products.filter((p) => norm(p.nome).includes(nq)).map((p) => ({ href: "loja.html", title: p.nome, sub: euro(p.preco), tag: "Loja" })),
    ].slice(0, 12);
    out.innerHTML = hits.length
      ? hits.map((h) => `<a href="${esc(h.href)}"><div><strong>${esc(h.title)}</strong><small>${esc(h.sub)}</small></div><span class="tag">${esc(h.tag)}</span></a>`).join("")
      : `<p class="search-empty">Sem resultados para “${esc(q)}”. Experimenta o nome de um jogador ou de uma equipa.</p>`;
  }

  async function openPlayer(id) {
    const squad = await load("plantel");
    const p = squad.jogadores.find((x) => x.id === id);
    if (!p) return;
    const age = p.nascimento ? Math.floor((Date.now() - parseDate(p.nascimento)) / 31557600000) : "—";
    $("#modal-overlay").setAttribute("aria-label", `Ficha de ${p.nome}`);
    $("#modal-body").innerHTML = `
      <div class="player-modal">
        <div class="player-modal__img">${p.foto ? `<img src="${esc(p.foto)}" alt="${esc(p.nome)}">` : shirtSvg(p.numero)}</div>
        <div class="player-modal__body">
          <button class="icon-btn dialog-close" type="button" data-close aria-label="Fechar">${icon("close")}</button>
          <div class="player-modal__num">${p.numero}</div>
          <h2>${esc(p.nome)}</h2>
          <p style="color:var(--text-muted);display:flex;gap:8px;align-items:center">${flag(p.nacionalidade)}${esc(p.funcao)}${p.capitao ? " · Capitão" : ""}</p>
          <div class="stats"><div><b>${p.jogos ?? 0}</b><small>Jogos</small></div><div><b>${p.golos ?? 0}</b><small>Golos</small></div><div><b>${p.assistencias ?? 0}</b><small>Assist.</small></div></div>
          <dl class="dl">
            <dt>Idade</dt><dd>${age === "—" ? "—" : age + " anos"}</dd>
            <dt>Altura</dt><dd>${p.altura ? (p.altura / 100).toFixed(2).replace(".", ",") + " m" : "—"}</dd>
            <dt>Pé preferido</dt><dd>${esc(p.pe || "—")}</dd>
            <dt>Posição</dt><dd>${esc(p.posicao)}</dd>
          </dl>
        </div>
      </div>`;
    openOverlay("#modal-overlay");
    $("#modal-body .dialog-close").focus();
  }

  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("is-show"), 2600);
  }

  function debounce(fn, ms) { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; }

  /* ---------- CARRINHO (guardado no navegador) ---------- */
  function readCart() { try { return JSON.parse(localStorage.getItem(CONFIG.cartKey)) || []; } catch { return []; } }
  function writeCart(c) { try { localStorage.setItem(CONFIG.cartKey, JSON.stringify(c)); } catch { /* sem armazenamento: carrinho só nesta visita */ } memCart = c; updateCartCount(); }
  let memCart = null;
  const cart = () => memCart ?? (memCart = readCart());

  async function addToCart(id) {
    const products = await load("produtos");
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const size = $(`[data-size-for="${CSS.escape(id)}"]`)?.value || null;
    const c = [...cart()];
    const line = c.find((l) => l.id === id && l.tamanho === size);
    if (line) line.qtd += 1; else c.push({ id, tamanho: size, qtd: 1 });
    writeCart(c);
    toast(`${p.nome}${size ? ` (${size})` : ""} adicionado ao carrinho`);
  }

  function updateCartCount() {
    const n = cart().reduce((s, l) => s + l.qtd, 0);
    $$("[data-cart-count]").forEach((el) => { el.textContent = n || ""; el.dataset.count = n; });
  }

  async function renderCart() {
    const products = await load("produtos");
    const lines = cart().map((l) => ({ ...l, p: products.find((x) => x.id === l.id) })).filter((l) => l.p);
    const body = $("#cart-body"), foot = $("#cart-foot");
    if (!lines.length) {
      body.innerHTML = `<div class="empty">O carrinho está vazio.<br><br><a class="btn btn--soft btn--sm" href="loja.html">Ver a loja</a></div>`;
      foot.innerHTML = "";
      return;
    }
    const total = lines.reduce((s, l) => s + l.p.preco * l.qtd, 0);
    body.innerHTML = lines.map((l, i) => `
      <div class="cart-line">
        <img src="${esc(l.p.imagem)}" alt="">
        <div><strong>${esc(l.p.nome)}</strong><small>${l.tamanho ? `Tamanho ${esc(l.tamanho)} · ` : ""}${euro(l.p.preco)}</small>
          <div class="qty"><button type="button" data-qty="${i}" data-d="-1" aria-label="Menos um">${icon("minus")}</button><span>${l.qtd}</span><button type="button" data-qty="${i}" data-d="1" aria-label="Mais um">${icon("plus")}</button></div>
        </div>
        <strong>${euro(l.p.preco * l.qtd)}</strong>
      </div>`).join("");
    foot.innerHTML = `
      <div class="cart-total"><span>Total</span><strong>${euro(total)}</strong></div>
      <a class="btn btn--primary btn--block" href="loja.html#encomenda">Finalizar encomenda</a>
      <p style="font-size:.78rem;color:var(--text-muted);margin:10px 0 0">Pagamento e levantamento no campo, em dia de jogo.</p>`;
    $$("[data-qty]", body).forEach((b) => b.addEventListener("click", () => {
      const c = [...cart()];
      const idx = +b.dataset.qty;
      c[idx].qtd += +b.dataset.d;
      if (c[idx].qtd <= 0) c.splice(idx, 1);
      writeCart(c);
      renderCart();
      document.dispatchEvent(new CustomEvent("cart:change"));
    }));
  }

  function openCart() {
    renderCart();
    lastFocus = document.activeElement;
    $("#cart").classList.add("is-open"); $("#cart").setAttribute("aria-hidden", "false");
    $("#cart-backdrop").classList.add("is-open");
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#cart [data-close-cart]").focus(), 30);
  }
  function closeCart() {
    const c = $("#cart");
    if (!c?.classList.contains("is-open")) return;
    c.classList.remove("is-open"); c.setAttribute("aria-hidden", "true");
    $("#cart-backdrop").classList.remove("is-open");
    document.body.style.overflow = "";
    lastFocus?.focus?.();
  }

  /* ---------- FORMULÁRIOS ---------- */
  /**
   * Liga um formulário a um ficheiro PHP.
   * Valida no navegador (required, type=email, pattern) e mostra erros por campo.
   * Se o PHP não estiver disponível (ex.: site aberto sem servidor), guarda no navegador
   * e avisa que está em modo de demonstração.
   */
  function bindForm(form, { endpoint, extra, onSuccess, onError, successMsg }) {
    const status = form.querySelector(".form-status");
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form-status";
      status.textContent = "";
      if (!validate(form)) return;
      const btn = form.querySelector("[type=submit]");
      btn.disabled = true;
      const data = Object.fromEntries(new FormData(form).entries());
      Object.assign(data, typeof extra === "function" ? extra() : extra || {});
      try {
        const http = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        // O PHP responde sempre em JSON (também nos erros). Sem JSON = não há PHP → modo demonstração.
        if (!(http.headers.get("content-type") || "").includes("json")) throw new Error("Sem PHP");
        const res = await http.json();
        if (!res.ok) throw Object.assign(new Error(res.erro || "Erro"), { server: true, fields: res.campos });
        status.textContent = successMsg ? successMsg(res) : res.mensagem;
        status.className = "form-status is-ok";
        form.reset();
        onSuccess?.(res);
      } catch (err) {
        if (err.server) {
          onError?.(err);
          status.textContent = err.message;
          status.className = "form-status is-error";
          Object.entries(err.fields || {}).forEach(([k, m]) => setFieldError(form.elements[k], m));
        } else {
          // Sem PHP: modo demonstração
          const key = "fct-demo-" + endpoint.replace(/\W/g, "");
          try { const arr = JSON.parse(localStorage.getItem(key) || "[]"); arr.push({ ...data, enviadoEm: new Date().toISOString() }); localStorage.setItem(key, JSON.stringify(arr)); } catch { /* ignorar */ }
          const ref = "DEMO-" + Math.random().toString(36).slice(2, 7).toUpperCase();
          const res = { ok: true, referencia: ref, demo: true };
          status.textContent = (successMsg ? successMsg(res) : "Pedido registado.") + " (Modo de demonstração: para guardar no servidor, abre o site num servidor com PHP.)";
          status.className = "form-status is-ok";
          form.reset();
          onSuccess?.(res);
        }
      } finally {
        btn.disabled = false;
        status.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
    form.addEventListener("input", (e) => { if (e.target.closest(".field.has-error")) setFieldError(e.target, ""); });
  }

  function setFieldError(input, msg) {
    if (!input || !input.closest) return;
    const field = input.closest(".field");
    if (!field) return;
    field.classList.toggle("has-error", !!msg);
    let el = field.querySelector(".field__error");
    if (!el) { el = document.createElement("span"); el.className = "field__error"; el.id = (input.id || input.name) + "-err"; field.appendChild(el); }
    el.textContent = msg;
    if (msg) input.setAttribute("aria-describedby", el.id); else input.removeAttribute("aria-describedby");
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function validate(form) {
    let first = null;
    $$("input, select, textarea", form).forEach((el) => {
      if (el.classList.contains("hp") || el.type === "hidden") return;
      let msg = "";
      if (el.type === "checkbox" && el.required && !el.checked) msg = "Confirma para continuar.";
      else if (el.required && !el.value.trim()) msg = "Preenche este campo.";
      else if (el.type === "email" && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value)) msg = "Escreve um email válido, por exemplo nome@email.pt.";
      else if (el.pattern && el.value && !new RegExp(`^(?:${el.pattern})$`).test(el.value)) msg = el.dataset.patternMsg || "Formato inválido.";
      else if (el.type === "number" && el.value && ((el.min && +el.value < +el.min) || (el.max && +el.value > +el.max))) msg = `Escolhe um valor entre ${el.min} e ${el.max}.`;
      if (el.type === "checkbox") { const f = el.closest(".field") || el.closest(".check"); if (f && msg) toast(msg); }
      setFieldError(el, msg);
      if (msg && !first) first = el;
    });
    first?.focus();
    return !first;
  }

  /* ---------- CARROSSEL ---------- */
  function carousel(root) {
    const track = $(".carousel__track", root), prev = $(".carousel__btn--prev", root), next = $(".carousel__btn--next", root);
    if (!track) return;
    const step = () => track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 12 : 200;
    const update = () => {
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    prev?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    next?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    track.addEventListener("scroll", debounce(update, 60));
    window.addEventListener("resize", debounce(update, 100));
    update();
  }

  function errorBox(el, what) {
    el.innerHTML = `<div class="empty">Não conseguimos carregar ${what} agora. Atualiza a página dentro de momentos.</div>`;
    console.warn("Dados não carregados: confirma que o site está a ser servido por um servidor (ver LEIA-ME.md).");
  }

  /* ---------- ARRANQUE ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderLayout().then(() => document.dispatchEvent(new CustomEvent("layout:ready")));
  });

  return {
    CONFIG, icon, $, $$, esc, euro, fmt, fmtTime, fmtLong, fmtShort, monthAbbr, dayNum, parseDate, qs, timeAgo,
    load, getMatches, getStandings,
    nextMatchCard, startCountdowns, resultRow, fixtureRow, standingsTable, newsCard, playerCard, productCard, crest, flag,
    carousel, bindForm, toast, hydrateIcons, downloadIcs, share, shirtSvg, openCart, closeCart, cart, writeCart, errorBox, mapsLink, debounce,
  };
})();
