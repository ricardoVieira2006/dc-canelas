/* Página Sócios: quotas (data/clube.json), adesão (php/socios.php) e Zona do sócio (consulta) */
document.addEventListener("DOMContentLoaded", async () => {
  const { $, esc, euro, load, icon, bindForm, fmtShort } = FCT;
  const club = await load("clube").catch(() => null);
  if (club) {
    $("#plans").innerHTML = club.quotas.map((q) => `
      <article class="plan ${q.destaque ? "plan--featured" : ""}">
        ${q.destaque ? `<span class="tag tag--blue">Mais escolhida</span>` : ""}
        <h3>${esc(q.nome)}</h3>
        <span style="color:var(--text-muted);font-size:var(--fs-sm)">${esc(q.descricao)}</span>
        <div class="plan__price">${euro(q.preco)}<small> / ${esc(q.periodo)}</small></div>
        <ul>${q.vantagens.map((v) => `<li>${icon("check")}${esc(v)}</li>`).join("")}</ul>
        <a class="btn ${q.destaque ? "btn--primary" : "btn--soft"}" href="#adesao" data-quota="${esc(q.id)}">Escolher ${esc(q.nome.replace("Sócio ", ""))}</a>
      </article>`).join("");
    $("#s-quota").innerHTML = club.quotas.map((q) => `<option value="${esc(q.id)}" ${q.destaque ? "selected" : ""}>${esc(q.nome)} · ${euro(q.preco)}/${esc(q.periodo)}</option>`).join("");
    document.addEventListener("click", (e) => { const a = e.target.closest("[data-quota]"); if (a) $("#s-quota").value = a.dataset.quota; });
  }

  bindForm($("#join-form"), {
    endpoint: "php/socios.php?acao=adesao",
    successMsg: (r) => `Inscrição recebida (referência ${r.referencia}). Vamos contactar-te para concluir a adesão e entregar o cartão de sócio.`,
  });

  bindForm($("#zone-form"), {
    endpoint: "php/socios.php?acao=consulta",
    successMsg: (r) => r.demo ? "Consulta registada." : `Olá, ${r.socio.nome}.`,
    onError: () => { $("#zone-result").innerHTML = ""; },
    onSuccess: (r) => {
      if (r.demo || !r.socio) {
        $("#zone-result").innerHTML = `<div class="empty" style="margin-top:14px">A consulta de quotas precisa do servidor PHP. Num servidor, experimenta o sócio de exemplo n.º 1001 com o email socio@exemplo.pt.</div>`;
        return;
      }
      const s = r.socio, ok = s.quotaPagaAte >= new Date().toISOString().slice(0, 10);
      $("#zone-result").innerHTML = `
        <div class="ticket-match" style="margin-top:16px">
          <div><div class="ticket-match__vs">Sócio n.º ${esc(s.numero)} · ${esc(s.quota)}</div>
          <small>Quotas pagas até ${esc(fmtShort(s.quotaPagaAte))}</small></div>
          <span class="tag ${ok ? "tag--win" : "tag--loss"}" style="margin-left:auto">${ok ? "Em dia" : "Em atraso"}</span>
        </div>`;
    },
  });
  if (location.hash === "#zona") setTimeout(() => $("#z-num").focus({ preventScroll: true }), 300);
});
