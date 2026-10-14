/* Página de uma notícia (noticia.html?id=...) */
document.addEventListener("DOMContentLoaded", async () => {
  const { $, esc, load, qs, fmtShort, getMatches, nextMatchCard, startCountdowns } = FCT;
  const id = qs("id");
  let news;
  try { news = (await load("noticias")).slice().sort((a, b) => b.data.localeCompare(a.data)); }
  catch { FCT.errorBox($("#article"), "a notícia"); return; }
  const n = news.find((x) => x.id === id) || news[0];

  document.title = `${n.titulo} · Desportivo de Canelas FC`;
  $("#article-title").textContent = n.titulo;
  $("#share-btn").addEventListener("click", () => FCT.share(n.titulo, location.origin + location.pathname + "?id=" + encodeURIComponent(n.id)));
  $("#article-meta").innerHTML = `<span class="cat">${esc(n.categoria)}</span><span class="sep"></span><time datetime="${esc(n.data)}">${esc(fmtShort(n.data))}</time>`;
  $("#article").innerHTML = `
    <img class="article__img" src="${esc(n.imagem)}" alt="">
    <div class="article__body">
      <p><strong>${esc(n.resumo)}</strong></p>
      ${(n.corpo || []).map((p) => `<p>${esc(p)}</p>`).join("")}
    </div>
    <p style="margin-top:28px"><a class="link-more" href="noticias.html">${FCT.icon("left")} Voltar às notícias</a></p>`;

  $("#more-news").innerHTML = news.filter((x) => x.id !== n.id).slice(0, 4).map((x) => `
    <li><a href="noticia.html?id=${encodeURIComponent(x.id)}" style="display:grid;grid-template-columns:84px 1fr;gap:12px;align-items:center">
      <img src="${esc(x.imagem)}" alt="" style="width:84px;height:60px;object-fit:cover;border-radius:6px">
      <span><small style="color:var(--blue-300);font-size:.7rem;text-transform:uppercase;letter-spacing:.06em">${esc(x.categoria)}</small><br><strong style="font-size:.9rem;line-height:1.3">${esc(x.titulo)}</strong></span>
    </a></li>`).join("");

  getMatches().then(({ list }) => {
    const next = list.find((m) => m.escalao === "Seniores" && !m.played && m.date > Date.now());
    $("#next-match").innerHTML = nextMatchCard(next);
    startCountdowns($("#next-match"));
  });
});
