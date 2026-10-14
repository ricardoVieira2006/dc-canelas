/* Página Loja: filtros, ordenação, carrinho e encomenda (php/encomendas.php) */
document.addEventListener("DOMContentLoaded", async () => {
  const { $, $$, esc, euro, load, productCard, bindForm, cart, writeCart, errorBox } = FCT;
  let products;
  try { products = await load("produtos"); } catch { errorBox($("#products"), "a loja"); return; }

  const cats = ["Tudo", ...new Set(products.map((p) => p.categoria))];
  let cat = "Tudo";
  $("#shop-filters").innerHTML = cats.map((c) => `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${c === cat}">${esc(c)}</button>`).join("");

  const render = () => {
    const sort = $("#shop-sort").value;
    let list = products.filter((p) => cat === "Tudo" || p.categoria === cat);
    list = [...list].sort({
      "preco-asc": (a, b) => a.preco - b.preco,
      "preco-desc": (a, b) => b.preco - a.preco,
      nome: (a, b) => a.nome.localeCompare(b.nome),
      destaque: (a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0),
    }[sort]);
    $("#products").innerHTML = list.map(productCard).join("");
  };
  $("#shop-filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]"); if (!b) return;
    cat = b.dataset.cat;
    $$("[data-cat]", $("#shop-filters")).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    render();
  });
  $("#shop-sort").addEventListener("change", render);
  render();

  const lines = () => cart().map((l) => ({ ...l, p: products.find((x) => x.id === l.id) })).filter((l) => l.p);
  const renderSummary = () => {
    const ls = lines();
    if (!ls.length) { $("#order-summary").innerHTML = `<div class="empty">O carrinho está vazio. Adiciona artigos acima.</div>`; return; }
    const total = ls.reduce((s, l) => s + l.p.preco * l.qtd, 0);
    $("#order-summary").innerHTML = ls.map((l) => `<div class="cart-line" style="grid-template-columns:48px 1fr auto"><img src="${esc(l.p.imagem)}" alt="" style="width:48px;height:48px"><div><strong>${esc(l.p.nome)}</strong><small>${l.tamanho ? `Tamanho ${esc(l.tamanho)} · ` : ""}${l.qtd} × ${euro(l.p.preco)}</small></div><strong>${euro(l.p.preco * l.qtd)}</strong></div>`).join("")
      + `<div class="cart-total" style="margin:16px 0 0"><span>Total</span><strong>${euro(total)}</strong></div><p style="font-size:.8rem;color:var(--text-muted);margin:8px 0 0">Sócios com quotas em dia têm 10% de desconto, aplicado no levantamento.</p>`;
  };
  renderSummary();
  document.addEventListener("cart:change", renderSummary);
  document.addEventListener("click", (e) => { if (e.target.closest("[data-add]")) setTimeout(renderSummary, 50); });

  const form = $("#order-form");
  form.addEventListener("submit", (e) => {
    if (!lines().length) { e.stopImmediatePropagation(); e.preventDefault(); FCT.toast("Adiciona pelo menos um artigo ao carrinho."); }
  }, true);
  bindForm(form, {
    endpoint: "php/encomendas.php",
    extra: () => ({ itens: cart() }),
    successMsg: (r) => `Encomenda recebida. Referência ${r.referencia}. Vamos contactar-te quando estiver pronta para levantar no campo.`,
    onSuccess: () => { writeCart([]); renderSummary(); },
  });
});
