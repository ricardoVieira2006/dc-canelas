/* Página Classificação: tabela completa calculada + resumo do clube */
document.addEventListener("DOMContentLoaded", async () => {
  const { $, getStandings, standingsTable, getMatches, resultRow, fmtShort, errorBox, CONFIG } = FCT;
  try {
    const data = await getStandings();
    $("#full-table").innerHTML = standingsTable(data);
    $("#table-updated").textContent = `Atualizada a ${fmtShort(data.atualizado)}`;
    const me = data.rows.find((r) => r.id === CONFIG.clubId);
    const attack = [...data.rows].sort((a, b) => b.gm - a.gm)[0];
    const defense = [...data.rows].sort((a, b) => a.gs - b.gs)[0];
    if (me) {
      $("#club-stats").innerHTML = `<div><b>${me.pos}.º</b><small>Posição</small></div><div><b>${me.pts}</b><small>Pontos</small></div><div><b>${me.dif > 0 ? "+" : ""}${me.dif}</b><small>Golos +/-</small></div>`;
      $("#club-dl").innerHTML = `<dt>Golos marcados</dt><dd>${me.gm} (${(me.gm / me.j).toFixed(1).replace(".", ",")} por jogo)</dd><dt>Melhor ataque</dt><dd>${attack.team.nome} · ${attack.gm}</dd><dt>Melhor defesa</dt><dd>${defense.team.nome} · ${defense.gs}</dd>`;
    }
  } catch { errorBox($("#full-table"), "a classificação"); }

  getMatches().then(({ list }) => {
    $("#last-results").innerHTML = list.filter((m) => m.escalao === "Seniores" && m.played).slice(-4).reverse().map(resultRow).join("");
  });
});
