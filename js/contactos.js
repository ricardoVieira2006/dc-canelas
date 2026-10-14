/* Página Contactos: dados de data/clube.json, mapa e formulário (php/contactos.php) */
document.addEventListener("DOMContentLoaded", async () => {
  const { $, esc, load, icon, bindForm, qs, mapsLink } = FCT;
  const club = await load("clube").catch(() => null);
  if (club) {
    $("#contact-list").innerHTML = `
      <li>${icon("pin")}<div><strong>${esc(club.estadio)}</strong><small>${esc(club.morada)}</small><a class="link-more" style="margin-top:6px" href="${mapsLink(club)}" target="_blank" rel="noopener">Ver direções ${icon("arrow")}</a></div></li>
      ${club.email ? `<li>${icon("mail")}<div><a href="mailto:${esc(club.email)}"><strong>${esc(club.email)}</strong></a><small>Escreve-nos a qualquer hora</small></div></li>` : ""}
      ${club.telefone ? `<li>${icon("phone")}<div><a href="tel:+351${esc(club.telefone.replace(/\s/g, ""))}"><strong>${esc(club.telefone)}</strong></a><small>Chamada para a rede móvel nacional</small></div></li>` : ""}
      ${["facebook", "instagram"].filter((k) => club.redes?.[k]).map((k) => `<li>${icon(k)}<div><a href="${esc(club.redes[k])}" target="_blank" rel="noopener"><strong>${k === "facebook" ? "Facebook" : "Instagram"}</strong></a><small>${k === "facebook" ? "Desportivo de Canelas Futebol Clube" : "@d.canelasfc"}</small></div></li>`).join("")}
      <li>${icon("clock")}<div><strong>Horário</strong><small>${esc(club.horario)}</small></div></li>`;
    $("#map").src = `https://www.google.com/maps?q=${encodeURIComponent(club.mapsQuery)}&output=embed`;
  }
  if (qs("assunto")) $("#c-assunto").value = qs("assunto");
  bindForm($("#contact-form"), {
    endpoint: "php/contactos.php",
    successMsg: () => "Mensagem enviada. Vamos responder para o teu email assim que possível.",
  });
});
