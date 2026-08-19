/* ==========================================================================
   消失的月蝕巧克力莓果千層蛋糕 — 遊戲邏輯（正式版）

   移植自 demo/js/app.js。視圖函式原樣保留，改掉的是資料與流程控制：

     劇本與設定  由 api.js 從 ck_state.php 取得，不再寫死在前端
     正解        留在伺服器，回饋階段才發放，且僅限實驗組
     進度        存在 ck_progress，重整／換裝置都能續跑
     訊問上限    由後端擋（唯一鍵 + 次數檢查），前端只是先行提示
     作答        每一步都寫進資料庫，不再只存 sessionStorage

   sessionStorage 只留純介面狀態（翻開了哪張卡、展開了哪一列、計時剩餘），
   掉了不影響資料完整性。
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- 常數 */

  const PHASES = ['video', 'testimony', 'interrogation', 'evidence', 'ranking', 'feedback'];

  const PHASE_META = {
    video: { label: '劇情影片', icon: '▶', eyebrow: 'PHASE 1 ／ VIDEO' },
    testimony: { label: '六人發言', icon: '❝', eyebrow: 'PHASE 2 ／ TESTIMONY' },
    interrogation: { label: '訊問', icon: '☰', eyebrow: 'PHASE 3 ／ INTERROGATION' },
    evidence: { label: '證據牆', icon: '▤', eyebrow: 'PHASE 4 ／ EVIDENCE REVIEW' },
    ranking: { label: '推理', icon: '◎', eyebrow: 'PHASE 5 ／ JUDGEMENT' },
    feedback: { label: '回饋', icon: '✦', eyebrow: 'PHASE 6 ／ FEEDBACK' },
  };

  const TAB_PHASES = ['video', 'testimony', 'interrogation', 'evidence'];
  /* 啟動時才知道有哪些角色，所以不能在載入階段就從 SCENARIO 取 */
  let KEYS = [];
  const STORAGE_KEY = 'ck-ui-state';

  /* ---------------------------------------------------------------- 狀態 */

  let state = null;
  let ticker = null;
  let dragKey = null;
  let feedbackData = null; // 本關的回饋內容（含正解），由伺服器在提交後發放
  let busy = false; // 送出中：擋掉重複點擊造成的重複提交

  function freshLevel() {
    return {
      videoWatched: false,
      read: {},
      collapsed: {}, // 讀過之後又翻回角色介紹的卡片；read 只加不減，進度不會倒退
      asked: {},
      attemptsUsed: 0,
      selected: null,
      pendingChoice: null,
      awaitingAnswer: false,
      placements: {},
      evidenceSubmitted: false,
      pick: null, // 說法最不合理的那一個人（單選）
      expanded: {},
      reason: '',
      rankingSubmitted: false,
      phaseIndex: 0,
      timeLeft: {},
      timedOut: {},
    };
  }

  function freshState() {
    return {
      screen: 'setup',
      levelIndex: 0,
      levels: SCENARIO.levels.map(freshLevel),
    };
  }

  /* 把伺服器的權威狀態蓋回本地：關卡、階段，以及這一關已經送出的作答。
     重整、換裝置、瀏覽器當掉後重開都走這條路還原。 */
  function applyServerState(s) {
    KEYS = SCENARIO.characters.map((c) => c.key);

    if (!state || state.levels.length !== SCENARIO.levels.length) {
      state = freshState();
    }

    state.levelIndex = Math.max(0, Math.min(s.progress.levelNo - 1, SCENARIO.levels.length - 1));
    const L = state.levels[state.levelIndex];

    if (s.progress.finished) {
      state.screen = 'truth';
      return;
    }

    const idx = PHASES.indexOf(s.progress.phase);
    L.phaseIndex = idx < 0 ? 0 : idx;

    /* 訊問紀錄：伺服器記的是問了誰與哪一題，回答內容一併帶回來 */
    L.asked = {};
    (s.asked || []).forEach((a) => {
      L.asked[a.char_key] = [{ q: a.q, a: a.a, detail: a.detail }];
    });
    L.attemptsUsed = Object.keys(L.asked).length;

    /* 證據牆：有紀錄就代表已提交並鎖定 */
    const placements = s.placements || {};
    if (Object.keys(placements).length) {
      L.placements = placements;
      L.evidenceSubmitted = true;
    }

    if (s.judgment) {
      L.pick = s.judgment.pick_char || null;
      L.reason = s.judgment.reason || '';
      L.rankingSubmitted = true;
    }

    /* 進度已經走到 video 之後，代表影片與六張卡都看過了 */
    if (L.phaseIndex >= 1) L.videoWatched = true;
    if (L.phaseIndex >= 2) KEYS.forEach((k) => (L.read[k] = true));

    state.screen = 'play';
  }

  /* 只存純介面狀態。作答與進度的權威在伺服器，這裡掉了也不影響資料。 */
  function save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ stuId: SERVER.stuId, levels: state.levels }));
    } catch (e) {
      /* 無痕模式或配額滿：忽略，重整時改由伺服器還原 */
    }
  }

  function loadUi() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      /* 換人登入時舊的介面狀態要丟掉，否則會看到別人翻開過的卡片 */
      if (!parsed || parsed.stuId !== SERVER.stuId) return null;
      if (!Array.isArray(parsed.levels) || parsed.levels.length !== SCENARIO.levels.length) return null;
      return parsed.levels;
    } catch (e) {
      return null;
    }
  }

  /* 送出前後統一處理載入中與錯誤，避免每個 handler 都寫一次 try/catch */
  async function guard(fn, failMsg) {
    if (busy) return false;
    busy = true;
    try {
      await fn();
      return true;
    } catch (e) {
      toast(`${failMsg}：${e.message}`, 'error');
      return false;
    } finally {
      busy = false;
    }
  }

  /* --------------------------------------------------------------- 取值 */

  const level = () => SCENARIO.levels[state.levelIndex];
  const lv = () => state.levels[state.levelIndex];
  const phase = () => PHASES[lv().phaseIndex];
  const charOf = (key) => SCENARIO.characters.find((c) => c.key === key);
  /* 組別由 students.`group` 決定並在 ck_runs 凍結，受試者不能自選。
     訊問回答的詳細度不再依組別變動 —— 那是 demo 為了展示四種組合而做的，
     現行設計只有「有無 AI 回饋」這一個操弄變項。 */
  const isDetailedAi = () => true;
  const hasAiFeedback = () => SERVER.hasAiFeedback;

  /* 發言只含文字，不含正解 —— correct / criterion 留在伺服器 */
  function testimonyOf(key) {
    const L = level();
    return (L.testimonies && L.testimonies[key]) || { text: '（發言載入失敗，請重新整理）' };
  }

  /* 問題只有題目，角色的回答要實際送出訊問後才由伺服器發放 */
  function questionsOf(key) {
    const L = level();
    return (L.questions && L.questions[key]) || [];
  }

  /* ---------------------------------------------------------------- 工具 */

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  function mmss(sec) {
    const m = Math.floor(Math.max(0, sec) / 60);
    const s = Math.max(0, sec) % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function toast(msg, kind) {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast';
    if (kind) el.dataset.kind = kind;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function avatar(key, size) {
    return `<span class="avatar${size ? ' avatar--' + size : ''}" data-key="${key}" aria-hidden="true">${key}</span>`;
  }

  /* 角色名字本身帶編號（一承、二寧…六禾），所以不再另外標字母 */
  function who(key) {
    const c = charOf(key);
    return `<span class="who">
      <span class="who__name">${esc(c.name)}</span>
      <span class="who__role">${esc(c.role)}</span>
    </span>`;
  }

  /* ------------------------------------------------------------- 計時器 */

  function phaseDuration(p) {
    return PHASE_SECONDS[p] || 0;
  }

  function ensureTimer() {
    const p = phase();
    const d = phaseDuration(p);
    if (!d) return;
    if (lv().timeLeft[p] === undefined) lv().timeLeft[p] = d;
  }

  function startTicker() {
    stopTicker();
    const p = phase();
    if (!phaseDuration(p)) return;
    ticker = setInterval(() => {
      const L = lv();
      if (L.timedOut[p] || L.timeLeft[p] === undefined) return stopTicker();
      L.timeLeft[p] -= 1;
      if (L.timeLeft[p] <= 0) {
        L.timeLeft[p] = 0;
        L.timedOut[p] = true;
        stopTicker();
        onTimeout(p);
        return;
      }
      paintTimer();
      if (L.timeLeft[p] % 5 === 0) save();
    }, 1000);
  }

  function stopTicker() {
    if (ticker) clearInterval(ticker);
    ticker = null;
  }

  function paintTimer() {
    const node = $('#timer');
    if (!node) return;
    const p = phase();
    const total = phaseDuration(p);
    const left = lv().timeLeft[p] ?? total;
    node.querySelector('.timer__text').textContent = mmss(left);
    node.querySelector('.timer__fill').style.width = `${(left / total) * 100}%`;
    node.dataset.state = left <= 10 ? 'danger' : left <= 30 ? 'warn' : 'ok';
  }

  /* 計時到期一律強制送出當下的作答。
     後端對 timedOut 的提交放寬檢查（可以沒分類完、沒選人、理由不足字數），
     否則受試者一逾時就整關掉資料。 */
  async function onTimeout(p) {
    const L = lv();
    if (p === 'interrogation') {
      toast('訊問時間已到，不能夠再問', 'warn');
      render();
      return;
    }

    if (p === 'evidence') {
      toast('選取時間已到，分類結果已鎖定', 'warn');
      await guard(async () => {
        await CK.submitEvidence(level().no, L.placements, true);
        L.evidenceSubmitted = true;
      }, '分類保存失敗');
      await goPhase('ranking');
      return;
    }

    if (p === 'ranking') {
      toast('作答時間已到，系統保留當下的選擇與文字', 'warn');
      syncReason();
      await guard(async () => {
        await CK.submitJudgment(level().no, L.pick || '', L.reason || '', true);
        L.rankingSubmitted = true;
      }, '作答保存失敗');
      await goPhase('feedback');
    }
  }

  /* ------------------------------------------------------------- 流程 */

  /* 階段推進同步寫進 ck_progress。後端只允許往前，且只能操作當前關卡。 */
  async function goPhase(p) {
    const idx = PHASES.indexOf(p);
    if (idx < 0) return;

    const L = lv();
    if (idx > L.phaseIndex) {
      const ok = await guard(() => CK.advance(level().no, p), '進度保存失敗');
      if (!ok) return;
    }

    L.phaseIndex = idx;
    ensureTimer();
    save();
    render();
  }

  async function nextLevel() {
    closeModal();
    feedbackData = null;

    const ok = await guard(async () => {
      const r = await CK.nextLevel(level().no);
      if (r.finished) {
        await CK.loadTruth();
        state.screen = 'truth';
      } else {
        await CK.refresh();
        state.levelIndex = r.levelNo - 1;
        state.levels[state.levelIndex] = freshLevel();
        KEYS = SCENARIO.characters.map((c) => c.key);
      }
    }, '進入下一關失敗');

    if (!ok) return;
    ensureTimer();
    save();
    render();
  }

  /* --------------------------------------------------------- 上方列渲染 */

  function renderTopbar() {
    $('#brandTitle').textContent = SCENARIO.title;
    const allDone = state.screen === 'truth' || state.screen === 'debrief';
    const dots = SCENARIO.levels
      .map((L, i) => {
        const st = allDone ? 'done' : i < state.levelIndex ? 'done' : i === state.levelIndex ? 'current' : 'todo';
        const sep = i > 0 ? '<span class="levels__sep"></span>' : '';
        return `${sep}<span class="levels__dot" data-state="${st}" title="第 ${L.no} 關｜${esc(L.name)}">${L.no}</span>`;
      })
      .join('');
    $('#levels').innerHTML = state.screen === 'setup' ? '' : dots;

    const right = $('#topbarRight');
    if (state.screen !== 'play') {
      right.innerHTML = '';
      return;
    }
    const p = phase();
    const total = phaseDuration(p);
    const showTimer = total > 0 && !lv().timedOut[p];
    right.innerHTML = `
      <span class="badge badge--phase">${PHASE_META[p].label}</span>
      ${
        showTimer
          ? `<span class="timer" id="timer" data-state="ok" role="timer" aria-label="本階段剩餘時間">
               <span class="timer__text">${mmss(lv().timeLeft[p] ?? total)}</span>
               <span class="timer__bar"><span class="timer__fill" style="width:${
                 ((lv().timeLeft[p] ?? total) / total) * 100
               }%"></span></span>
             </span>`
          : total > 0
          ? '<span class="badge">時間已到</span>'
          : ''
      }
    `;
  }

  function renderTabbar() {
    const bar = $('#tabbar');
    if (state.screen !== 'play' || !TAB_PHASES.includes(phase())) {
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    const current = phase();
    const reached = lv().phaseIndex;
    bar.innerHTML = TAB_PHASES.map((p) => {
      const i = PHASES.indexOf(p);
      const disabled = i > reached;
      return `<button class="tab" data-action="tab" data-phase="${p}"
        ${current === p ? 'aria-current="page"' : ''} ${disabled ? 'disabled' : ''}>
        <span class="tab__icon" aria-hidden="true">${PHASE_META[p].icon}</span>
        <span>${PHASE_META[p].label}</span>
      </button>`;
    }).join('');
  }

  /* ----------------------------------------------------------- 畫面渲染 */

  function render() {
    renderTopbar();
    renderTabbar();
    const main = $('#main');

    if (state.screen === 'setup') {
      main.className = 'main';
      main.innerHTML = viewSetup();
    } else if (state.screen === 'truth') {
      main.className = 'main';
      main.innerHTML = viewTruth();
    } else if (state.screen === 'debrief') {
      main.className = 'main';
      main.innerHTML = viewDebrief();
    } else {
      main.className = 'main main--wide';
      main.innerHTML = viewPhase();
      if (phase() === 'feedback') openFeedback();
    }

    stopTicker();
    if (state.screen === 'play' && phaseDuration(phase()) && !lv().timedOut[phase()]) startTicker();

  }

  /* == 開場 == */

  function viewSetup() {
    const roster = SCENARIO.characters
      .map((c) => `<div class="roster__item">${avatar(c.key)}${who(c.key)}</div>`)
      .join('');

    return `
      <div class="setup">
        <section class="hero">
          <span class="hero__eyebrow">CASE FILE</span>
          <h1 class="hero__title">${esc(SCENARIO.title)}</h1>
          <p class="hero__sub">${esc(SCENARIO.subtitle)}</p>
          <p class="hero__lead">${esc(SCENARIO.brief.lead)}</p>
          <p class="hero__body">${esc(SCENARIO.brief.body)}</p>
          <p class="hero__q">${esc(SCENARIO.brief.question)}</p>
          <div class="roster">${roster}</div>
        </section>

        <aside class="panel">
          <div class="panel__head"><h2 class="panel__title">開始之前</h2></div>
          <div class="panel__body stack stack--lg">
            <div class="field">
              <span class="field__label">調查流程</span>
              <ul class="checklist">
                <li><span>六個關卡，每一關都是同一個案子的不同面向</span></li>
                <li><span>每關依序是：劇情影片 → 六人發言 → 訊問 → 證據牆 → 推理</span></li>
                <li><span>訊問、證據牆、推理三個階段有時間限制，時間到會自動保存當下的作答</span></li>
                <li><span>每關只能訊問 ${MAX_INTERROGATIONS} 個人，而且不能重複問同一個人</span></li>
              </ul>
            </div>

            <div class="note">
              <span>作答會即時保存。中途關掉瀏覽器或不小心重新整理，
              重新登入後會回到你離開的地方，不用從頭開始。</span>
            </div>

            <button class="btn btn--primary btn--lg btn--block" data-action="start">開始調查</button>
          </div>
        </aside>
      </div>
    `;
  }

  /* == 階段外殼 == */

  function viewPhase() {
    const p = phase();
    const L = level();
    const body =
      p === 'video'
        ? viewVideo()
        : p === 'testimony'
        ? viewTestimony()
        : p === 'interrogation'
        ? viewInterrogation()
        : p === 'evidence'
        ? viewEvidence()
        : p === 'ranking'
        ? viewRanking()
        : viewFeedbackStage();

    const draft = !L.contentReady
      ? `<div class="note note--warn"><span><strong>本關內容尚未匯入 DEMO。</strong>
         設計文檔已有第 ${L.no} 關的六張證詞與訊問題目，此處以佔位文字呈現；流程、計時與互動與正式關卡相同。</span></div>`
      : '';

    return `
      <div class="phase-head">
        <div>
          <span class="phase-head__eyebrow">${PHASE_META[p].eyebrow}</span>
          <h1 class="phase-head__title">第 ${L.no} 關｜${esc(L.name)}</h1>
        </div>
        <p class="phase-head__desc"><strong class="muted">本關技能　</strong>${esc(L.skills)}<br />
        <strong class="muted">本關任務　</strong>${esc(L.task)}</p>
      </div>
      ${draft}
      ${body}
    `;
  }

  /* == 影片（UI-01） == */

  function viewVideo() {
    const L = lv();
    const v = level().video;
    return `
      <div class="stack stack--lg">
        <div class="video-wrap">
          <video id="introVideo" controls preload="metadata" playsinline>
            <source src="${esc(v.src)}" type="video/mp4" />
          </video>
          <div class="video-ph" id="videoPh">
            <span class="video-ph__icon" aria-hidden="true">🎬</span>
            <strong>第 ${level().no} 關的開頭影片尚未放入</strong>
            <p class="small muted" style="max-width:46ch">
              把這一關的影片存成下面這個路徑，重新整理頁面就會直接播放。
              腳本在下方可以展開複製。
            </p>
            <code class="video-ph__path">${esc(v.src.replace('../', ''))}</code>
          </div>
        </div>

        <div class="row row--between">
          <p class="small muted">正式版會記錄影片開始、暫停、播放進度與觀看完成時間，重新整理不重置進度。</p>
          <button class="btn btn--primary" data-action="videoDone">
            ${L.videoWatched ? '已看完，回到發言' : '我已看完劇情，看六人發言'}
          </button>
        </div>

        <details class="narration" ${L.videoWatched ? '' : 'open'}>
          <summary class="small muted" style="cursor:pointer;margin-bottom:var(--sp-3)">
            第 ${level().no} 關開頭影片腳本（給你做影片用）
          </summary>
          <div style="white-space:pre-wrap">${esc(v.script)}</div>
        </details>
      </div>
    `;
  }

  /* == 證詞閱讀 == */

  function viewTestimony() {
    const L = lv();
    const readCount = Object.keys(L.read).length;
    const cards = KEYS.map((key) => {
      const t = testimonyOf(key);
      const c = charOf(key);
      const isRead = !!L.read[key];
      /* 讀過的卡片可以翻回角色介紹再翻回來，兩面都只差一次點擊 */
      const showText = isRead && !(L.collapsed && L.collapsed[key]);
      return `<button class="tcard tcard--interactive" data-action="read" data-key="${key}"
          data-read="${isRead}" data-placeholder="${showText && !!t.placeholder}"
          aria-expanded="${showText}">
          <span class="tcard__head">${avatar(key)}${who(key)}</span>
          ${
            showText
              ? `<span class="tcard__text">${esc(t.text)}</span>
                 <span class="tcard__cta tcard__cta--back">↩ 點一下回到角色介紹</span>`
              : `<span class="tcard__closed">
                   <span class="tcard__trait">${esc(c.trait)}</span>
                   <span class="tcard__cta">${isRead ? '再點一次看他的說法 →' : '點擊查看他的說法 →'}</span>
                 </span>`
          }
        </button>`;
    }).join('');

    return `
      <div class="stack stack--lg">
        <div class="row row--between">
          <p class="small muted">依序點開六個人各自掌握的資訊。已讀 <strong class="mono">${readCount}/6</strong>。<br />
            讀過的卡片再點一下可以翻回角色介紹，想看說法就再點一次。</p>
          <button class="btn btn--primary" data-action="toInterrogation" ${readCount < 6 ? 'disabled' : ''}>
            ${readCount < 6 ? `還有 ${6 - readCount} 張未讀` : '進入訊問階段'}
          </button>
        </div>
        <div class="tgrid">${cards}</div>
      </div>
    `;
  }

  /* == 個別訊問（UI-03） == */

  function viewInterrogation() {
    const L = lv();
    const locked = L.timedOut.interrogation || L.attemptsUsed >= MAX_INTERROGATIONS;
    const remaining = MAX_INTERROGATIONS - L.attemptsUsed;

    const suspects = KEYS.map((key) => {
      const asked = !!L.asked[key];
      const sel = L.selected === key;
      return `<button class="suspect" data-action="pick" data-key="${key}"
        aria-pressed="${sel}" ${asked || (locked && !sel) ? 'disabled' : ''}>
        ${avatar(key)}${who(key)}
        ${asked ? '<span class="suspect__done" aria-label="已訊問">✓ 已問</span>' : ''}
      </button>`;
    }).join('');

    const pips = Array.from(
      { length: MAX_INTERROGATIONS },
      (_, i) => `<span class="attempts__pip" data-used="${i < L.attemptsUsed}"></span>`
    ).join('');

    const sel = L.selected;
    const log = sel && L.asked[sel] ? L.asked[sel] : [];

    const logHtml = !sel
      ? `<div class="chat__empty">從左邊選一個人開始追問。<br />每關只能問 ${MAX_INTERROGATIONS} 個人，且不能重複追問同一個人。</div>`
      : log.length === 0 && !L.awaitingAnswer
      ? `<div class="chat__empty">選一個問題送出。<br /><span class="xs">${
          isDetailedAi() ? '本條件下 AI 會給詳細回答。' : '本條件下 AI 只回答「是／否／不知道」。'
        }</span></div>`
      : log
          .map(
            (m) => `
        <div class="bubble bubble--player">${esc(m.q)}</div>
        <div class="bubble bubble--char">
          <span class="bubble__answer" data-a="${m.a}">${m.a}</span>
          ${m.detail ? `<div class="bubble__detail">${esc(m.detail)}</div>` : ''}
        </div>`
          )
          .join('') +
        (L.awaitingAnswer
          ? `<div class="bubble bubble--char"><span class="dots"><span></span><span></span><span></span></span></div>`
          : '');

    const qs = sel && !L.asked[sel] && !locked ? questionsOf(sel) : null;
    const choices = qs
      ? qs
          .map(
            (item, i) => `<button class="choice" data-action="choose" data-i="${i}"
          aria-pressed="${L.pendingChoice === i}" ${L.awaitingAnswer ? 'disabled' : ''}>
          <span class="choice__mark"></span><span class="grow">${esc(item.q)}</span></button>`
          )
          .join('')
      : '';

    return `
      <div class="interro">
        <div class="panel">
          <div class="panel__head"><h2 class="panel__title">六個人</h2></div>
          <div class="panel__body"><div class="suspects">${suspects}</div></div>
        </div>

        <div class="panel chat">
          <div class="chat__head">
            ${sel ? avatar(sel, 'sm') + who(sel) : '<span class="muted small">尚未選擇關係人</span>'}
            <span class="grow"></span>
            <span class="attempts">
              <span>還可問</span>
              <strong class="mono" style="font-size:var(--fs-md)">${Math.max(0, remaining)}</strong>
              <span class="attempts__pips">${pips}</span>
            </span>
          </div>

          <div class="chat__log" id="chatLog">${logHtml}</div>

          <div class="chat__compose">
            ${
              locked
                ? `<div class="note note--warn"><span><strong>不能夠再問。</strong>${
                    L.timedOut.interrogation ? '訊問時間已到。' : `本關 ${MAX_INTERROGATIONS} 個人都問完了。`
                  }已送出的問題與回答會保留。</span></div>
                   <button class="btn btn--primary btn--block" data-action="toEvidence">進入證據牆</button>`
                : `
              ${
                qs
                  ? `<span class="field__label">追問（取自教師解析版的「可用追問」）</span>
                     <div class="choices">${choices}</div>
                     <div class="chat__row">
                       <span class="grow xs subtle">選一個問題後送出。每關只能問 ${MAX_INTERROGATIONS} 個人。</span>
                       <button class="btn btn--primary" data-action="send"
                        ${L.awaitingAnswer || L.pendingChoice === null ? 'disabled' : ''}>送出訊問</button>
                     </div>`
                  : sel
                  ? `<div class="note"><span>已追問過 ${esc(charOf(sel).name)}，同一關不得重複追問同一個人。</span></div>`
                  : '<p class="small subtle center">請先從左側選擇一個人。</p>'
              }
              <div class="row row--between">
                <span class="xs subtle">已問 ${L.attemptsUsed}／${MAX_INTERROGATIONS} 人</span>
                <button class="btn btn--ghost btn--sm" data-action="toEvidence">跳過剩餘追問，進入證據牆</button>
              </div>`
            }
          </div>
        </div>
      </div>
    `;
  }

  /* == 證據牆（UI-02） == */

  function viewEvidence() {
    const L = lv();
    const locked = L.evidenceSubmitted || L.timedOut.evidence;
    const placeOf = (key) => L.placements[key] || 'unclassified';
    const inZone = (z) => KEYS.filter((k) => placeOf(k) === z);
    const unclassified = inZone('unclassified');

    const placedCard = (key) => {
      const t = testimonyOf(key);
      return `<div class="tcard wcard wcard--placed" draggable="${!locked}" data-key="${key}">
        <span class="tcard__head">${avatar(key, 'sm')}${who(key)}</span>
        <span class="tcard__text">${esc(t.text)}</span>
        ${
          locked
            ? ''
            : `<span class="assign">
                <button class="assign__btn" data-zone="unclassified" data-action="assign" data-key="${key}"
                  data-to="unclassified">移回待分類</button>
                ${
                  placeOf(key) === 'reasonable'
                    ? `<button class="assign__btn" data-zone="flaw" data-action="assign" data-key="${key}" data-to="flaw">改到破綻牆</button>`
                    : `<button class="assign__btn" data-zone="reasonable" data-action="assign" data-key="${key}" data-to="reasonable">改到合理說法</button>`
                }
              </span>`
        }
      </div>`;
    };

    const zone = (z) => {
      const items = inZone(z);
      return `<div class="zone" data-zone="${z}" data-drop="${z}">
        <div class="zone__head">
          <span class="zone__title">${ZONES[z].label}</span>
          <span class="zone__count">${items.length} 張</span>
        </div>
        <p class="zone__hint">${ZONES[z].hint}</p>
        <div class="zone__items">
          ${items.map(placedCard).join('') || '<p class="small subtle center" style="padding:var(--sp-6) 0">把牌卡拖到這裡</p>'}
        </div>
      </div>`;
    };

    const trayCard = (key) => {
      const t = testimonyOf(key);
      return `<div class="tcard wcard" draggable="true" data-key="${key}" data-placeholder="${!!t.placeholder}">
        <span class="tcard__head">${avatar(key)}${who(key)}</span>
        <span class="tcard__text">${esc(t.text)}</span>
        <span class="tcard__foot assign">
          <button class="assign__btn" data-zone="reasonable" data-action="assign" data-key="${key}" data-to="reasonable">
            ↑ ${ZONES.reasonable.label}
          </button>
          <button class="assign__btn" data-zone="flaw" data-action="assign" data-key="${key}" data-to="flaw">
            ↑ ${ZONES.flaw.label}
          </button>
        </span>
      </div>`;
    };

    return `
      <div class="stack stack--lg">
        <div class="note"><span>把六個人的說法分成兩區：來源、範圍與限制清楚的放「${ZONES.reasonable.label}」；
        技巧使用有瑕疵的放「${ZONES.flaw.label}」。提交前都可以改，提交或時間到後鎖定。
        <strong>本關有 ${level().reasonableCount} 則合理、${6 - level().reasonableCount} 則有瑕疵。</strong></span></div>

        <div class="wall">${zone('reasonable')}${zone('flaw')}</div>

        <div class="tray" data-drop="unclassified">
          <div class="tray__head">
            <strong>待分類</strong>
            <span class="zone__count">${unclassified.length} 張</span>
            <span class="grow"></span>
            ${
              locked
                ? '<span class="badge badge--flaw">已鎖定</span>'
                : `<button class="btn btn--primary" data-action="submitEvidence"
                    ${unclassified.length > 0 ? 'disabled' : ''}>
                    ${unclassified.length > 0 ? `還有 ${unclassified.length} 張未分類` : '提交分類，進入推理'}
                  </button>`
            }
          </div>
          <div class="tray__items">
            ${unclassified.map(trayCard).join('') || '<p class="small subtle">六張都分類完了。</p>'}
          </div>
        </div>
      </div>
    `;
  }

  /* == 選出最不合理的人與理由（UI-04） == */

  function viewRanking() {
    const L = lv();
    const locked = L.rankingSubmitted || L.timedOut.ranking;
    const len = L.reason.trim().length;
    const reasonOk = len >= 40;
    const ok = !!L.pick && reasonOk; // 勾選與理由都齊了才能送出
    const allOpen = KEYS.every((k) => L.expanded[k]);

    /* 回顧區：只顯示「系統給過他看的材料」——說法與他追問到的回答。
       他自己在證據牆的分類屬於作答，由 SHOW_OWN_CLASSIFICATION 控制。 */
    const recall = (key) => {
      const t = testimonyOf(key);
      const log = L.asked[key] || [];
      const placed = L.placements[key];
      return `<div class="recall">
        <p class="recall__text">${esc(t.text)}</p>
        ${
          log.length
            ? log
                .map(
                  (m) => `<div class="recall__qa">
                    <div class="recall__q">你問：${esc(m.q)}</div>
                    <div class="recall__a"><span class="bubble__answer" data-a="${m.a}">${m.a}</span>${
                    m.detail ? `<span class="recall__detail">${esc(m.detail)}</span>` : ''
                  }</div>
                  </div>`
                )
                .join('')
            : '<p class="recall__none">這一關你沒有追問這個人。</p>'
        }
        ${
          SHOW_OWN_CLASSIFICATION && placed
            ? `<p class="recall__own">你在證據牆放在「${ZONES[placed].label}」</p>`
            : ''
        }
      </div>`;
    };

    const items = KEYS.map((key) => {
      const open = !!L.expanded[key];
      const picked = L.pick === key;
      return `<li class="rankitem" data-key="${key}" data-top="${picked}" data-open="${open}">
        <div class="rankitem__row">
          <button class="pickbtn" data-action="pickWorst" data-key="${key}"
            role="radio" aria-checked="${picked}" ${locked ? 'disabled' : ''}>
            <span class="pickbtn__dot" aria-hidden="true"></span>
            ${avatar(key, 'sm')}${who(key)}
          </button>
          <button class="recallbtn" data-action="recall" data-key="${key}"
            aria-expanded="${open}">${open ? '收起' : '看說法'}</button>
        </div>
        ${open ? recall(key) : ''}
      </li>`;
    }).join('');

    return `
      <div class="rank">
        <div class="panel">
          <div class="panel__head">
            <h2 class="panel__title">選出說法最不合理的人</h2>
            <span class="badge">單選 1 人</span>
            <span class="grow"></span>
            <button class="btn btn--quiet btn--sm" data-action="recallAll">
              ${allOpen ? '收起全部說法' : '展開全部說法'}
            </button>
          </div>
          <div class="panel__body stack">
            <p class="small muted">點一下人名就是勾選，再點別人可以改選。
            忘記誰說了什麼就點「看說法」，會一起顯示你對他的追問紀錄。</p>
            <ul class="ranklist" id="rankList" role="radiogroup" aria-label="說法最不合理的人">${items}</ul>
          </div>
        </div>

        <div class="panel">
          <div class="panel__head"><h2 class="panel__title">${esc(RANKING_QUESTION)}</h2></div>
          <div class="panel__body stack">
            <div class="field">
              <label class="field__label" for="reason">為什麼你覺得他最不合理？</label>
              <textarea class="textarea" id="reason" ${locked ? 'disabled' : ''}
                placeholder="請包含：一項證據、該證據與你的判斷之間的推理連結，以及目前的限制。">${esc(L.reason)}</textarea>
              <div class="counter" data-ok="${reasonOk}">
                <span>建議 40–80 字</span>
                <span class="mono">${len} 字</span>
              </div>
            </div>

            ${
              /* 判準等同把該關有瑕疵的發言逐一點名，預設不顯示。
                 由 ck_config 的 SHOW_RANKING_CRITERION 控制，是研究設計的決定。 */
              SERVER.showRankingCriterion && level().rankingCriterion
                ? `<div class="note note--warn"><span><strong>本關判準　</strong>${esc(
                    level().rankingCriterion
                  )}</span></div>`
                : ''
            }

            ${
              locked
                ? '<div class="note"><span>選擇與理由已鎖定。</span></div>'
                : `<button class="btn btn--primary btn--lg btn--block" data-action="confirmSubmit" ${
                    ok ? '' : 'disabled'
                  }>${
                    ok
                      ? '送出'
                      : !L.pick
                      ? '請先勾選一個人'
                      : '理由至少 40 字才能送出'
                  }</button>`
            }
          </div>
        </div>
      </div>
    `;
  }

  /* == 回饋階段的底層畫面（modal 蓋在上面） == */

  function viewFeedbackStage() {
    return `
      <div class="stack stack--lg">
        <div class="note"><span>本關已完成。回饋視窗開啟時，背景頁面不可操作。</span></div>
        <div class="panel"><div class="panel__body center stack">
          <p class="muted">${esc((feedbackData && feedbackData.conclusion) || '')}</p>
          <div><button class="btn btn--ghost" data-action="reopenFeedback">重新開啟回饋視窗</button></div>
        </div></div>
      </div>
    `;
  }

  /* == 真相 / debrief == */

  function viewTruth() {
    const qa = SCENARIO.truth.points
      .map((p) => `<div class="qa__item"><div class="qa__q">${esc(p.q)}</div><div class="qa__a">${esc(p.a)}</div></div>`)
      .join('');
    return `
      <div class="truth stack stack--lg">
        <span class="hero__eyebrow">CASE CLOSED ／ 公布劇情真相</span>
        <h1 class="truth__head">${esc(SCENARIO.truth.headline)}</h1>
        <p class="truth__body">${esc(SCENARIO.truth.body)}</p>
        <div class="qa">${qa}</div>
        <div class="row" style="justify-content:center;margin-top:var(--sp-6)">
          ${
            true
              ? '<button class="btn btn--primary btn--lg" data-action="toDebrief">進入 Debriefing</button>'
              : ''
          }
        </div>
      </div>
    `;
  }

  function viewDebrief() {
    return `
      <div class="truth stack stack--lg">
        <span class="hero__eyebrow">DEBRIEFING</span>
        <h1 class="phase-head__title serif">${esc(SCENARIO.debrief.title)}</h1>
        <ul class="checklist">${SCENARIO.debrief.items.map((t) => `<li><span>${esc(t)}</span></li>`).join('')}</ul>
        ${
          SCENARIO.debrief.closing
            ? `<p class="hero__q" style="text-align:left">${esc(SCENARIO.debrief.closing)}</p>`
            : ''
        }
        <div class="row" style="justify-content:center;margin-top:var(--sp-6)">
          <button class="btn btn--primary btn--lg" data-action="toPostSurvey">前往後測問卷</button>
        </div>
      </div>
    `;
  }

  /* ------------------------------------------------------- 回饋 modal */

  /* 分數由伺服器算（前端沒有正解可比對） */
  function scoreOf() {
    if (!feedbackData || !feedbackData.evidence) return 0;
    return Object.values(feedbackData.evidence).filter((e) => e.isCorrect).length;
  }

  /* 回饋內容要先向伺服器索取。伺服器會確認這一關的判斷已經提交，
     未提交就拿不到正解 —— 否則這支端點會變成作答前的答案查詢介面。 */
  async function openFeedback() {
    if (!feedbackData) {
      $('#modal').innerHTML = `
        <div class="modal__head"><h2 class="modal__title" id="modalTitle">此關的回饋</h2></div>
        <div class="modal__body center"><span class="dots"><span></span><span></span><span></span></span>
          <p class="small muted">正在取得回饋…</p></div>`;
      $('#overlay').hidden = false;

      const ok = await guard(async () => {
        feedbackData = await CK.feedback(level().no);
      }, '取得回饋失敗');

      if (!ok) {
        $('#modal').innerHTML = `
          <div class="modal__head"><h2 class="modal__title" id="modalTitle">此關的回饋</h2></div>
          <div class="modal__body"><div class="note note--warn"><span>回饋載入失敗，你的作答已經保存。</span></div></div>
          <div class="modal__foot">
            <button class="btn btn--ghost" data-action="reopenFeedback">重試</button>
            <button class="btn btn--primary" data-action="feedbackNext">繼續</button>
          </div>`;
        return;
      }
    }

    renderFeedback();
  }

  function renderFeedback() {
    const L = lv();
    const isLast = state.levelIndex === SCENARIO.levels.length - 1;
    const nextLabel = isLast ? '確認，公布真相' : '確認，進入下一關';

    let body;
    /* 實驗組的逐則對照需要 testimonies 與 evidence。回應若殘缺就退回完成訊息，
       而不是讓整個回饋視窗炸掉 —— 受試者的作答此時已經保存，
       畫面壞掉會讓他以為資料掉了。 */
    const detailed =
      feedbackData.detailed && feedbackData.testimonies && feedbackData.evidence;

    if (!detailed) {
      /* UI-05 控制組回饋：只給完成訊息，不揭露任何判定 */
      body = `
        <p class="serif" style="font-size:var(--fs-lg)">你已完成該階段的關卡～</p>
        <p class="small muted">${esc(feedbackData.message || '')}</p>
        ${
          feedbackData.detailed
            ? '<div class="note note--warn"><span>詳細回饋載入不完整，你的作答已經保存。</span></div>'
            : ''
        }
      `;
    } else {
      /* UI-06 實驗組回饋。正解與判定理由到這一刻才第一次進到前端。 */
      const score = scoreOf();
      const items = KEYS.map((k) => {
        const t = feedbackData.testimonies[k];
        const got = (feedbackData.evidence[k] && feedbackData.evidence[k].zone) || 'unclassified';
        const isOk = got === t.correct;
        const c = charOf(k);
        return `<div class="fbitem" data-ok="${isOk}">
          <div class="fbitem__head">
            ${avatar(k, 'sm')}
            <span>${esc(c.name)}</span>
            <span class="badge ${isOk ? 'badge--trusted' : 'badge--flaw'}">${isOk ? '判斷正確' : '需要修正'}</span>
            <span class="grow"></span>
            <span class="fbitem__label">你放：${ZONES[got] ? ZONES[got].label : '未分類'}　·　正解：${
          ZONES[t.correct].label
        }</span>
          </div>
          <p class="fbitem__text"><strong>${
            t.correct === 'flaw' ? '哪裡有瑕疵　' : '為什麼合理　'
          }</strong>${esc(t.criterion)}</p>
          <p class="fbitem__text"><strong>還可以追問　</strong>${esc(t.followup)}</p>
        </div>`;
      }).join('');

      /* AI 評語針對的是「推理理由」，不是選了誰。金鑰未設定或 OpenAI
         掛掉時 aiFailed 為真，此時逐則對照照常顯示，只少了這一段。 */
      const aiBlock = feedbackData.ai
        ? `<div class="fb__opening">
             <div class="row" style="margin-bottom:var(--sp-2)">
               <span class="badge badge--group">AI 教學回饋</span>
               <span class="xs subtle">本關技能：${esc(level().skills)}</span>
             </div>
             <div style="white-space:pre-wrap">${esc(feedbackData.ai)}</div>
           </div>`
        : `<div class="note note--warn"><span>AI 評語暫時無法產生，以下的逐則對照不受影響。</span></div>`;

      body = `
        ${aiBlock}

        <div class="fb__score">
          <span class="fb__scorenum">${score}<span class="muted" style="font-size:var(--fs-lg)">/6</span></span>
          <span class="small muted">分類正確數（本關 ${level().reasonableCount} 則合理、${
        6 - level().reasonableCount
      } 則有瑕疵）。全對的人也會看到「為什麼正確」，不只有答錯才給回饋。</span>
        </div>

        <div class="stack stack--sm">${items}</div>

        <div class="note note--ai"><span><strong>階段性結論　</strong>${esc(
          feedbackData.conclusion || ''
        )}</span></div>
      `;
    }

    $('#modal').innerHTML = `
      <div class="modal__head">
        <h2 class="modal__title" id="modalTitle">此關的回饋</h2>
        <button class="modal__close" data-action="feedbackNext" aria-label="關閉並繼續">×</button>
      </div>
      <div class="modal__body">${body}</div>
      <div class="modal__foot">
        <button class="btn btn--primary" data-action="feedbackNext">${nextLabel}</button>
      </div>
    `;
    $('#overlay').hidden = false;
    $('#modal').querySelector('.btn--primary').focus();
  }

  function openConfirm() {
    $('#modal').innerHTML = `
      <div class="modal__head">
        <h2 class="modal__title" id="modalTitle">確認送出？</h2>
        <button class="modal__close" data-action="closeModal" aria-label="取消">×</button>
      </div>
      <div class="modal__body">
        <p>送出後，本關的選擇與理由會鎖定，不能再修改。</p>
        <p class="small muted">系統會先保存答案，再開啟對應組別的回饋視窗。</p>
      </div>
      <div class="modal__foot">
        <button class="btn btn--ghost" data-action="closeModal">再檢查一下</button>
        <button class="btn btn--primary" data-action="doSubmit">確認送出</button>
      </div>
    `;
    $('#overlay').hidden = false;
    $('#modal').querySelector('.btn--primary').focus();
  }

  function closeModal() {
    $('#overlay').hidden = true;
    $('#modal').innerHTML = '';
  }

  /* ---------------------------------------------------------- 事件處理 */

  function syncReason() {
    const ta = $('#reason');
    if (ta) lv().reason = ta.value;
  }

  /* 回答由伺服器發放。次數上限與「不可重複追問同一人」也在伺服器擋，
     前端的 disabled 只是先行提示，繞過去也沒用。 */
  async function askQuestion(item) {
    const L = lv();
    const key = L.selected;
    L.awaitingAnswer = true;
    L.pendingChoice = null;
    render();

    const ok = await guard(async () => {
      const r = await CK.ask(level().no, key, item.id);
      L.asked[key] = [{ q: r.q, a: r.a, detail: r.detail }];
      L.attemptsUsed = r.attemptsUsed;
      if (r.attemptsLeft === 0) {
        toast(`本關只能問 ${MAX_INTERROGATIONS} 個人，已經問完了`, 'warn');
      }
    }, '訊問失敗');

    L.awaitingAnswer = false;
    if (ok) save();
    render();
    const log = $('#chatLog');
    if (log) log.scrollTop = log.scrollHeight;
  }

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-action]');
    if (!btn) return;

    const a = btn.dataset.action;
    const L = state.screen === 'play' ? lv() : null;

    switch (a) {
      /* ---- 開場 ---- */
      case 'start': {
        state.screen = 'play';
        ensureTimer();
        save();
        render();
        break;
      }

      /* ---- 頁籤 ---- */
      case 'tab':
        goPhase(btn.dataset.phase);
        break;

      /* ---- 影片 ---- */
      case 'videoDone':
        L.videoWatched = true;
        goPhase('testimony');
        break;

      /* ---- 證詞 ---- */
      case 'read': {
        const key = btn.dataset.key;
        if (!L.collapsed) L.collapsed = {};
        if (!L.read[key]) {
          L.read[key] = true; // 已讀只加不減，翻回介紹不會讓進度倒退
          delete L.collapsed[key];
        } else if (L.collapsed[key]) {
          delete L.collapsed[key]; // 介紹 → 說法
        } else {
          L.collapsed[key] = true; // 說法 → 介紹
        }
        save();
        render();
        break;
      }
      case 'toInterrogation':
        goPhase('interrogation');
        break;

      /* ---- 訊問 ---- */
      case 'pick':
        L.selected = btn.dataset.key;
        L.pendingChoice = null;
        save();
        render();
        break;
      case 'choose':
        L.pendingChoice = Number(btn.dataset.i);
        render();
        break;
      case 'send': {
        /* 自由提問移除：角色的回答必須來自伺服器上受控的內容，
           否則會洩漏後面關卡才揭露的資訊（見 demo README 的答案洩漏控制）。 */
        if (L.pendingChoice === null) {
          toast('請先選一個問題', 'error');
          return;
        }
        askQuestion(questionsOf(L.selected)[L.pendingChoice]);
        break;
      }
      case 'toEvidence':
        goPhase('evidence');
        break;

      /* ---- 證據牆 ---- */
      case 'assign':
        L.placements[btn.dataset.key] = btn.dataset.to;
        save();
        render();
        break;
      case 'submitEvidence':
        /* goPhase 內部也走 guard；不能包在同一個 guard 裡，busy 旗標會擋掉自己 */
        guard(async () => {
          await CK.submitEvidence(level().no, L.placements);
          L.evidenceSubmitted = true;
          toast('分類已提交並鎖定');
        }, '提交失敗').then((ok) => {
          if (ok) goPhase('ranking');
        });
        break;

      /* ---- 判斷階段的回顧 ---- */
      case 'recall': {
        syncReason();
        const key = btn.dataset.key;
        L.expanded[key] = !L.expanded[key];
        save();
        render();
        break;
      }
      case 'recallAll': {
        syncReason();
        const allOpen = KEYS.every((k) => L.expanded[k]);
        KEYS.forEach((k) => (L.expanded[k] = !allOpen));
        save();
        render();
        break;
      }

      /* ---- 判斷：選出最不合理的人 ---- */
      case 'pickWorst': {
        syncReason();
        const key = btn.dataset.key;
        L.pick = L.pick === key ? null : key; // 再點一次可以取消勾選
        save();
        render();
        break;
      }
      case 'confirmSubmit':
        syncReason();
        openConfirm();
        break;
      case 'doSubmit':
        /* 同 submitEvidence：goPhase 要在 guard 結束後才能呼叫 */
        guard(async () => {
          await CK.submitJudgment(level().no, L.pick, L.reason);
          L.rankingSubmitted = true;
          closeModal();
        }, '送出失敗').then((ok) => {
          if (ok) goPhase('feedback');
        });
        break;
      case 'closeModal':
        closeModal();
        break;

      /* ---- 回饋 ---- */
      case 'feedbackNext':
        nextLevel();
        break;
      case 'reopenFeedback':
        openFeedback();
        break;

      /* ---- 結尾 ---- */
      case 'toDebrief':
        state.screen = 'debrief';
        save();
        render();
        break;
      case 'toPostSurvey':
        location.href = 'survey.html?kind=post';
        break;
    }
  });

  document.addEventListener('input', (ev) => {
    if (ev.target.id === 'reason') {
      lv().reason = ev.target.value;
      const box = ev.target.closest('.field').querySelector('.counter');
      const len = ev.target.value.trim().length;
      box.dataset.ok = len >= 40;
      box.lastElementChild.textContent = `${len} 字`;
      const submit = document.querySelector('[data-action="confirmSubmit"]');
      if (submit) {
        /* 送出要同時滿足「勾了一個人」與「理由 40 字」，兩個條件分別提示 */
        const picked = !!lv().pick;
        submit.disabled = !picked || len < 40;
        submit.textContent = !picked ? '請先勾選一個人' : len >= 40 ? '送出' : '理由至少 40 字才能送出';
      }
    }
  });

  /* Esc 關閉確認視窗（回饋視窗不可用 Esc 跳過） */
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    if ($('#overlay').hidden) return;
    if (document.querySelector('[data-action="doSubmit"]')) closeModal();
  });

  /* ------------------------------------------------------- 拖曳（HTML5） */

  document.addEventListener('dragstart', (ev) => {
    const card = ev.target.closest('.wcard[draggable="true"]');
    if (!card) return;
    dragKey = card.dataset.key;
    card.dataset.dragging = 'true';
    ev.dataTransfer.effectAllowed = 'move';
    try {
      ev.dataTransfer.setData('text/plain', dragKey);
    } catch (e) {
      /* 舊瀏覽器 */
    }
  });

  document.addEventListener('dragend', () => {
    document.querySelectorAll('[data-dragging="true"]').forEach((n) => delete n.dataset.dragging);
    document.querySelectorAll('[data-over="true"]').forEach((n) => delete n.dataset.over);
    dragKey = null;
  });

  document.addEventListener('dragover', (ev) => {
    const drop = ev.target.closest('[data-drop]');
    if (!drop) return;
    ev.preventDefault();
    drop.dataset.over = 'true';
  });

  document.addEventListener('dragleave', (ev) => {
    const drop = ev.target.closest('[data-drop]');
    if (drop) delete drop.dataset.over;
  });

  document.addEventListener('drop', (ev) => {
    if (!dragKey) return;
    const L = lv();

    /* 證據牆 */
    const drop = ev.target.closest('[data-drop]');
    if (drop && phase() === 'evidence' && !L.evidenceSubmitted && !L.timedOut.evidence) {
      ev.preventDefault();
      L.placements[dragKey] = drop.dataset.drop;
      dragKey = null;
      save();
      render();
      return;
    }

  });

  /* -------------------------------------------------- 影片佔位自動偵測 */

  function wireVideo() {
    const v = $('#introVideo');
    const ph = $('#videoPh');
    if (!v || !ph || v.dataset.wired) return;
    v.dataset.wired = 'true';

    const hide = () => {
      ph.style.display = 'none';
    };
    const show = () => {
      ph.style.display = '';
    };

    /* preload="metadata" 時，部分瀏覽器只會觸發 loadedmetadata、不一定有 loadeddata，
       所以三個事件都聽；元素也可能在監聽器掛上前就載完，最後再補一次 readyState 檢查。 */
    ['loadedmetadata', 'loadeddata', 'canplay'].forEach((e) => v.addEventListener(e, hide));
    v.addEventListener('error', show);
    /* 影片檔不存在時，error 發生在 <source> 上、不會冒泡到 <video>，要另外聽。 */
    const source = v.querySelector('source');
    if (source) source.addEventListener('error', show);
    if (v.readyState >= 1) hide();

    /* 看完自動標記，按鈕文案同步更新（不重繪，避免播放器被重建）。 */
    v.addEventListener('ended', () => {
      const L = lv();
      if (L.videoWatched) return;
      L.videoWatched = true;
      save();
      const btn = $('[data-action="videoDone"]');
      if (btn) btn.textContent = '已看完，看六人發言';
    });
  }

  const observer = new MutationObserver(wireVideo);

  /* ---------------------------------------------------------------- 啟動 */

  async function boot() {
    const main = $('#main');
    main.innerHTML = '<div class="center stack" style="padding:var(--sp-8)"><span class="dots">'
      + '<span></span><span></span><span></span></span><p class="small muted">載入中…</p></div>';

    let s;
    try {
      s = await CK.boot();
    } catch (e) {
      main.innerHTML = `<div class="note note--warn"><span><strong>載入失敗　</strong>${esc(e.message)}
        <br />請重新整理頁面；若持續失敗，請告知施測人員。</span></div>`;
      return;
    }

    /* 先套伺服器的權威狀態，再把純介面狀態（翻開了哪張卡、計時剩餘）疊回去 */
    applyServerState(s);
    const ui = loadUi();
    if (ui) {
      state.levels.forEach((L, i) => {
        if (!ui[i]) return;
        L.read = { ...ui[i].read, ...L.read };
        L.collapsed = ui[i].collapsed || {};
        L.expanded = ui[i].expanded || {};
        L.timeLeft = ui[i].timeLeft || {};
        L.timedOut = ui[i].timedOut || {};
        if (!L.rankingSubmitted && ui[i].reason) L.reason = ui[i].reason;
        if (!L.rankingSubmitted && ui[i].pick) L.pick = ui[i].pick;
        if (!L.evidenceSubmitted) L.placements = ui[i].placements || {};
      });
    }

    /* 已經完成六關的人直接進真相畫面 */
    if (s.progress.finished) {
      try {
        await CK.loadTruth();
      } catch (e) {
        toast(`真相載入失敗：${e.message}`, 'error');
      }
    }

    /* 第一次進來停在開場簡介，續跑的人直接回到遊戲 */
    if (state.screen === 'play' && s.progress.levelNo === 1 && s.progress.phase === 'video' && !ui) {
      state.screen = 'setup';
    }

    if (state.screen === 'play') ensureTimer();
    render();
    observer.observe(main, { childList: true, subtree: true });
    wireVideo();
  }

  boot();
})();
