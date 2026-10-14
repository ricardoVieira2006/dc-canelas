/* Página Clube: escalões e direção vêm de data/clube.json */
document.addEventListener("DOMContentLoaded", async () => {
  const { $, esc, load, mapsLink } = FCT;
  const club = await load("clube").catch(() => null);
  if (!club) return;
  $("#levels").innerHTML = club.escaloes.map((e) => `<div><b>${esc(e.nome)}</b><small>${esc(e.idades)}</small></div>`).join("");
  $("#board").innerHTML = club.direcao.map((d) => `<div><b>${esc(d.cargo)}</b><small>${esc(d.nome)}</small></div>`).join("");
  $("#directions-btn").href = mapsLink(club);
});
