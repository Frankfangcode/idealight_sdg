(async function () {
  'use strict';
  const main=document.querySelector('#main');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let results;
  try {results=await CK.results();} catch(e){
    main.innerHTML=`<h1>調查成果尚未開放</h1><p>${esc(e.message)}</p><div class="actions"><a class="btn btn--primary" href="game.html">回到目前進度</a><button class="btn btn--ghost" id="retry">重新載入</button></div>`;
    document.querySelector('#retry').onclick=()=>location.reload();return;
  }
  const names=Object.fromEntries(results.characters.map(c=>[c.char_key,c.name]));
  main.innerHTML=`<section class="detective-card" aria-label="偵探等級圖卡">
    <svg class="badge-mark" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M48 5 78 17v29c0 19-14 34-30 44-16-10-30-25-30-44V17Z"/><circle cx="45" cy="40" r="14"/><path d="m55 50 15 15M39 40h12M45 34v12"/></svg>
    <p>案件調查完成</p><h1>${esc(results.rank)}</h1>
    <p class="result-score">${results.score} / ${results.maxScore}</p>
    <p>證詞分類得分</p><p class="small muted">謝謝你完成六關調查與後測問卷。推理理由的評語保留在下方各關解析中。</p>
  </section>
  <section class="stack stack--lg"><h2>回顧你的調查</h2><p class="muted">展開各關，查看分類結果與推理評語。</p>
  ${results.levels.map(l=>`<details class="result-level" data-level="${l.no}"><summary>第 ${l.no} 關｜${esc(l.name)}　${l.score}/6</summary><div class="result-feedback" role="region" aria-label="第 ${l.no} 關解析"><p role="status">正在取得解析…</p></div></details>`).join('')}</section>
  <section class="result-story stack stack--lg"><h2>${esc(results.truth.headline)}</h2><p>${esc(results.truth.body)}</p>
  ${results.truth.points.map(p=>`<details class="result-level"><summary>${esc(p.q)}</summary><p>${esc(p.a)}</p></details>`).join('')}
  <h2>${esc(results.debrief.title)}</h2>${results.debrief.items.map(t=>`<p>${esc(t)}</p>`).join('')}<p>${esc(results.debrief.closing)}</p></section>
  <footer class="result-footer"><p>你已完成本次實驗，可以關閉這個頁面。</p></footer>`;
  async function load(detail) {
    if(detail.dataset.loaded || detail.dataset.loading)return;
    detail.dataset.loading='true';const box=detail.querySelector('.result-feedback');
    try {
      const f=await CK.feedback(Number(detail.dataset.level));
      if(!f.detailed)throw new Error('解析尚未開放，請確認已完成後測問卷。');
      box.innerHTML=`<h3>你的推理評語</h3><p>${esc(f.ai||'AI 評語暫時無法取得，你的作答已保存。')}</p>
      ${Object.entries(f.testimonies).map(([k,t])=>`<div class="fbitem"><h3>${esc(names[k])} · ${f.evidence[k]?.isCorrect?'分類正確':'需要修正'}</h3><p>你的分類：${({reasonable:'合理說法',flaw:'破綻證據牆',unclassified:'未分類'})[f.evidence[k]?.zone]||'未分類'}；參考分類：${t.correct==='reasonable'?'合理說法':'破綻證據牆'}</p><p>${esc(t.criterion)}</p><p>可以追問：${esc(t.followup)}</p></div>`).join('')}
      <p>${esc(f.conclusion)}</p>${f.aiFailed?'<button class="btn btn--ghost" data-retry>重試取得推理評語</button>':''}`;
      detail.dataset.loaded='true';
    }catch(e){box.innerHTML=`<p>${esc(e.message)}</p><button class="btn btn--ghost" data-retry>重試載入解析</button>`;}
    finally {delete detail.dataset.loading;}
    box.querySelector('[data-retry]')?.addEventListener('click',()=>{delete detail.dataset.loaded;load(detail);});
  }
  document.querySelectorAll('.result-level[data-level]').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)load(d);}));
})();
