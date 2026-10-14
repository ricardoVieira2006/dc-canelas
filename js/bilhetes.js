/* Página Bilhetes: jogos em casa com venda, preços, formulário de reserva (php/bilhetes.php) */
document.addEventListener("DOMContentLoaded", async () => {
  const { $, esc, euro, getMatches, load, fixtureRow, fmtLong, fmtTime, bindForm, qs, errorBox } = FCT;
  let matches, club;
  try { [{ list: matches }, club] = await Promise.all([getMatches(), load("clube")]); }
  catch { errorBox($("#ticket-games"), "os jogos"); return; }

  const games = matches.filter((m) => m.bilhetes && !m.played && m.date > Date.now());
  $("#ticket-games").innerHTML = games.length ? games.map(fixtureRow).join("").replaceAll('href="bilhetes.html?jogo=', 'data-pick href="#reservar" data-jogo="') : `<div class="empty">Não há jogos com bilhetes à venda neste momento.</div>`;
  $("#ticket-prices").innerHTML = club.bilhetes.map((b) => `<div><b>${b.preco ? euro(b.preco) : "Grátis"}</b><small>${esc(b.nome)}</small></div>`).join("");

  const sel = $("#t-jogo");
  sel.innerHTML = games.map((m) => `<option value="${esc(m.id)}">Canelas vs ${esc(m.awayTeam.curto)} · ${esc(fmtLong(m.date))}, ${fmtTime(m.date)}</option>`).join("");
  if (qs("jogo")) sel.value = qs("jogo");
  $("#t-tipo").innerHTML = club.bilhetes.map((b) => `<option value="${esc(b.tipo)}">${esc(b.nome)} · ${b.preco ? euro(b.preco) : "grátis"}</option>`).join("");

  const updateTotal = () => {
    const t = club.bilhetes.find((b) => b.tipo === $("#t-tipo").value);
    const q = Math.max(0, Math.min(10, +$("#t-qtd").value || 0));
    $("#t-total").textContent = euro((t?.preco || 0) * q);
  };
  ["change", "input"].forEach((ev) => { $("#t-tipo").addEventListener(ev, updateTotal); $("#t-qtd").addEventListener(ev, updateTotal); });
  updateTotal();

  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-pick]");
    if (a) { sel.value = a.dataset.jogo; }
  });

  bindForm($("#ticket-form"), {
    endpoint: "php/bilhetes.php",
    successMsg: (r) => `Reserva feita. A tua referência é ${r.referencia}. Apresenta-a na bilheteira até 30 minutos antes do jogo.`,
    onSuccess: updateTotal,
  });
});
