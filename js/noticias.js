/* Página Notícias: filtro por categoria, pesquisa, destaque + lista */
document.addEventListener("DOMContentLoaded", async () => {
  const { $, $$, esc, load, newsCard, timeAgo, errorBox, icon, debounce } = FCT;
  let news;
  try { news = (await load("noticias")).slice().sort((a, b) => b.data.localeCompare(a.data)); }
  catch { errorBox($("#news-list"), "as notícias"); return; }

  const cats = ["Todas", ...new Set(news.map((n) => n.categoria))];
  let cat = new URLSearchParams(location.search).get("categoria") || "Todas";
  const filters = $("#news-filters");
  filters.innerHTML = cats.map((c) => `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${c === cat}">${esc(c)}</button>`).join("");

  const render = () => {
    const q = $("#news-search").value.trim().toLowerCase();
    const list = news.filter((n) => (cat === "Todas" || n.categoria === cat) && (!q || (n.titulo + " " + n.resumo).toLowerCase().includes(q)));
    const [first, ...rest] = list;
    $("#news-feature").innerHTML = first ? `
      <a class="news-feature" href="noticia.html?id=${encodeURIComponent(first.id)}">
        <img src="${esc(first.imagem)}" alt="">
        <div class="news-feature__body">
          <div class="news-meta"><span class="cat">${esc(first.categoria)}</span><span class="sep"></span><span>${esc(timeAgo(first.data))}</span></div>
          <h2>${esc(first.titulo)}</h2>
          <p>${esc(first.resumo)}</p>
          <span class="link-more">Ler notícia ${icon("arrow")}</span>
        </div>
      </a>` : "";
    $("#news-list").innerHTML = list.length ? rest.map(newsCard).join("") : `<div class="empty">Nenhuma notícia encontrada. Experimenta outra categoria ou palavra.</div>`;
  };
  filters.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]"); if (!b) return;
    cat = b.dataset.cat;
    $$("[data-cat]", filters).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    render();
  });
  $("#news-search").addEventListener("input", debounce(render, 150));
  render();
});
