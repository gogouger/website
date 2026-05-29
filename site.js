/* ============================================================
   Gordon Gouger — personal site
   Shared behavior. Safe to include on every page (guards nulls).
   ============================================================ */
(function () {
  "use strict";
  var reduce = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || /[?&]print=1/.test(location.search);
  var GLYPHS = "•×%!?#/\\<>=*+~";

  /* favicon — the GG monogram */
  try {
    var _fsvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="#1a8a77" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M77.71 34 A32 32 0 1 0 82 50 L60 50"/><path d="M65.59 41 A18 18 0 1 0 68 50 L54 50"/></svg>';
    var _fl = document.createElement('link');
    _fl.rel = 'icon'; _fl.type = 'image/svg+xml';
    _fl.href = 'data:image/svg+xml,' + encodeURIComponent(_fsvg);
    document.head.appendChild(_fl);
  } catch (e) {}

  function scramble(el, text, dur) {
    if (text == null) text = el.dataset.text || el.textContent;
    if (reduce) { el.textContent = text; return; }
    dur = dur || 700;
    var n = text.length, start = performance.now();
    function frame(now) {
      var p = Math.min(1, (now - start) / dur);
      var settled = Math.floor(p * n);
      var out = "";
      for (var i = 0; i < n; i++) {
        var c = text[i];
        out += (i < settled || c === " ") ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame); else el.textContent = text;
    }
    requestAnimationFrame(frame);
  }

  /* ---- theme (run early to avoid flash) ---- */
  var root = document.documentElement;
  function setTheme(t) {
    root.dataset.theme = t;
    var btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = (t === 'dark' ? 'light' : 'dark');
    try { localStorage.setItem('gg-theme', t); } catch (e) {}
  }
  var saved = 'light';
  try { saved = localStorage.getItem('gg-theme') || 'light'; } catch (e) {}
  setTheme(saved);

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('themeBtn');
    if (btn) btn.addEventListener('click', function () {
      setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    });

    /* ---- scramble-in on load + hover ---- */
    var els = Array.prototype.slice.call(document.querySelectorAll('.scram'));
    els.forEach(function (el, i) {
      el.dataset.text = el.textContent.trim();
      if (reduce) return;
      el.textContent = "";
      setTimeout(function () { scramble(el, el.dataset.text, 480 + Math.random() * 360); }, 90 * i);
    });
    document.querySelectorAll('.t.scram, .label .scram').forEach(function (el) {
      el.addEventListener('mouseenter', function () { scramble(el, el.dataset.text, 420); });
    });

    /* ---- Tufte-style margin notes ---- */
    var note = document.getElementById('marginNote');
    var wrap = document.querySelector('.wrap');
    if (note && wrap) {
      var showNote = function (term) {
        note.textContent = term.dataset.note;
        var wr = wrap.getBoundingClientRect(), tr = term.getBoundingClientRect();
        var gutter = (window.innerWidth - wr.width) / 2;
        if (gutter > 210) {
          note.style.left = (wr.right + window.scrollX + 24) + 'px';
          note.style.top = (tr.top + window.scrollY) + 'px';
          note.style.width = Math.min(180, gutter - 44) + 'px';
        } else {
          note.style.left = (tr.left + window.scrollX) + 'px';
          note.style.top = (tr.bottom + window.scrollY + 6) + 'px';
          note.style.width = '230px';
        }
        note.classList.add('show');
      };
      var hideNote = function () { note.classList.remove('show'); };
      document.querySelectorAll('.term').forEach(function (t) {
        t.tabIndex = 0;
        t.addEventListener('mouseenter', function () { showNote(t); });
        t.addEventListener('mouseleave', hideNote);
        t.addEventListener('focus', function () { showNote(t); });
        t.addEventListener('blur', hideNote);
      });
    }

    /* ---- rotating "currently" line (landing only) ---- */
    var cur = document.getElementById('currently');
    if (cur) {
      var states = ["shipping ML to the edge", "running the foothills", "in the woodshop", "at the glassblowing bench", "back at the dojo"];
      var ci = 0;
      setInterval(function () { ci = (ci + 1) % states.length; scramble(cur, states[ci], 600); }, 4200);
    }
  });

  /* ---- live Denver clock ---- */
  function tick() {
    var el = document.getElementById('clock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/Denver' }) + ' MT';
  }
  tick(); setInterval(tick, 1000);

  /* ---- animated tab title (marquees only while you're away) ---- */
  var TITLE = document.title, AWAY = "♪  gordon gouger · software & rf engineer · denver  ";
  var tTimer = null, tPos = 0;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && !reduce) {
      tTimer = setInterval(function () { tPos = (tPos + 1) % AWAY.length; document.title = AWAY.slice(tPos) + AWAY.slice(0, tPos); }, 240);
    } else { clearInterval(tTimer); tTimer = null; document.title = TITLE; }
  });
})();
