/* =========================================================================
   DESPORTIVO DE CANELAS FC — Painel de administração
   Lê e grava os ficheiros JSON através de php/admin-api.php.
   Cada separador (Jogos, Classificação, Notícias…) é uma função "view".
   ========================================================================= */
(() => {
  "use strict";

  const CSRF = document.body.dataset.csrf;
  const CLUB_ID = "canelas";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const euro = (n) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(+n || 0);
  const today = () => new Date().toISOString().slice(0, 10);
  const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "item";
  const uniqueId = (base, list, key = "id") => { let id = base, i = 2; while (list.some((x) => x[key] === id)) id = `${base}-${i++}`; return id; };
  const fmtDate = (s) => { if (!s) return "—"; const d = new Date(s.length <= 10 ? s + "T00:00" : s); return isNaN(d) ? s : d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }); };
  const fmtDateTime = (s) => { if (!s) return "—"; const d = new Date(s); return isNaN(d) ? s : d.toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); };
  const imgSrc = (p) => (!p ? "../img/plantel/sem-foto.svg" : /^(https?:)?\/\//.test(p) ? p : "../" + p);

  const ICONS = {
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
    news: '<rect x="3" y="4" width="14" height="16" rx="2"/><path d="M17 8h3v10a2 2 0 0 1-2 2H7M7 8h6M7 12h6M7 16h4"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7M16 4a4 4 0 0 1 0 8M18 14c2.5.6 4 3 4 7"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H6"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    inbox: '<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/>',
  };
  const icon = (n) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;

  /* ---------- MENSAGENS ---------- */
  function toast(msg, isError = false) {
    const t = $("#toast");
    t.textContent = msg;
    t.style.background = isError ? "var(--loss)" : "";
    t.classList.add("is-show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("is-show"), isError ? 5000 : 2200);
  }
  async function run(fn) {
    try { return await fn(); } catch (e) { console.error(e); toast(e.message || "Ocorreu um erro.", true); }
  }

  /* ---------- API ---------- */
  const store = {};
  const api = {
    async req(url, opts = {}) {
      const r = await fetch(url, { credentials: "same-origin", cache: "no-store", ...opts });
      let j;
      try { j = await r.json(); } catch { throw new Error("O servidor não respondeu como esperado. Confirma que o site está a correr com PHP."); }
      if (r.status === 401) { alert(j.erro); location.reload(); }
      if (!r.ok || j.ok === false) throw new Error(j.erro || "Erro no servidor.");
      return j;
    },
    async get(nome) {
      if (store[nome] !== undefined) return store[nome];
      const j = await api.req(`admin-api.php?acao=ler&nome=${nome}`);
      store[nome] = j.dados ?? [];
      return store[nome];
    },
    async save(nome, dados = store[nome], msg = "Guardado") {
      await api.req("admin-api.php?acao=guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF": CSRF },
        body: JSON.stringify({ nome, dados }),
      });
      store[nome] = dados;
      toast(msg + " ✓");
      updateBadges();
    },
    async upload(file, pasta) {
      const fd = new FormData();
      fd.append("ficheiro", file);
      fd.append("pasta", pasta);
      const j = await api.req("admin-api.php?acao=upload", { method: "POST", headers: { "X-CSRF": CSRF }, body: fd });
      return j.caminho;
    },
  };

  /* ---------- MODAL ---------- */
  let lastFocus = null;
  function openModal(html) {
    lastFocus = document.activeElement;
    $("#a-modal-body").innerHTML = html;
    $("#a-modal").classList.add("is-open");
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#a-modal-body .a-grid input, #a-modal-body .a-grid select, #a-modal-body .a-grid textarea, #a-modal-body [data-close]")?.focus(), 30);
  }
  function closeModal() {
    $("#a-modal").classList.remove("is-open");
    document.body.style.overflow = "";
    lastFocus?.focus?.();
  }
  $("#a-modal").addEventListener("click", (e) => { if (e.target.id === "a-modal" || e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#a-modal").classList.contains("is-open")) closeModal(); });

  /* ---------- FORMULÁRIOS GENÉRICOS ----------
     Campo: { k: chave (aceita "redes.facebook"), l: rótulo, t: tipo, req, full, opts, pasta, hint, omit, list }
     Tipos: text, email, number, nullnum, date, datetime, textarea, paragraphs, lines, list, select, checkbox, image */
  const getPath = (o, k) => k.split(".").reduce((a, p) => (a == null ? undefined : a[p]), o);
  const setPath = (o, k, v) => { const ps = k.split("."); let a = o; ps.slice(0, -1).forEach((p) => { a[p] = a[p] && typeof a[p] === "object" ? a[p] : {}; a = a[p]; }); a[ps.at(-1)] = v; };
  const delPath = (o, k) => { const ps = k.split("."); const a = getPath(o, ps.slice(0, -1).join(".")) ?? (ps.length === 1 ? o : null); if (a) delete a[ps.at(-1)]; };

  let fid = 0;
  function fieldHtml(f, v) {
    const id = `f${++fid}`;
    const req = f.req ? " required" : "";
    const label = `<label for="${id}">${esc(f.l)}${f.req ? "" : ' <span class="hint">(opcional)</span>'}</label>`;
    const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : "";
    const wrap = (inner) => `<div class="field ${f.full ? "full" : ""}">${label}${inner}${hint}</div>`;
    const opts = typeof f.opts === "function" ? f.opts() : f.opts || [];
    switch (f.t) {
      case "number": case "nullnum":
        return wrap(`<input class="input" id="${id}" name="${f.k}" type="number" step="${f.step || "any"}" ${f.min != null ? `min="${f.min}"` : ""} value="${v ?? ""}"${req}>`);
      case "date":
        return wrap(`<input class="input" id="${id}" name="${f.k}" type="date" value="${esc((v || "").slice(0, 10))}"${req}>`);
      case "datetime":
        return wrap(`<input class="input" id="${id}" name="${f.k}" type="datetime-local" value="${esc((v || "").slice(0, 16))}"${req}>`);
      case "textarea":
        return wrap(`<textarea class="textarea" id="${id}" name="${f.k}" rows="${f.rows || 3}" style="min-height:${(f.rows || 3) * 24}px"${req}>${esc(v)}</textarea>`);
      case "paragraphs":
        return wrap(`<textarea class="textarea" id="${id}" name="${f.k}" rows="9"${req}>${esc((v || []).join("\n\n"))}</textarea>`);
      case "lines":
        return wrap(`<textarea class="textarea" id="${id}" name="${f.k}" rows="4" style="min-height:96px"${req}>${esc((v || []).join("\n"))}</textarea>`);
      case "list":
        return wrap(`<input class="input" id="${id}" name="${f.k}" value="${esc((v || []).join(", "))}"${req}>`);
      case "select": {
        const list = opts.map((o) => (Array.isArray(o) ? o : [o, o]));
        if (v != null && v !== "" && !list.some(([val]) => String(val) === String(v))) list.unshift([v, v]);
        return wrap(`<select class="select" id="${id}" name="${f.k}" style="height:40px"${req}>${f.req ? "" : '<option value="">—</option>'}${!v && f.req ? '<option value="" selected disabled>Escolhe…</option>' : ""}${list.map(([val, lab]) => `<option value="${esc(val)}" ${String(val) === String(v) ? "selected" : ""}>${esc(lab)}</option>`).join("")}</select>`);
      }
      case "checkbox":
        return `<label class="check ${f.full ? "full" : ""}"><input type="checkbox" name="${f.k}" ${v ? "checked" : ""}> ${esc(f.l)}</label>`;
      case "image":
        return wrap(`<div class="img-field"><img src="${esc(imgSrc(v))}" alt=""><input class="input" id="${id}" name="${f.k}" value="${esc(v)}" placeholder="img/${esc(f.pasta)}/…"${req}><label class="btn btn--soft btn--sm">Carregar<input type="file" accept="image/jpeg,image/png,image/webp" hidden data-upload="${esc(f.pasta)}"></label></div>`);
      default: {
        const dl = f.list ? `<datalist id="${id}-dl">${(typeof f.list === "function" ? f.list() : f.list).map((o) => `<option value="${esc(o)}">`).join("")}</datalist>` : "";
        return wrap(`<input class="input" id="${id}" name="${f.k}" type="${f.t === "email" ? "email" : "text"}" value="${esc(v)}" ${f.max ? `maxlength="${f.max}"` : ""} ${f.list ? `list="${id}-dl"` : ""}${req}>${dl}`);
      }
    }
  }

  function readForm(form, fields, base) {
    const o = structuredClone(base || {});
    const errors = [];
    fields.forEach((f) => {
      const el = form.elements[f.k];
      if (!el) return;
      let v;
      switch (f.t) {
        case "number": v = el.value === "" ? 0 : Number(el.value); break;
        case "nullnum": v = el.value === "" ? null : Number(el.value); break;
        case "checkbox": v = el.checked; break;
        case "list": v = el.value.split(",").map((s) => s.trim()).filter(Boolean); break;
        case "lines": v = el.value.split("\n").map((s) => s.trim()).filter(Boolean); break;
        case "paragraphs": v = el.value.split(/\n\s*\n/).map((s) => s.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean); break;
        default: v = el.value.trim();
      }
      const empty = v === "" || v === null || (Array.isArray(v) && !v.length);
      const field = el.closest?.(".field");
      if (f.req && empty) { errors.push(f.l); field?.classList.add("has-error"); } else field?.classList.remove("has-error");
      if (f.t === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { errors.push(f.l); field?.classList.add("has-error"); }
      if (f.omit && (empty || v === false)) delPath(o, f.k); else setPath(o, f.k, v);
    });
    return { obj: o, errors };
  }

  function bindUploads(root) {
    root.addEventListener("change", (e) => {
      const input = e.target.closest("input[data-upload]");
      if (!input || !input.files[0]) return;
      const box = input.closest(".img-field");
      const btn = input.closest("label");
      btn.classList.add("is-loading"); btn.firstChild.textContent = "A carregar…";
      run(async () => {
        const path = await api.upload(input.files[0], input.dataset.upload);
        $("input.input", box).value = path;
        $("img", box).src = imgSrc(path);
        toast("Imagem carregada ✓");
      }).finally(() => { btn.firstChild.textContent = "Carregar"; input.value = ""; });
    });
  }

  /** Abre um formulário num modal. onSave(obj) pode lançar erro para mostrar ao utilizador. */
  function editModal(title, fields, obj, onSave) {
    openModal(`
      <form class="a-form" novalidate>
        <button class="icon-btn dialog-close" type="button" data-close aria-label="Fechar">${icon("close")}</button>
        <h2>${esc(title)}</h2>
        <div class="a-grid">${fields.map((f) => fieldHtml(f, getPath(obj, f.k))).join("")}</div>
        <div class="form-status" role="alert"></div>
        <div class="a-form__foot"><button type="button" class="btn btn--ghost btn--sm" data-close>Cancelar</button><button class="btn btn--primary btn--sm" type="submit">Guardar</button></div>
      </form>`);
    const form = $("#a-modal-body form");
    bindUploads(form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const st = $(".form-status", form);
      const { obj: out, errors } = readForm(form, fields, obj);
      if (errors.length) { st.className = "form-status is-error"; st.textContent = `Preenche corretamente: ${errors.join(", ")}.`; return; }
      const btn = $("[type=submit]", form); btn.disabled = true;
      try { await onSave(out); closeModal(); }
      catch (err) { st.className = "form-status is-error"; st.textContent = err.message; }
      finally { btn.disabled = false; }
    });
  }

  /* ---------- LISTA EDITÁVEL GENÉRICA ---------- */
  /**
   * collection({ el, title, help, items(), columns:[{l, v(item), cls}], fields, blank(), save(list), label(item),
   *              sort(a,b), filter(item), canDelete(item), extra(item) })
   */
  function collection(cfg) {
    const draw = () => {
      const all = cfg.items().map((it, i) => ({ it, i }));
      let rows = cfg.filter ? all.filter((r) => cfg.filter(r.it)) : all;
      if (cfg.sort) rows = rows.slice().sort((a, b) => cfg.sort(a.it, b.it));
      cfg.el.innerHTML = `
        <h2>${esc(cfg.title)} <span class="muted" style="font-weight:500;color:var(--text-muted);text-transform:none;letter-spacing:0">${all.length}</span>
          ${cfg.blank ? `<button class="btn btn--primary btn--sm" type="button" data-new>${icon("plus")}${esc(cfg.newLabel || "Adicionar")}</button>` : ""}</h2>
        ${cfg.help ? `<p class="help">${cfg.help}</p>` : ""}
        ${cfg.toolbar || ""}
        <div class="a-table-wrap"><table class="a-table">
          <thead><tr>${cfg.columns.map((c) => `<th>${esc(c.l)}</th>`).join("")}<th></th></tr></thead>
          <tbody>${rows.length ? rows.map(({ it, i }) => `<tr class="${cfg.rowClass ? cfg.rowClass(it) : ""}">${cfg.columns.map((c) => `<td class="${c.cls || ""}">${c.v(it)}</td>`).join("")}
            <td class="actions">${cfg.extra ? cfg.extra(it, i) : ""}${cfg.fields ? `<button class="a-icon" type="button" data-edit="${i}" title="Editar" aria-label="Editar">${icon("edit")}</button>` : ""}
            ${!cfg.canDelete || cfg.canDelete(it) ? `<button class="a-icon a-icon--danger" type="button" data-del="${i}" title="Apagar" aria-label="Apagar">${icon("trash")}</button>` : ""}</td></tr>`).join("")
            : `<tr><td colspan="${cfg.columns.length + 1}" class="muted" style="padding:18px;text-align:center">${esc(cfg.empty || "Ainda não há nada aqui.")}</td></tr>`}</tbody>
        </table></div>`;
    };
    cfg.el.addEventListener("click", (e) => {
      const list = cfg.items();
      if (e.target.closest("[data-new]")) {
        editModal(`${cfg.newLabel || "Adicionar"}`, cfg.fields, cfg.blank(), async (obj) => {
          const next = [...list];
          const item = cfg.beforeSave ? cfg.beforeSave(obj, true, next, null) : obj;
          next.push(item);
          await cfg.save(next);
          draw();
        });
      }
      const ed = e.target.closest("[data-edit]");
      if (ed) {
        const i = +ed.dataset.edit;
        editModal(`Editar · ${cfg.label ? cfg.label(list[i]) : ""}`, cfg.fields, list[i], async (obj) => {
          const next = [...list];
          next[i] = cfg.beforeSave ? cfg.beforeSave(obj, false, next, list[i]) : obj;
          await cfg.save(next);
          draw();
        });
      }
      const del = e.target.closest("[data-del]");
      if (del) {
        const i = +del.dataset.del;
        const why = cfg.blockDelete?.(list[i]);
        if (why) { toast(why, true); return; }
        if (!confirm(`Apagar "${cfg.label ? cfg.label(list[i]) : "este item"}"? Esta ação não se pode desfazer (fica uma cópia de segurança em storage/backups).`)) return;
        run(async () => { await cfg.save(list.filter((_, k) => k !== i)); draw(); });
      }
    });
    cfg.redraw = draw;
    draw();
    return cfg;
  }

  const head = (title, text, actions = "") => `<div class="admin-head"><h1>${esc(title)}</h1>${actions}<p>${text}</p></div>`;
  const section = (id) => `<section class="admin-section" id="${id}"></section>`;
  const tag = (txt, kind = "") => `<span class="tag ${kind ? "tag--" + kind : ""}">${esc(txt)}</span>`;

  /* =====================================================================
     VIEWS
     ===================================================================== */
  const teamName = (id) => store.equipas?.[id]?.curto || store.equipas?.[id]?.nome || id;
  const teamOpts = () => Object.entries(store.equipas || {}).map(([id, t]) => [id, t.nome]).sort((a, b) => (a[0] === CLUB_ID ? -1 : b[0] === CLUB_ID ? 1 : a[1].localeCompare(b[1])));
  const isPending = (j) => (j.golosCasa === null || j.golosCasa === undefined) && new Date(j.data) < new Date();
  const isNew = (r) => !r.tratado;

  /* ---------- PAINEL ---------- */
  async function viewPainel(main) {
    const [jogos] = await Promise.all([api.get("jogos"), api.get("equipas"), ...["encomendas", "bilhetes", "adesoes", "contactos"].map(api.get)]);
    const pend = jogos.jogos.filter(isPending).length;
    const cnt = (n) => (store[n] || []).filter(isNew).length;
    const next = jogos.jogos.filter((j) => new Date(j.data) > new Date()).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 4);
    main.innerHTML = head("Painel", "Resumo do que precisa de atenção. Clica num cartão para ir à secção.") + `
      <div class="cards">
        <button class="stat-card" data-go="jogos"><b style="color:${pend ? "var(--draw)" : "inherit"}">${pend}</b><span>Resultados por lançar</span></button>
        <button class="stat-card" data-go="pedidos/encomendas"><b>${cnt("encomendas")}</b><span>Encomendas novas</span></button>
        <button class="stat-card" data-go="pedidos/bilhetes"><b>${cnt("bilhetes")}</b><span>Reservas de bilhetes novas</span></button>
        <button class="stat-card" data-go="pedidos/adesoes"><b>${cnt("adesoes")}</b><span>Inscrições de sócio novas</span></button>
        <button class="stat-card" data-go="pedidos/contactos"><b>${cnt("contactos")}</b><span>Mensagens novas</span></button>
      </div>
      <section class="admin-section" style="margin-top:22px"><h2>Próximos jogos</h2>
        <div class="a-table-wrap"><table class="a-table"><tbody>${next.map((j) => `<tr><td>${fmtDateTime(j.data)}</td><td>${tag(j.escalao)}</td><td><strong>${esc(teamName(j.casa))}</strong> vs <strong>${esc(teamName(j.fora))}</strong></td><td>${j.bilhetes ? tag("Bilhetes à venda", "blue") : ""}</td></tr>`).join("") || '<tr><td class="muted">Não há jogos marcados. Acrescenta-os em Jogos.</td></tr>'}</tbody></table></div>
      </section>
      <section class="admin-section"><h2>Como funciona</h2>
        <p class="help">Tudo o que gravas aqui aparece logo no site (pode ser preciso atualizar a página do site). Antes de cada gravação é guardada uma cópia do ficheiro em <code>storage/backups</code>, por isso um erro pode sempre ser desfeito.</p>
      </section>`;
    main.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) location.hash = b.dataset.go; }, { once: false });
  }

  /* ---------- JOGOS ---------- */
  async function viewJogos(main) {
    const [db, , clube] = await Promise.all([api.get("jogos"), api.get("equipas"), api.get("clube")]);
    main.innerHTML = head("Jogos", "Lança resultados, marca jogos novos e gere as equipas adversárias.") + section("s-pend") + section("s-list") + section("s-teams") + section("s-comps");
    const saveJogos = (list) => { db.jogos = list.sort((a, b) => a.data.localeCompare(b.data)); return api.save("jogos", db); };

    // Resultados por lançar
    const drawPending = () => {
      const pend = db.jogos.map((j, i) => ({ j, i })).filter(({ j }) => isPending(j));
      $("#s-pend").innerHTML = `<h2>Resultados por lançar</h2>` + (pend.length ? `
        <p class="help">Jogos que já aconteceram e ainda não têm resultado. Escreve os golos e carrega em Guardar.</p>
        <div class="a-table-wrap"><table class="a-table"><tbody>${pend.map(({ j, i }) => `
          <tr data-row="${i}"><td>${fmtDateTime(j.data)}</td><td>${tag(j.escalao)}</td>
          <td style="text-align:right"><strong>${esc(teamName(j.casa))}</strong></td>
          <td style="white-space:nowrap"><input class="input" type="number" min="0" data-gc aria-label="Golos ${esc(teamName(j.casa))}"> – <input class="input" type="number" min="0" data-gf aria-label="Golos ${esc(teamName(j.fora))}"></td>
          <td><strong>${esc(teamName(j.fora))}</strong></td>
          <td class="actions"><button class="btn btn--primary btn--sm" type="button" data-result="${i}">Guardar</button></td></tr>`).join("")}</tbody></table></div>`
        : `<div class="notice notice--ok">Está tudo em dia: não há resultados por lançar.</div>`);
    };
    $("#s-pend").addEventListener("click", (e) => {
      const b = e.target.closest("[data-result]"); if (!b) return;
      const row = b.closest("tr");
      const gc = $("[data-gc]", row).value, gf = $("[data-gf]", row).value;
      if (gc === "" || gf === "") { toast("Escreve os golos das duas equipas.", true); return; }
      run(async () => {
        const j = db.jogos[+b.dataset.result];
        j.golosCasa = +gc; j.golosFora = +gf;
        await api.save("jogos", db, "Resultado guardado");
        drawPending(); list.redraw();
      });
    });
    drawPending();

    // Todos os jogos
    let filtro = "";
    const escaloes = (clube.escaloes || []).map((e) => e.nome);
    const fields = [
      { k: "data", l: "Data e hora", t: "datetime", req: true },
      { k: "escalao", l: "Escalão", t: "select", opts: escaloes.length ? escaloes : ["Seniores"], req: true },
      { k: "casa", l: "Equipa da casa", t: "select", opts: teamOpts, req: true },
      { k: "fora", l: "Equipa de fora", t: "select", opts: teamOpts, req: true },
      { k: "competicao", l: "Competição", t: "select", opts: () => Object.entries(db.competicoes), req: true },
      { k: "jornada", l: "Jornada", t: "nullnum", min: 1 },
      { k: "eliminatoria", l: "Eliminatória (taças)", t: "text", omit: true },
      { k: "local", l: "Local", t: "text", omit: true, hint: "Vazio = o nosso campo (em casa) ou campo do adversário" },
      { k: "golosCasa", l: "Golos da casa", t: "nullnum", min: 0, hint: "Vazio enquanto o jogo não acontecer" },
      { k: "golosFora", l: "Golos de fora", t: "nullnum", min: 0 },
      { k: "bilhetes", l: "Bilhetes à venda no site (só jogos em casa)", t: "checkbox", omit: true, full: true },
    ];
    const list = collection({
      el: $("#s-list"), title: "Todos os jogos", newLabel: "Novo jogo",
      toolbar: `<div class="toolbar" style="margin-bottom:10px"><select class="select" id="f-esc"><option value="">Todos os escalões</option>${escaloes.map((e) => `<option>${esc(e)}</option>`).join("")}</select></div>`,
      items: () => db.jogos,
      filter: (j) => !filtro || j.escalao === filtro,
      sort: (a, b) => b.data.localeCompare(a.data),
      columns: [
        { l: "Data", v: (j) => fmtDateTime(j.data) },
        { l: "Escalão", v: (j) => tag(j.escalao) },
        { l: "Jogo", v: (j) => `${j.casa === CLUB_ID ? "<strong>" : ""}${esc(teamName(j.casa))}${j.casa === CLUB_ID ? "</strong>" : ""} vs ${j.fora === CLUB_ID ? "<strong>" : ""}${esc(teamName(j.fora))}${j.fora === CLUB_ID ? "</strong>" : ""}` },
        { l: "Resultado", v: (j) => (j.golosCasa != null ? `<strong>${j.golosCasa} - ${j.golosFora}</strong>` : isPending(j) ? tag("Por lançar", "draw") : '<span class="muted">—</span>') },
        { l: "Competição", v: (j) => `<span class="muted">${esc(db.competicoes[j.competicao] || j.competicao)}${j.jornada ? ` · J${j.jornada}` : ""}</span>` },
        { l: "Bilhetes", v: (j) => (j.bilhetes ? tag("À venda", "blue") : "") },
      ],
      label: (j) => `${teamName(j.casa)} vs ${teamName(j.fora)}`,
      fields,
      blank: () => ({ id: "", escalao: escaloes[escaloes.length - 1] || "Seniores", competicao: Object.keys(db.competicoes)[0], jornada: null, data: "", casa: CLUB_ID, fora: "", golosCasa: null, golosFora: null }),
      beforeSave: (o, isNewItem, all) => {
        if (o.casa === o.fora) throw new Error("A equipa da casa e a de fora não podem ser a mesma.");
        if ((o.golosCasa == null) !== (o.golosFora == null)) throw new Error("Preenche os golos das duas equipas, ou deixa os dois vazios.");
        if (isNewItem) o.id = uniqueId("g" + o.data.slice(2, 10).replace(/-/g, ""), all);
        if (o.casa !== CLUB_ID) delete o.bilhetes;
        return o;
      },
      save: saveJogos,
    });
    $("#s-list").addEventListener("change", (e) => { if (e.target.id === "f-esc") { filtro = e.target.value; list.redraw(); $("#f-esc").value = filtro; } });

    // Equipas
    const teamsList = () => Object.entries(store.equipas).map(([id, t]) => ({ id, ...t }));
    collection({
      el: $("#s-teams"), title: "Equipas", newLabel: "Nova equipa",
      help: "Todas as equipas que aparecem nos jogos e na classificação. O emblema é opcional; sem emblema aparece a sigla num círculo.",
      items: teamsList,
      sort: (a, b) => (a.id === CLUB_ID ? -1 : b.id === CLUB_ID ? 1 : a.nome.localeCompare(b.nome)),
      columns: [
        { l: "", v: (t) => (t.emblema ? `<img class="thumb" style="width:30px;height:30px;border-radius:50%" src="${esc(imgSrc(t.emblema))}" alt="">` : `<span class="mini-crest">${esc(t.sigla)}</span>`) },
        { l: "Nome", v: (t) => `<strong>${esc(t.nome)}</strong>` },
        { l: "Nome curto", v: (t) => esc(t.curto) },
        { l: "Sigla", v: (t) => esc(t.sigla) },
      ],
      label: (t) => t.nome,
      fields: [
        { k: "nome", l: "Nome completo", req: true, full: true },
        { k: "curto", l: "Nome curto", req: true, hint: "Usado nos resultados, ex.: Lixa" },
        { k: "sigla", l: "Sigla (3 letras)", req: true, max: 4 },
        { k: "emblema", l: "Emblema", t: "image", pasta: "equipas", omit: true, full: true },
      ],
      blank: () => ({ nome: "", curto: "", sigla: "" }),
      beforeSave: (o, isNewItem, all) => { if (isNewItem) o.id = uniqueId(slug(o.curto || o.nome), all); o.sigla = o.sigla.toUpperCase(); return o; },
      canDelete: (t) => t.id !== CLUB_ID,
      blockDelete: (t) => (db.jogos.some((j) => j.casa === t.id || j.fora === t.id) ? "Esta equipa tem jogos marcados. Apaga ou muda esses jogos primeiro." : (store.classificacao?.equipas || []).some((r) => r.id === t.id) ? "Esta equipa está na classificação. Retira-a de lá primeiro." : ""),
      save: async (arr) => { const map = {}; arr.forEach(({ id, ...t }) => (map[id] = t)); await api.save("equipas", map); },
    });
    api.get("classificacao").catch(() => {});

    // Competições
    collection({
      el: $("#s-comps"), title: "Competições", newLabel: "Nova competição",
      items: () => Object.entries(db.competicoes).map(([id, nome]) => ({ id, nome })),
      columns: [{ l: "Nome", v: (c) => esc(c.nome) }, { l: "Jogos", v: (c) => db.jogos.filter((j) => j.competicao === c.id).length }],
      label: (c) => c.nome,
      fields: [{ k: "nome", l: "Nome da competição", req: true, full: true }],
      blank: () => ({ nome: "" }),
      beforeSave: (o, isNewItem, all) => { if (isNewItem) o.id = uniqueId(slug(o.nome).slice(0, 20), all); return o; },
      blockDelete: (c) => (db.jogos.some((j) => j.competicao === c.id) ? "Há jogos nesta competição. Muda-os primeiro." : ""),
      save: async (arr) => { db.competicoes = Object.fromEntries(arr.map((c) => [c.id, c.nome])); await api.save("jogos", db); },
    });
  }

  /* ---------- CLASSIFICAÇÃO ---------- */
  /** Lê uma tabela copiada de um site (zerozero, AF Porto…) e devolve as linhas encontradas. */
  function parseStandings(text, equipas) {
    const PREFIX = /^(a\.?d\.?|s\.?c\.?|c\.?d\.?|f\.?c\.?|u\.?d\.?|g\.?d\.?|a\.?c\.?|c\.?f\.?|g\.?c\.?|aliança( de)?|associação|clube|sport|grupo desportivo|uniao|união)\s+/i;
    const key = (s) => norm(s).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const core = (s) => key(s).replace(PREFIX, "").trim();
    const known = Object.entries(equipas).map(([id, t]) => ({ id, keys: [key(t.nome), key(t.curto), core(t.nome), core(t.curto)].filter(Boolean) }));
    const match = (name) => {
      const k = key(name), c = core(name);
      let hit = known.find((t) => t.keys.includes(k) || t.keys.includes(c));
      if (!hit) hit = known.find((t) => t.keys.some((x) => x.length > 3 && (k.includes(x) || x.includes(c))));
      return hit?.id || null;
    };

    const rows = [], lines = [];
    let pendingName = "";
    text.split(/\r?\n/).forEach((raw) => {
      const line = raw.replace(/(\d+)\s*[-:]\s*(\d+)/g, "$1 $2").trim();
      if (!line) return;
      const tokens = line.split(/[\t ]+/).filter(Boolean);
      const isNum = (t) => /^\d+$/.test(t);
      // Início do nome = primeira palavra que não é número, diferença (+3) nem letra de forma (V/E/D)
      const firstWord = tokens.findIndex((t) => !isNum(t) && !/^[+-]\d+$/.test(t) && !/^[VEDvedWLwl]$/.test(t));
      const nameTokens = [], nums = [], form = [];
      tokens.forEach((t, i) => {
        if (isNum(t)) { if (i > firstWord && firstWord !== -1) nums.push(+t); else if (firstWord === -1) nums.push(+t); }
        else if (/^[+-]\d+$/.test(t)) { /* diferença de golos: ignorada, é calculada */ }
        else if (/^[VEDvedWLwl]$/.test(t) && (nameTokens.length || firstWord === -1)) form.push(t.toUpperCase().replace("W", "V").replace("L", "D"));
        else if (!form.length) nameTokens.push(t);
      });
      let name = nameTokens.join(" ").replace(/\s+/g, " ").trim();
      if (nums.length < 4) { if (name && !/^(#|pos\b|equipa\b|clube\b|pts\b|classifica)/i.test(norm(name))) pendingName = name; return; }
      if (!name) name = pendingName;
      pendingName = "";
      if (!name) return;
      lines.push({ name, nums, form });
    });

    // Procura as colunas J, V, E, D: quatro números seguidos em que J = V + E + D.
    // Escolhe a posição que funciona para mais linhas (todas as linhas da tabela têm as mesmas colunas).
    const fits = (n, k) => k + 3 < n.length && n[k] === n[k + 1] + n[k + 2] + n[k + 3];
    const maxLen = Math.max(0, ...lines.map((l) => l.nums.length));
    let best = -1, bestScore = -1;
    for (let k = 0; k + 3 < maxLen; k++) {
      let score = lines.filter((l) => fits(l.nums, k)).length * 10;
      // desempate: coluna anterior = pontos (3V + E)
      score += lines.filter((l) => fits(l.nums, k) && k > 0 && l.nums[k - 1] === 3 * l.nums[k + 1] + l.nums[k + 2]).length;
      if (score > bestScore) { best = k; bestScore = score; }
    }
    lines.forEach(({ name, nums, form }) => {
      let at = fits(nums, best) ? best : -1;
      if (at === -1) for (let i = 0; i + 3 < nums.length; i++) if (fits(nums, i)) { at = i; break; }
      if (at === -1) return;
      const [, v, e, d, gm = 0, gs = 0] = nums.slice(at);
      rows.push({ nome: name, id: match(name), v, e, d, gm, gs, forma: form.slice(0, 5) });
    });
    return rows;
  }

  async function viewClassificacao(main) {
    const [cls] = await Promise.all([api.get("classificacao"), api.get("equipas")]);
    cls.regras = cls.regras || { vitoria: 3, empate: 1, derrota: 0, subida: 2, descida: 3 };
    main.innerHTML = head("Classificação", "Atualiza a tabela à mão ou cola-a copiada do zerozero ou do site da AF Porto. Os pontos, a diferença de golos e a ordem são calculados automaticamente.") + section("s-paste") + section("s-meta") + section("s-table");

    // Colar tabela
    $("#s-paste").innerHTML = `
      <h2>Colar tabela de outro site</h2>
      <div class="panel">
        <p class="help" style="margin-bottom:10px"><strong>1.</strong> No zerozero ou no site da AF Porto, seleciona a tabela da classificação com o rato, da primeira à última equipa, e copia (Ctrl+C).
        <strong>2.</strong> Cola aqui (Ctrl+V). <strong>3.</strong> Carrega em <em>Ler tabela</em>, confirma e carrega em <em>Aplicar e guardar</em>.</p>
        <textarea class="textarea paste-box" id="paste" placeholder="Cola aqui a tabela…"></textarea>
        <div style="display:flex;gap:10px;margin-top:10px"><button class="btn btn--primary btn--sm" type="button" id="parse">Ler tabela</button><button class="btn btn--ghost btn--sm" type="button" id="clear-paste">Limpar</button></div>
        <div id="preview"></div>
      </div>`;
    let parsed = [];
    $("#clear-paste").addEventListener("click", () => { $("#paste").value = ""; $("#preview").innerHTML = ""; parsed = []; });
    $("#parse").addEventListener("click", () => {
      parsed = parseStandings($("#paste").value, store.equipas);
      if (!parsed.length) { $("#preview").innerHTML = `<div class="notice notice--warn">Não encontrei nenhuma equipa. Confirma que copiaste a tabela inteira, incluindo as colunas J, V, E, D e golos.</div>`; return; }
      const novas = parsed.filter((r) => !r.id);
      $("#preview").innerHTML = `
        <div class="notice ${novas.length ? "notice--warn" : "notice--ok"}">Encontrei ${parsed.length} equipas.${novas.length ? ` ${novas.length === 1 ? "1 equipa não existe ainda no site e vai ser criada" : novas.length + " equipas não existem ainda no site e vão ser criadas"}: <strong>${novas.map((r) => esc(r.nome)).join(", ")}</strong>. Se alguma for uma equipa que já existe com outro nome, corrige o nome em Jogos → Equipas antes de aplicar.` : " Todas correspondem a equipas que já existem."}</div>
        <div class="a-table-wrap"><table class="a-table"><thead><tr><th>#</th><th>Equipa copiada</th><th>Equipa no site</th><th>J</th><th>V</th><th>E</th><th>D</th><th>Golos</th><th>Pts</th><th>Forma</th></tr></thead><tbody>
        ${parsed.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.nome)}</td><td>${r.id ? esc(store.equipas[r.id].nome) : tag("Nova", "draw")}</td><td>${r.v + r.e + r.d}</td><td>${r.v}</td><td>${r.e}</td><td>${r.d}</td><td>${r.gm}-${r.gs}</td><td><strong>${r.v * 3 + r.e}</strong></td><td>${r.forma.join(" ")}</td></tr>`).join("")}
        </tbody></table></div>
        <div style="display:flex;gap:10px;margin-top:10px"><button class="btn btn--primary btn--sm" type="button" id="apply">${icon("check")}Aplicar e guardar</button></div>`;
    });
    $("#s-paste").addEventListener("click", (e) => {
      if (!e.target.closest("#apply")) return;
      run(async () => {
        const eq = { ...store.equipas };
        let newTeams = 0;
        const rows = parsed.map((r) => {
          let id = r.id;
          if (!id) {
            const curto = r.nome.replace(/^(a\.?d\.?|s\.?c\.?|c\.?d\.?|f\.?c\.?|u\.?d\.?|g\.?d\.?)\s+/i, "");
            id = uniqueId(slug(curto), Object.keys(eq).map((x) => ({ id: x })));
            eq[id] = { nome: r.nome, curto, sigla: norm(curto).replace(/[^a-z]/g, "").slice(0, 3).toUpperCase() || "EQP" };
            newTeams++;
          }
          const old = cls.equipas.find((x) => x.id === id);
          return { id, v: r.v, e: r.e, d: r.d, gm: r.gm, gs: r.gs, forma: r.forma.length ? r.forma : old?.forma || [] };
        });
        if (newTeams) await api.save("equipas", eq, `${newTeams} equipa(s) criada(s)`);
        cls.equipas = rows;
        cls.atualizado = today();
        await api.save("classificacao", cls, "Classificação atualizada");
        parsed = [];
        $("#preview").innerHTML = `<div class="notice notice--ok">Classificação atualizada. Já está visível no site.</div>`;
        $("#paste").value = "";
        drawTable();
      });
    });

    // Dados da competição
    const metaFields = [
      { k: "competicao", l: "Competição", req: true, full: true },
      { k: "epoca", l: "Época", req: true },
      { k: "regras.subida", l: "Lugares de subida (verde)", t: "number", min: 0 },
      { k: "regras.descida", l: "Lugares de descida (vermelho)", t: "number", min: 0 },
    ];
    $("#s-meta").innerHTML = `<h2>Competição</h2><form class="panel a-form" style="padding:16px" id="meta-form"><div class="a-grid">${metaFields.map((f) => fieldHtml(f, getPath(cls, f.k))).join("")}</div><div class="a-form__foot" style="margin-top:12px;padding-top:12px"><button class="btn btn--primary btn--sm" type="submit">Guardar</button></div></form>`;
    $("#meta-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const { obj, errors } = readForm(e.target, metaFields, cls);
      if (errors.length) { toast("Preenche: " + errors.join(", "), true); return; }
      run(() => { Object.assign(cls, obj); return api.save("classificacao", cls); });
    });

    // Tabela editável
    function drawTable() {
      const r = cls.regras;
      const pts = (t) => t.v * r.vitoria + t.e * r.empate;
      $("#s-table").innerHTML = `
        <h2>Tabela <span style="color:var(--text-muted);font-weight:500;text-transform:none;letter-spacing:0">atualizada a ${fmtDate(cls.atualizado)}</span>
          <button class="btn btn--ghost btn--sm" type="button" id="add-row">${icon("plus")}Adicionar equipa</button>
          <button class="btn btn--primary btn--sm" type="button" id="save-table">Guardar tabela</button></h2>
        <p class="help">Altera os números e carrega em <em>Guardar tabela</em>. A ordem final é calculada no site (pontos, depois diferença de golos, depois golos marcados). Forma: últimos 5 jogos com V, E ou D, o mais recente primeiro.</p>
        <div class="a-table-wrap"><table class="a-table" id="edit-table"><thead><tr><th>Equipa</th><th>V</th><th>E</th><th>D</th><th>GM</th><th>GS</th><th>J</th><th>Pts</th><th>Forma</th><th></th></tr></thead><tbody>
        ${cls.equipas.map((t, i) => `<tr data-i="${i}">
          <td><select class="select" data-k="id" style="min-width:200px">${teamOpts().map(([id, n]) => `<option value="${esc(id)}" ${id === t.id ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></td>
          ${["v", "e", "d", "gm", "gs"].map((k) => `<td><input class="input" type="number" min="0" data-k="${k}" value="${t[k]}"></td>`).join("")}
          <td data-j>${t.v + t.e + t.d}</td><td><strong data-pts>${pts(t)}</strong></td>
          <td><input class="input" data-k="forma" value="${esc((t.forma || []).join(""))}" maxlength="5" style="width:80px;text-transform:uppercase" pattern="[VEDved]*"></td>
          <td class="actions"><button class="a-icon a-icon--danger" type="button" data-rm="${i}" aria-label="Retirar">${icon("trash")}</button></td></tr>`).join("")}
        </tbody></table></div>`;
    }
    const readTable = () => $$("#edit-table tbody tr").map((tr) => {
      const g = (k) => $(`[data-k="${k}"]`, tr).value;
      return { id: g("id"), v: +g("v") || 0, e: +g("e") || 0, d: +g("d") || 0, gm: +g("gm") || 0, gs: +g("gs") || 0, forma: g("forma").toUpperCase().replace(/[^VED]/g, "").split("").slice(0, 5) };
    });
    $("#s-table").addEventListener("input", (e) => {
      const tr = e.target.closest("tr[data-i]"); if (!tr) return;
      const g = (k) => +$(`[data-k="${k}"]`, tr).value || 0;
      $("[data-j]", tr).textContent = g("v") + g("e") + g("d");
      $("[data-pts]", tr).textContent = g("v") * cls.regras.vitoria + g("e") * cls.regras.empate;
    });
    $("#s-table").addEventListener("click", (e) => {
      if (e.target.closest("#add-row")) {
        cls.equipas = readTable();
        const free = teamOpts().find(([id]) => !cls.equipas.some((t) => t.id === id));
        if (!free) { toast("Todas as equipas já estão na tabela. Cria uma nova em Jogos → Equipas.", true); return; }
        cls.equipas.push({ id: free[0], v: 0, e: 0, d: 0, gm: 0, gs: 0, forma: [] });
        drawTable();
      }
      const rm = e.target.closest("[data-rm]");
      if (rm) { cls.equipas = readTable(); cls.equipas.splice(+rm.dataset.rm, 1); drawTable(); }
      if (e.target.closest("#save-table")) {
        const rows = readTable();
        const dup = rows.find((r, i) => rows.findIndex((x) => x.id === r.id) !== i);
        if (dup) { toast(`A equipa "${store.equipas[dup.id]?.nome}" aparece duas vezes.`, true); return; }
        run(async () => {
          cls.equipas = rows.sort((a, b) => (b.v * 3 + b.e) - (a.v * 3 + a.e) || (b.gm - b.gs) - (a.gm - a.gs) || b.gm - a.gm);
          cls.atualizado = today();
          await api.save("classificacao", cls, "Tabela guardada");
          drawTable();
        });
      }
    });
    drawTable();
  }

  /* ---------- NOTÍCIAS ---------- */
  async function viewNoticias(main) {
    await api.get("noticias");
    main.innerHTML = head("Notícias", "Escreve, edita ou apaga notícias. A mais recente aparece primeiro no site e na página inicial.") + section("s-news");
    collection({
      el: $("#s-news"), title: "Notícias", newLabel: "Nova notícia",
      items: () => store.noticias,
      sort: (a, b) => b.data.localeCompare(a.data),
      columns: [
        { l: "", v: (n) => `<img class="thumb" src="${esc(imgSrc(n.imagem))}" alt="">` },
        { l: "Título", v: (n) => `<strong>${esc(n.titulo)}</strong>` },
        { l: "Categoria", v: (n) => tag(n.categoria) },
        { l: "Data", v: (n) => fmtDate(n.data) },
        { l: "", v: (n) => `<a class="link-more" href="../noticia.html?id=${encodeURIComponent(n.id)}" target="_blank" rel="noopener">Ver</a>` },
      ],
      label: (n) => n.titulo,
      fields: [
        { k: "titulo", l: "Título", req: true, full: true },
        { k: "categoria", l: "Categoria", req: true, list: () => [...new Set(["Clube", "Seniores", "Formação", "Sócios", "Loja", ...store.noticias.map((n) => n.categoria)])], hint: "Escolhe da lista ou escreve uma nova" },
        { k: "data", l: "Data", t: "date", req: true },
        { k: "imagem", l: "Imagem", t: "image", pasta: "noticias", req: true, full: true, hint: "Horizontal, de preferência com 1600 px de largura" },
        { k: "resumo", l: "Resumo (aparece nos cartões e em destaque no início da notícia)", t: "textarea", rows: 2, req: true, full: true },
        { k: "corpo", l: "Texto da notícia", t: "paragraphs", full: true, hint: "Separa os parágrafos com uma linha em branco" },
      ],
      blank: () => ({ titulo: "", categoria: "Clube", data: today(), imagem: "", resumo: "", corpo: [] }),
      beforeSave: (o, isNewItem, all) => { if (isNewItem) o.id = uniqueId(slug(o.titulo), all); return o; },
      save: (list) => api.save("noticias", list),
    });
  }

  /* ---------- PLANTEL ---------- */
  async function viewPlantel(main) {
    const pl = await api.get("plantel");
    main.innerHTML = head("Plantel", "Jogadores da equipa sénior e equipa técnica. Os jogadores marcados como destaque aparecem primeiro na página inicial.") + section("s-players") + section("s-staff");
    const GRUPOS = ["Guarda-redes", "Defesas", "Médios", "Avançados"];
    const POS = [["GR", "GR · Guarda-redes"], ["DD", "DD · Defesa-direito"], ["DE", "DE · Defesa-esquerdo"], ["DC", "DC · Defesa-central"], ["MDC", "MDC · Médio defensivo"], ["MC", "MC · Médio centro"], ["MCO", "MCO · Médio ofensivo"], ["ED", "ED · Extremo direito"], ["EE", "EE · Extremo esquerdo"], ["PL", "PL · Ponta de lança"]];
    const POS_GROUP = { GR: "Guarda-redes", DD: "Defesas", DE: "Defesas", DC: "Defesas", MDC: "Médios", MC: "Médios", MCO: "Médios", ED: "Avançados", EE: "Avançados", PL: "Avançados" };
    const POS_NAME = Object.fromEntries(POS.map(([k, l]) => [k, l.split(" · ")[1]]));
    collection({
      el: $("#s-players"), title: "Jogadores", newLabel: "Novo jogador",
      items: () => pl.jogadores,
      sort: (a, b) => GRUPOS.indexOf(a.grupo) - GRUPOS.indexOf(b.grupo) || a.numero - b.numero,
      columns: [
        { l: "", v: (p) => `<img class="thumb" style="width:34px;height:40px" src="${esc(imgSrc(p.foto))}" alt="">` },
        { l: "N.º", v: (p) => `<strong>${p.numero}</strong>` },
        { l: "Nome", v: (p) => `<strong>${esc(p.nome)}</strong>${p.capitao ? " (C)" : ""}` },
        { l: "Posição", v: (p) => `${esc(p.posicao)} <span class="muted">· ${esc(p.grupo)}</span>` },
        { l: "J / G / A", v: (p) => `${p.jogos ?? 0} / ${p.golos ?? 0} / ${p.assistencias ?? 0}` },
        { l: "", v: (p) => (p.destaque ? tag("Destaque", "blue") : "") },
      ],
      label: (p) => p.nome,
      fields: [
        { k: "nome", l: "Nome", req: true },
        { k: "numero", l: "Número da camisola", t: "number", min: 1, req: true },
        { k: "posicao", l: "Posição", t: "select", opts: POS, req: true, hint: "O grupo e a função são preenchidos automaticamente" },
        { k: "nacionalidade", l: "Nacionalidade (código)", req: true, max: 2, hint: "PT, BR, CV, AO…" },
        { k: "nascimento", l: "Data de nascimento", t: "date" },
        { k: "altura", l: "Altura (cm)", t: "nullnum", min: 100 },
        { k: "pe", l: "Pé preferido", t: "select", opts: ["Direito", "Esquerdo", "Ambos"] },
        { k: "foto", l: "Foto (retrato, vertical)", t: "image", pasta: "plantel", full: true },
        { k: "jogos", l: "Jogos", t: "number", min: 0 },
        { k: "golos", l: "Golos", t: "number", min: 0 },
        { k: "assistencias", l: "Assistências", t: "number", min: 0 },
        { k: "destaque", l: "Destaque na página inicial", t: "checkbox", omit: true },
        { k: "capitao", l: "Capitão", t: "checkbox", omit: true },
      ],
      blank: () => ({ nome: "", numero: "", posicao: "", nacionalidade: "PT", jogos: 0, golos: 0, assistencias: 0, foto: "" }),
      beforeSave: (o, isNewItem, all, orig) => {
        const clash = all.find((p) => p !== orig && p.numero === o.numero);
        if (clash) throw new Error(`O número ${o.numero} já é do ${clash.nome}.`);
        if (isNewItem) o.id = uniqueId(slug(o.nome), all);
        o.grupo = POS_GROUP[o.posicao] || "Médios";
        o.funcao = POS_NAME[o.posicao] || o.posicao;
        o.nacionalidade = (o.nacionalidade || "PT").toUpperCase();
        if (!o.foto) o.foto = null;
        return o;
      },
      save: (list) => { pl.jogadores = list; return api.save("plantel", pl); },
    });
    collection({
      el: $("#s-staff"), title: "Equipa técnica", newLabel: "Adicionar",
      items: () => pl.equipaTecnica || [],
      columns: [{ l: "Função", v: (s) => `<strong>${esc(s.funcao)}</strong>` }, { l: "Nome", v: (s) => esc(s.nome) }],
      label: (s) => s.funcao,
      fields: [{ k: "funcao", l: "Função", req: true }, { k: "nome", l: "Nome", req: true }],
      blank: () => ({ funcao: "", nome: "" }),
      save: (list) => { pl.equipaTecnica = list; return api.save("plantel", pl); },
    });
  }

  /* ---------- LOJA ---------- */
  async function viewLoja(main) {
    await api.get("produtos");
    main.innerHTML = head("Loja", "Produtos, preços e fotos. Os produtos em destaque aparecem na página inicial (os três primeiros).") + section("s-prod");
    collection({
      el: $("#s-prod"), title: "Produtos", newLabel: "Novo produto",
      items: () => store.produtos,
      columns: [
        { l: "", v: (p) => `<img class="thumb" src="${esc(imgSrc(p.imagem))}" alt="">` },
        { l: "Produto", v: (p) => `<strong>${esc(p.nome)}</strong>${p.etiqueta ? " " + tag(p.etiqueta, "blue") : ""}` },
        { l: "Categoria", v: (p) => esc(p.categoria) },
        { l: "Preço", v: (p) => `<strong>${euro(p.preco)}</strong>${p.precoAntigo ? ` <s class="muted">${euro(p.precoAntigo)}</s>` : ""}` },
        { l: "Tamanhos", v: (p) => `<span class="muted">${esc((p.tamanhos || []).join(", ") || "—")}</span>` },
        { l: "", v: (p) => (p.destaque ? tag("Destaque", "blue") : "") },
      ],
      label: (p) => p.nome,
      fields: [
        { k: "nome", l: "Nome", req: true, full: true },
        { k: "categoria", l: "Categoria", req: true, list: () => [...new Set(store.produtos.map((p) => p.categoria))] },
        { k: "preco", l: "Preço (€)", t: "number", step: "0.01", min: 0, req: true },
        { k: "precoAntigo", l: "Preço antigo (€), para promoções", t: "nullnum", step: "0.01", min: 0, omit: true },
        { k: "etiqueta", l: "Etiqueta", omit: true, hint: "Ex.: Novo, Promoção" },
        { k: "imagem", l: "Imagem", t: "image", pasta: "loja", req: true, full: true },
        { k: "tamanhos", l: "Tamanhos", t: "list", omit: true, full: true, hint: "Separados por vírgulas, ex.: S, M, L, XL. Vazio = tamanho único" },
        { k: "destaque", l: "Destaque na página inicial", t: "checkbox", omit: true, full: true },
      ],
      blank: () => ({ nome: "", categoria: "", preco: "", imagem: "" }),
      beforeSave: (o, isNewItem, all) => { if (isNewItem) o.id = uniqueId(slug(o.nome), all); return o; },
      save: (list) => api.save("produtos", list),
    });
  }

  /* ---------- CLUBE ---------- */
  async function viewClube(main) {
    const c = await api.get("clube");
    main.innerHTML = head("Clube", "Contactos, redes sociais, preços dos bilhetes, quotas de sócio, direção e escalões.") + section("s-info") + section("s-tix") + section("s-quotas") + section("s-board") + section("s-levels");
    const info = [
      { k: "nome", l: "Nome do clube", req: true },
      { k: "local", l: "Localidade", req: true },
      { k: "estadio", l: "Estádio / complexo", req: true, full: true },
      { k: "morada", l: "Morada", req: true, full: true },
      { k: "email", l: "Email", t: "email", req: true },
      { k: "telefone", l: "Telefone", req: true },
      { k: "horario", l: "Horário da secretaria", full: true },
      { k: "mapsQuery", l: "Pesquisa no Google Maps", full: true, hint: "O texto que, no Google Maps, encontra o complexo. Usado no mapa e no botão Ver direções" },
      { k: "redes.facebook", l: "Facebook (link)" },
      { k: "redes.instagram", l: "Instagram (link)" },
      { k: "redes.youtube", l: "YouTube (link)" },
      { k: "redes.x", l: "X / Twitter (link)" },
    ];
    $("#s-info").innerHTML = `<h2>Informação geral</h2><form class="panel a-form" style="padding:16px" id="info-form" novalidate><div class="a-grid">${info.map((f) => fieldHtml(f, getPath(c, f.k))).join("")}</div><div class="a-form__foot" style="margin-top:12px;padding-top:12px"><button class="btn btn--primary btn--sm" type="submit">Guardar</button></div></form>`;
    $("#info-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const { obj, errors } = readForm(e.target, info, c);
      if (errors.length) { toast("Preenche corretamente: " + errors.join(", "), true); return; }
      run(() => { Object.assign(c, obj); return api.save("clube", c); });
    });
    const saveClube = (key) => (list) => { c[key] = list; return api.save("clube", c); };

    collection({
      el: $("#s-tix"), title: "Preços dos bilhetes", newLabel: "Novo tipo",
      items: () => c.bilhetes || [],
      columns: [{ l: "Tipo", v: (b) => `<strong>${esc(b.nome)}</strong>` }, { l: "Preço", v: (b) => (b.preco ? euro(b.preco) : "Grátis") }],
      label: (b) => b.nome,
      fields: [{ k: "nome", l: "Nome", req: true }, { k: "preco", l: "Preço (€), 0 = grátis", t: "number", step: "0.01", min: 0 }],
      blank: () => ({ nome: "", preco: 0 }),
      beforeSave: (o, isNewItem, all) => { if (isNewItem) o.tipo = uniqueId(slug(o.nome).slice(0, 20), all, "tipo"); return o; },
      save: saveClube("bilhetes"),
    });
    collection({
      el: $("#s-quotas"), title: "Quotas de sócio", newLabel: "Nova quota",
      items: () => c.quotas || [],
      columns: [{ l: "Quota", v: (q) => `<strong>${esc(q.nome)}</strong>${q.destaque ? " " + tag("Destaque", "blue") : ""}` }, { l: "Preço", v: (q) => `${euro(q.preco)} / ${esc(q.periodo)}` }, { l: "Para quem", v: (q) => `<span class="muted">${esc(q.descricao)}</span>` }],
      label: (q) => q.nome,
      fields: [
        { k: "nome", l: "Nome", req: true },
        { k: "descricao", l: "Para quem", req: true },
        { k: "preco", l: "Preço (€)", t: "number", step: "0.01", min: 0, req: true },
        { k: "periodo", l: "Período", t: "select", opts: ["mês", "trimestre", "ano"], req: true },
        { k: "vantagens", l: "Vantagens", t: "lines", full: true, hint: "Uma por linha" },
        { k: "destaque", l: "Quota em destaque (\"Mais escolhida\")", t: "checkbox", omit: true, full: true },
      ],
      blank: () => ({ nome: "", descricao: "", preco: "", periodo: "mês", vantagens: [] }),
      beforeSave: (o, isNewItem, all) => { if (isNewItem) o.id = uniqueId(slug(o.nome.replace(/^sócio\s+/i, "")), all); return o; },
      save: saveClube("quotas"),
    });
    collection({
      el: $("#s-board"), title: "Direção", newLabel: "Adicionar",
      items: () => c.direcao || [],
      columns: [{ l: "Cargo", v: (d) => `<strong>${esc(d.cargo)}</strong>` }, { l: "Nome", v: (d) => esc(d.nome) }],
      label: (d) => d.cargo,
      fields: [{ k: "cargo", l: "Cargo", req: true }, { k: "nome", l: "Nome", req: true }],
      blank: () => ({ cargo: "", nome: "" }),
      save: saveClube("direcao"),
    });
    collection({
      el: $("#s-levels"), title: "Escalões", newLabel: "Adicionar",
      help: "Usados na página Clube e como opções de escalão nos jogos.",
      items: () => c.escaloes || [],
      columns: [{ l: "Escalão", v: (d) => `<strong>${esc(d.nome)}</strong>` }, { l: "Idades", v: (d) => esc(d.idades) }],
      label: (d) => d.nome,
      fields: [{ k: "nome", l: "Escalão", req: true }, { k: "idades", l: "Idades", req: true }],
      blank: () => ({ nome: "", idades: "" }),
      save: saveClube("escaloes"),
    });
  }

  /* ---------- SÓCIOS ---------- */
  async function viewSocios(main) {
    const [, clube] = await Promise.all([api.get("socios"), api.get("clube")]);
    let q = "";
    main.innerHTML = head("Sócios", "A lista de sócios e até quando têm as quotas pagas. É esta lista que a Zona do sócio do site consulta (número + email). Estes dados são privados e nunca aparecem no site.") + section("s-soc");
    const emDia = (s) => s.quotaPagaAte && s.quotaPagaAte >= today();
    const c = collection({
      el: $("#s-soc"), title: "Sócios", newLabel: "Novo sócio",
      toolbar: `<div class="toolbar" style="margin-bottom:10px"><input class="input" id="soc-q" type="search" placeholder="Procurar por nome, número ou email" style="max-width:320px;min-height:36px"></div>`,
      items: () => store.socios,
      filter: (s) => !q || norm(`${s.numero} ${s.nome} ${s.email}`).includes(q),
      sort: (a, b) => a.numero - b.numero,
      rowClass: (s) => (emDia(s) ? "" : "is-warn"),
      columns: [
        { l: "N.º", v: (s) => `<strong>${s.numero}</strong>` },
        { l: "Nome", v: (s) => esc(s.nome) },
        { l: "Email", v: (s) => `<span class="muted">${esc(s.email)}</span>` },
        { l: "Quota", v: (s) => esc(s.quota) },
        { l: "Paga até", v: (s) => `${fmtDate(s.quotaPagaAte)} ${emDia(s) ? tag("Em dia", "win") : tag("Em atraso", "loss")}` },
      ],
      label: (s) => `${s.numero} · ${s.nome}`,
      fields: [
        { k: "numero", l: "Número de sócio", t: "number", min: 1, req: true },
        { k: "nome", l: "Nome completo", req: true },
        { k: "email", l: "Email", t: "email", req: true },
        { k: "telefone", l: "Telefone", omit: true },
        { k: "quota", l: "Quota", t: "select", opts: (clube.quotas || []).map((x) => x.nome), req: true },
        { k: "quotaPagaAte", l: "Quotas pagas até", t: "date", req: true },
        { k: "notas", l: "Notas internas", t: "textarea", rows: 2, omit: true, full: true },
      ],
      blank: () => ({ numero: Math.max(1000, ...store.socios.map((s) => +s.numero || 0)) + 1, nome: "", email: "", quota: clube.quotas?.[0]?.nome || "", quotaPagaAte: today() }),
      beforeSave: (o, isNewItem, all, orig) => {
        if (all.some((s) => s !== orig && +s.numero === +o.numero)) throw new Error(`O número ${o.numero} já está atribuído.`);
        o.email = o.email.toLowerCase();
        return o;
      },
      save: (list) => api.save("socios", list),
    });
    $("#s-soc").addEventListener("input", (e) => { if (e.target.id === "soc-q") { q = norm(e.target.value); const pos = e.target.selectionStart; c.redraw(); const i = $("#soc-q"); i.value = e.target.value; i.focus(); i.setSelectionRange(pos, pos); } });
  }

  /* ---------- PEDIDOS ---------- */
  const PEDIDOS = {
    encomendas: { l: "Encomendas", resumo: (r) => `${(r.itens || []).map((i) => `${i.quantidade}× ${i.produto}${i.tamanho ? ` (${i.tamanho})` : ""}`).join(", ")} · <strong>${euro(r.total)}</strong>` },
    bilhetes: { l: "Bilhetes", resumo: (r) => `${r.quantidade}× ${esc(r.tipo)} · ${esc(r.descricao)} · <strong>${euro(r.total)}</strong>` },
    adesoes: { l: "Inscrições de sócio", resumo: (r) => `${esc(r.quota)} · ${esc(r.telefone)}` },
    contactos: { l: "Mensagens", resumo: (r) => `${tag(r.assunto)} ${esc((r.mensagem || "").slice(0, 70))}${(r.mensagem || "").length > 70 ? "…" : ""}` },
  };
  async function viewPedidos(main, sub = "encomendas") {
    if (!PEDIDOS[sub]) sub = "encomendas";
    await Promise.all(Object.keys(PEDIDOS).map(api.get));
    main.innerHTML = head("Pedidos recebidos", "O que chega pelos formulários do site. Marca como tratado quando já respondeste ou entregaste.") + `
      <div class="chips" style="margin-bottom:16px">${Object.entries(PEDIDOS).map(([k, p]) => `<button class="chip" type="button" data-sub="${k}" aria-pressed="${k === sub}">${p.l} (${store[k].filter(isNew).length})</button>`).join("")}</div>` + section("s-ped");
    $$("[data-sub]", main).forEach((b) => b.addEventListener("click", () => (location.hash = "pedidos/" + b.dataset.sub)));
    const cfg = PEDIDOS[sub];
    collection({
      el: $("#s-ped"), title: cfg.l,
      empty: "Ainda não chegou nenhum pedido.",
      items: () => store[sub],
      sort: (a, b) => (isNew(b) - isNew(a)) || String(b.data).localeCompare(String(a.data)),
      rowClass: (r) => (r.tratado ? "is-done" : ""),
      columns: [
        { l: "Recebido", v: (r) => fmtDateTime(r.data) },
        { l: "Ref.", v: (r) => `<span class="muted">${esc(r.referencia)}</span>` },
        { l: "Nome", v: (r) => `<strong>${esc(r.nome)}</strong><br><span class="muted">${esc(r.email)}</span>` },
        { l: "Pedido", v: cfg.resumo },
        { l: "Estado", v: (r) => (r.tratado ? tag("Tratado", "win") : tag("Novo", "draw")) },
      ],
      label: (r) => `${r.referencia} · ${r.nome}`,
      extra: (r, i) => `
        <button class="a-icon" type="button" data-view="${i}" title="Ver tudo" aria-label="Ver tudo">${icon("eye")}</button>
        ${sub === "adesoes" && !r.socioCriado ? `<button class="a-icon" type="button" data-mksocio="${i}" title="Criar sócio a partir desta inscrição" aria-label="Criar sócio">${icon("user")}</button>` : ""}
        <button class="a-icon" type="button" data-toggle="${i}" title="${r.tratado ? "Marcar como novo" : "Marcar como tratado"}" aria-label="${r.tratado ? "Marcar como novo" : "Marcar como tratado"}">${icon(r.tratado ? "undo" : "check")}</button>`,
      save: (list) => api.save(sub, list),
    });
    const redraw = () => viewPedidos(main, sub);
    $("#s-ped").addEventListener("click", (e) => {
      const list = store[sub];
      const v = e.target.closest("[data-view]");
      if (v) {
        const r = list[+v.dataset.view];
        const rows = Object.entries(r).filter(([k]) => !["tratado", "socioCriado"].includes(k)).map(([k, val]) => {
          let out = val;
          if (k === "itens") out = val.map((i) => `${i.quantidade}× ${i.produto}${i.tamanho ? ` (${i.tamanho})` : ""} — ${euro(i.preco * i.quantidade)}`).join("\n");
          else if (k === "total") out = euro(val);
          else if (k === "data") out = fmtDateTime(val);
          return `<dt>${esc(k[0].toUpperCase() + k.slice(1))}</dt><dd>${esc(out)}</dd>`;
        }).join("");
        openModal(`<div class="a-form"><button class="icon-btn dialog-close" type="button" data-close aria-label="Fechar">${icon("close")}</button><h2>${esc(r.referencia)}</h2><dl class="details">${rows}</dl>
          <div class="a-form__foot">${r.email ? `<a class="btn btn--soft btn--sm" href="mailto:${esc(r.email)}?subject=${encodeURIComponent("Desportivo de Canelas FC · " + r.referencia)}">Responder por email</a>` : ""}<button class="btn btn--ghost btn--sm" type="button" data-close>Fechar</button></div></div>`);
      }
      const t = e.target.closest("[data-toggle]");
      if (t) run(async () => { const r = list[+t.dataset.toggle]; r.tratado = !r.tratado; await api.save(sub, list, r.tratado ? "Marcado como tratado" : "Marcado como novo"); redraw(); });
      const m = e.target.closest("[data-mksocio]");
      if (m) run(async () => {
        const r = list[+m.dataset.mksocio];
        const socios = await api.get("socios");
        const numero = Math.max(1000, ...socios.map((s) => +s.numero || 0)) + 1;
        if (!confirm(`Criar o sócio n.º ${numero} para ${r.nome}? Depois podes ajustar a data de pagamento em Sócios.`)) return;
        socios.push({ numero, nome: r.nome, email: (r.email || "").toLowerCase(), telefone: r.telefone, quota: r.quota, quotaPagaAte: today() });
        await api.save("socios", socios, `Sócio n.º ${numero} criado`);
        r.socioCriado = numero; r.tratado = true;
        await api.save(sub, list, `Sócio n.º ${numero} criado`);
        redraw();
      });
    });
  }

  /* =====================================================================
     NAVEGAÇÃO
     ===================================================================== */
  const VIEWS = [
    { id: "painel", l: "Painel", i: "home", fn: viewPainel },
    { id: "jogos", l: "Jogos", i: "calendar", fn: viewJogos },
    { id: "classificacao", l: "Classificação", i: "trophy", fn: viewClassificacao },
    { id: "noticias", l: "Notícias", i: "news", fn: viewNoticias },
    { id: "plantel", l: "Plantel", i: "users", fn: viewPlantel },
    { id: "loja", l: "Loja", i: "cart", fn: viewLoja },
    { id: "clube", l: "Clube", i: "shield", fn: viewClube },
    { id: "socios", l: "Sócios", i: "card", fn: viewSocios },
    { id: "pedidos", l: "Pedidos", i: "inbox", fn: viewPedidos },
  ];
  $("#admin-nav").innerHTML = VIEWS.map((v) => `<button type="button" data-view-id="${v.id}">${icon(v.i)}<span>${v.l}</span><span class="badge" data-badge="${v.id}" hidden></span></button>`).join("");
  $("#admin-nav").addEventListener("click", (e) => { const b = e.target.closest("[data-view-id]"); if (b) location.hash = b.dataset.viewId; });

  async function updateBadges() {
    const set = (id, n) => { const b = $(`[data-badge="${id}"]`); if (!b) return; b.hidden = !n; b.textContent = n; };
    if (store.jogos) set("jogos", store.jogos.jogos.filter(isPending).length);
    const peds = Object.keys(PEDIDOS).filter((k) => store[k]);
    if (peds.length) set("pedidos", peds.reduce((s, k) => s + store[k].filter(isNew).length, 0));
  }

  async function route() {
    const [id, sub] = (location.hash.slice(1) || "painel").split("/");
    const view = VIEWS.find((v) => v.id === id) || VIEWS[0];
    $$("#admin-nav [data-view-id]").forEach((b) => { if (b.dataset.viewId === view.id) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    const old = $("#admin-main");
    const main = old.cloneNode(false); // remove eventos antigos
    old.replaceWith(main);
    main.innerHTML = `<div class="skeleton" style="min-height:300px"></div>`;
    document.title = `${view.l} · Administração`;
    await run(() => view.fn(main, sub));
    if (!main.querySelector(".admin-head")) main.innerHTML = `<div class="notice notice--warn">Não foi possível abrir esta secção. Atualiza a página e tenta de novo.</div>`;
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    updateBadges();
  }
  window.addEventListener("hashchange", route);
  Promise.all(["jogos", ...Object.keys(PEDIDOS)].map((n) => api.get(n).catch(() => null))).then(updateBadges);
  route();
})();
