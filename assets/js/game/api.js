/* ==========================================================================
   後端資料層 — 取代 demo 的 js/scenario.js

   demo 把整份劇本（含教師判定與正解）寫死在前端，玩家開 DevTools 就看得到。
   這一版改成向 API 取，而且只取得目前這一關；未進行的關卡不會提前下載，
   正解則到回饋階段（且限實驗組）才由伺服器發放。

   app.js 沿用 demo 的全域名稱（SCENARIO / PHASE_SECONDS / ZONES …），
   所以視圖層幾乎不用改；差別只在這些值來自伺服器，且不含答案欄位。
   ========================================================================== */

const API = '../api/public';

/* 這些全域由 CK.boot() 在啟動時填入，app.js 只讀不寫。 */
let SCENARIO = null;
let PHASE_SECONDS = {};
/* 訊問設定：秒數、單句字數上限、閒置多久角色會主動開口 */
let INTERROGATION = { seconds: 150, maxChars: 200, nudgeIdleSeconds: 25 };
let ZONES = {};
let RANKING_QUESTION = '';
let SHOW_OWN_CLASSIFICATION = false;
/* 注意：這裡沒有組別欄位。受試者不該從前端得知自己屬於實驗組還是控制組，
   所以伺服器只回傳 hasAiFeedback，不回傳組別本身。 */
let SERVER = { hasAiFeedback: true, stuId: '', levelCount: 6 };

const CK = (() => {
  async function call(path, body) {
    const res = await fetch(`${API}/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    // 401 代表 session 過期或未登入。停在這裡比讓畫面靜默壞掉好。
    if (res.status === 401) {
      location.href = '../login.html';
      throw new Error('尚未登入');
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`伺服器回應無法解析（HTTP ${res.status}）`);
    }
    if (!res.ok || data.success === false) {
      const err = new Error(data.message || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  /**
   * 把伺服器回應轉成 demo 的 SCENARIO 形狀。
   *
   * levels 是稀疏的：只有目前這一關有完整內容，其餘只有 no 與 name
   * （供上方進度點顯示）。app.js 一律以 state.levelIndex 取用當前關卡，
   * 不會去讀其他關卡的內容，所以稀疏不影響它運作。
   */
  function hydrate(s) {
    INTERROGATION = { ...INTERROGATION, ...(s.config.INTERROGATION || {}) };
    /* 訊問秒數的單一來源是 INTERROGATION.seconds，蓋掉劇本檔裡的舊值 */
    PHASE_SECONDS = { ...(s.config.PHASE_SECONDS || {}), interrogation: INTERROGATION.seconds };
    ZONES = s.config.ZONES || {};
    RANKING_QUESTION = s.config.RANKING_QUESTION || '';
    SHOW_OWN_CLASSIFICATION = !!s.config.SHOW_OWN_CLASSIFICATION;

    SERVER = {
      stuId: s.stuId,
      hasAiFeedback: !!s.hasAiFeedback,
      levelCount: s.levelCount,
      showRankingCriterion: !!s.config.SHOW_RANKING_CRITERION,
    };

    const meta = s.config.meta || {};
    const levels = s.outline.map((o) => ({ no: Number(o.no), name: o.name, contentReady: false }));

    if (s.level) {
      // 影片路徑在資料庫裡是相對於 demo/ 的（media/intro-L1.mp4），
      // 遊戲頁在 control/ 底下，所以往上一層對到 idealight_sdg/media/
      const lv = { ...s.level, contentReady: true };
      lv.video = { ...lv.video, src: `../${lv.video.src}` };
      levels[lv.no - 1] = lv;
    }

    SCENARIO = {
      id: meta.id,
      title: meta.title || '',
      subtitle: meta.subtitle || '',
      brief: s.config.brief || { lead: '', body: '', question: '' },
      characters: s.characters.map((c) => ({
        key: c.char_key,
        name: c.name,
        role: c.role,
        trait: c.trait,
      })),
      levels,
      truth: null, // 完成六關後由 loadTruth() 取回
      debrief: null,
    };

    return s;
  }

  return {
    /** 啟動：抓一次完整狀態並填入全域。 */
    async boot() {
      return hydrate(await call('ck_state.php'));
    },

    /** 重新同步（換關卡後用）。 */
    async refresh() {
      return hydrate(await call('ck_state.php'));
    },

    advance: (levelNo, phase) => call('ck_advance.php', { levelNo, phase }),
    nextLevel: (levelNo) => call('ck_advance.php', { levelNo, nextLevel: true }),

    /**
     * 訊問：送出一句自由打字的問題，角色的回答以串流回來。
     * 伺服器回 NDJSON（一行一個 JSON）；每收到一段文字就呼叫 onDelta，
     * 讓第一個字盡快出現 —— 等 AI 回覆的時間不暫停計時。
     * 回傳最後的 done 事件（完整回答與伺服器端的剩餘秒數）。
     */
    async chat(levelNo, charKey, message, onDelta) {
      const res = await fetch(`${API}/ck_chat.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ levelNo, charKey, message }),
      });

      if (res.status === 401) {
        location.href = '../login.html';
        throw new Error('尚未登入');
      }
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          msg = (await res.json()).message || msg;
        } catch (e) {
          /* 不是 JSON 就用狀態碼 */
        }
        const err = new Error(msg);
        err.status = res.status;
        throw err;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let done = null;

      const handle = (line) => {
        if (!line.trim()) return;
        let ev;
        try {
          ev = JSON.parse(line);
        } catch (e) {
          return; // 不是 JSON 的行（例如伺服器警告訊息）直接略過，不要讓整個回答壞掉
        }
        if (ev.t === 'delta') onDelta(ev.v);
        else if (ev.t === 'done') done = ev;
      };

      for (;;) {
        const { value, done: eof } = await reader.read();
        if (value) buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          handle(buf.slice(0, nl));
          buf = buf.slice(nl + 1);
        }
        if (eof) break;
      }
      handle(buf);

      if (!done) throw new Error('回答中斷了，請再問一次');
      return done;
    },

    nudge: (levelNo, charKey) => call('ck_nudge.php', { levelNo, charKey }),

    submitEvidence: (levelNo, placements, timedOut = false) =>
      call('ck_evidence.php', { levelNo, placements, timedOut }),

    submitJudgment: (levelNo, pickChar, reason, timedOut = false) =>
      call('ck_judgment.php', { levelNo, pickChar, reason, timedOut }),

    feedback: (levelNo) => call('ck_feedback.php', { levelNo }),

    async loadTruth() {
      const d = await call('ck_truth.php');
      SCENARIO.truth = d.truth;
      SCENARIO.debrief = d.debrief;
      return d;
    },

    survey: (kind) => call(`ck_survey.php?kind=${encodeURIComponent(kind)}`),
    completeSurvey: (kind) => call('ck_survey.php', { kind, action: 'complete' }),
  };
})();
