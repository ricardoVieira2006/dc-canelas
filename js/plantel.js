/* Página Plantel: grupos por posição, filtros, ficha do jogador (também via #id no endereço) */
document.addEventListener("DOMContentLoaded", async () => {
  const { $, $$, esc, load, playerCard, errorBox } = FCT;
  let squad;
  try { squad = await load("plantel"); } catch { errorBox($("#squad"), "o plantel"); return; }
  const groups = ["Guarda-redes", "Defesas", "Médios", "Avançados"];
  let active = "Todos";
  $("#squad-filters").innerHTML = ["Todos", ...groups].map((g) => `<button class="chip" type="button" data-group="${g}" aria-pressed="${g === active}">${g}</button>`).join("");

  const render = () => {
    $("#squad").innerHTML = groups.filter((g) => active === "Todos" || g === active).map((g) => {
      const ps = squad.jogadores.filter((p) => p.grupo === g).sort((a, b) => a.numero - b.numero);
      return `<section class="squad-group"><h2>${g} <small>${ps.length} jogadores</small></h2><div class="squad-grid">${ps.map(playerCard).join("")}</div></section>`;
    }).join("");
  };
  $("#squad-filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-group]"); if (!b) return;
    active = b.dataset.group;
    $$("[data-group]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    render();
  });
  render();
  $("#staff").innerHTML = (squad.equipaTecnica || []).map((s) => `<div><b>${esc(s.funcao)}</b><small>${esc(s.nome)}</small></div>`).join("");

  const openFromHash = () => { const id = location.hash.slice(1); if (id) $(`[data-player="${CSS.escape(id)}"]`)?.click(); };
  document.addEventListener("layout:ready", openFromHash);
  window.addEventListener("hashchange", openFromHash);
});
