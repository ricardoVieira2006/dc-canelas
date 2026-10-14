/* Página inicial: próximo jogo, classificação, resultados, notícias, plantel, bilhetes, loja */
document.addEventListener("DOMContentLoaded", async () => {
  const { $, esc, icon, getMatches, getStandings, load, nextMatchCard, startCountdowns, resultRow, standingsTable,
          newsCard, playerCard, productCard, carousel, fmtLong, fmtTime, euro, errorBox, mapsLink, CONFIG } = FCT;
  const now = Date.now();

  // Jogos (só seniores na página inicial)
  getMatches().then(({ list }) => {
    const seniors = list.filter((m) => m.escalao === "Seniores");
    const next = seniors.find((m) => !m.played && m.date.getTime() > now - 2 * 3600e3);
    $("#next-match").innerHTML = nextMatchCard(next);
    $("#next-venue").innerHTML = next ? `${icon("pin")}${esc(next.venue)}` : "";
    startCountdowns($("#next-match"));
    if (next) {
      $("#next-match").insertAdjacentHTML("beforeend", `<button class="btn btn--soft btn--sm btn--block" type="button" id="ics-next" style="margin-top:10px">${icon("calendar")}Adicionar ao calendário</button>`);
      $("#ics-next").addEventListener("click", () => FCT.downloadIcs([next], "proximo-jogo-canelas.ics"));
    }

    const last = seniors.filter((m) => m.played).slice(-3).reverse();
    $("#last-results").innerHTML = last.length ? last.map(resultRow).join("") : `<li class="empty">Ainda sem resultados nesta época.</li>`;

    // Bilhetes: próximo jogo em casa com venda
    const ticketMatch = list.find((m) => m.bilhetes && !m.played && m.date.getTime() > now);
    load("clube").then((club) => {
      if (!ticketMatch) { $("#home-tickets").innerHTML = `<div class="empty">Não há bilhetes à venda neste momento.</div>`; return; }
      $("#home-tickets").innerHTML = `
        <div class="ticket-match">
          ${FCT.crest(ticketMatch.awayTeam)}
          <div><div class="ticket-match__vs">Canelas vs ${esc(ticketMatch.awayTeam.curto)}</div>
          <small>${esc(fmtLong(ticketMatch.date))} · ${fmtTime(ticketMatch.date)} · ${esc(ticketMatch.competitionName)}</small></div>
        </div>
        <div class="prices">${club.bilhetes.map((b) => `<div><b>${b.preco ? euro(b.preco) : "Grátis"}</b><small>${esc(b.nome)}</small></div>`).join("")}</div>
        <p class="ticket-note">Sócios com quotas em dia entram grátis. Reserva online e paga na bilheteira.</p>
        <a class="btn btn--primary btn--block" href="bilhetes.html?jogo=${esc(ticketMatch.id)}">${icon("ticket")}Reservar bilhetes</a>`;
    });
  }).catch(() => { errorBox($("#next-match"), "os jogos"); $("#last-results").innerHTML = ""; });

  getStandings()
    .then((data) => {
      $("#mini-table").innerHTML = standingsTable(data, { compact: true, limit: 5 });
      // Resumo da época no hero: posição, pontos e últimos jogos
      const me = data.rows.find((r) => r.id === CONFIG.clubId);
      if (me) {
        const forma = (me.forma || []).slice(0, 5).map((f) => `<i class="${f}" title="${{ V: "Vitória", E: "Empate", D: "Derrota" }[f]}">${f}</i>`).join("");
        $("#hero-form").innerHTML = `<div><dt>lugar</dt><dd>${me.pos}.º</dd></div><div><dt>pontos</dt><dd>${me.pts}</dd></div><div><dt>golos</dt><dd>${me.gm}</dd></div>${forma ? `<div><dt class="sr-only">Últimos jogos</dt><dd><span class="form-dots" aria-label="Últimos jogos, do mais recente: ${(me.forma || []).join(", ")}">${forma}</span></dd></div>` : ""}`;
      }
    })
    .catch(() => errorBox($("#mini-table"), "a classificação"));

  load("noticias")
    .then((news) => {
      const items = [...news].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3);
      $("#home-news").innerHTML = items.map((n) => newsCard({ ...n, resumo: "" })).join("");
    })
    .catch(() => errorBox($("#home-news"), "as notícias"));

  load("plantel")
    .then((squad) => {
      const featured = squad.jogadores.filter((p) => p.destaque);
      const rest = squad.jogadores.filter((p) => !p.destaque).sort((a, b) => a.numero - b.numero);
      $("#squad-track").innerHTML = [...featured, ...rest].map(playerCard).join("");
      carousel($("#squad-carousel"));
    })
    .catch(() => errorBox($("#squad-track"), "o plantel"));

  load("produtos")
    .then((products) => { $("#home-shop").innerHTML = products.filter((p) => p.destaque).slice(0, 3).map(productCard).join(""); })
    .catch(() => errorBox($("#home-shop"), "a loja"));

  load("clube").then((club) => {
    const r = club.redes || {};
    const names = { facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", x: "X (Twitter)" };
    $("#social-tiles").innerHTML = Object.keys(names)
      .filter((k) => r[k])
      .map((k) => `<a class="st-${k}" href="${esc(r[k] || "#")}" target="_blank" rel="noopener" aria-label="${names[k]}">${icon(k)}</a>`).join("");
    $("#directions-btn").href = mapsLink(club);
  });
});
