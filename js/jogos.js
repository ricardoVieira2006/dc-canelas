/* Página Jogos: filtros (vista, escalão, competição), agrupamento por mês, resumo da época */
document.addEventListener("DOMContentLoaded", async () => {
  const { $, $$, esc, getMatches, fixtureRow, nextMatchCard, startCountdowns, fmt, errorBox, qs } = FCT;
  let data;
  try { data = await getMatches(); } catch { errorBox($("#fixtures"), "os jogos"); return; }
  const { list, competicoes } = data;

  const escaloes = [...new Set(list.map((m) => m.escalao))];
  $("#f-escalao").insertAdjacentHTML("beforeend", escaloes.map((e) => `<option>${esc(e)}</option>`).join(""));
  $("#f-comp").insertAdjacentHTML("beforeend", Object.entries(competicoes).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join(""));

  let view = qs("ver") || "todos";
  const setView = (v) => { view = v; $$("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v))); render(); };

  function render() {
    const esc_ = $("#f-escalao").value, comp = $("#f-comp").value;
    let items = list.filter((m) => (!esc_ || m.escalao === esc_) && (!comp || m.competicao === comp));
    if (view === "proximos") items = items.filter((m) => !m.played);
    if (view === "resultados") items = items.filter((m) => m.played).reverse();
    if (!items.length) { $("#fixtures").innerHTML = `<div class="empty">Não há jogos com estes filtros.</div>`; return; }
    let html = "", month = "";
    items.forEach((m) => {
      const label = fmt(m.date, { month: "long", year: "numeric" });
      if (label !== month) { month = label; html += `<h2 class="month-label">${esc(label)}</h2>`; }
      html += fixtureRow(m);
    });
    $("#fixtures").innerHTML = html;
  }

  $$("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  // Exporta para o calendário os próximos jogos que estão visíveis com os filtros atuais
  $("#ics-all").addEventListener("click", () => {
    const esc_ = $("#f-escalao").value, comp = $("#f-comp").value;
    const items = list.filter((m) => !m.played && (!esc_ || m.escalao === esc_) && (!comp || m.competicao === comp));
    if (!items.length) { FCT.toast("Não há jogos por disputar com estes filtros."); return; }
    FCT.downloadIcs(items);
  });
  $("#f-escalao").addEventListener("change", render);
  $("#f-comp").addEventListener("change", render);
  setView(view);

  const seniors = list.filter((m) => m.escalao === "Seniores");
  const next = seniors.find((m) => !m.played && m.date > Date.now());
  $("#next-match").innerHTML = nextMatchCard(next);
  startCountdowns($("#next-match"));
  const played = seniors.filter((m) => m.played);
  const count = (o) => played.filter((m) => m.outcome === o).length;
  $("#season-stats").innerHTML = `<div><b style="color:var(--win)">${count("V")}</b><small>Vitórias</small></div><div><b style="color:var(--draw)">${count("E")}</b><small>Empates</small></div><div><b style="color:var(--loss)">${count("D")}</b><small>Derrotas</small></div>`;
});
