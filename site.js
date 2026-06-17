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
    /* resolve app links (Books / Meron / login) to the right apex for
       this environment. Handles both the dev/local *.ggouger.localhost
       and prod *.gordongouger.com — when we're already on a subdomain
       (e.g. opened from meron.<apex>), strip it so the data-app prefix
       is appended to the apex, not double-stacked. */
    var _base = (function () {
      var h = location.hostname;
      if (h.indexOf('gouger') === -1) return 'gordongouger.com';  // prod fallback
      var parts = h.split('.');
      return parts.length >= 3 ? parts.slice(-2).join('.') : h;
    })();
    document.querySelectorAll('[data-app]').forEach(function (el) {
      el.href = location.protocol + '//' + el.getAttribute('data-app') + '.' + _base + '/';
    });

    /* ---- single sign-on: INLINE login (no separate page) ----
       One Authelia session, scoped to ggouger.localhost, spans the site + Meron +
       Books. The /__auth* paths are same-origin proxies to Authelia (see Caddyfile),
       so we log in/out from a modal right here and just update the button. Falls back
       to the Authelia portal link if the site is opened outside the caddy stack. */
    (function () {
      var authEls = document.querySelectorAll('[data-app="auth"]');
      if (!authEls.length) return;
      var authHost = location.protocol + '//auth.' + _base;
      var inlineActive = false, authed = false, modal = null, pendingHref = null;

      function renderButton(d) {
        var here = encodeURIComponent(location.href);
        authed = !!(d && d.authentication_level >= 1);
        authEls.forEach(function (el) {
          el.textContent = authed ? (d.username ? ('log out (' + d.username + ')') : 'log out') : 'log in';
          el.href = authed ? (authHost + '/logout?rd=' + here) : (authHost + '/?rd=' + here); /* no-JS fallback */
        });
      }
      function refresh() {
        return fetch('/__authstate', { credentials: 'include', headers: { 'Accept': 'application/json' } })
          .then(function (r) { if (!r.ok) throw 0; return r.json(); })
          .then(function (s) { inlineActive = true; renderButton(s && s.data); });
      }

      function buildModal() {
        if (modal) return modal;
        modal = document.createElement('div');
        modal.className = 'login-modal';
        /* critical layout set inline so it's ALWAYS a centered overlay, even if a
           stale/cached styles.css is missing the newer .login-* rules. */
        modal.style.cssText = 'position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(8,10,9,.55)';
        modal.innerHTML =
          '<div class="login-card" role="dialog" aria-modal="true" aria-label="Log in">' +
            '<button class="login-x" type="button" aria-label="Close">×</button>' +
            '<p class="label"><span class="hash">#</span> <span>log in</span></p>' +
            '<p class="login-sub">One login for the site, Meron &amp; Athenaeum.</p>' +
            '<form class="login-form" novalidate>' +
              '<div class="field"><label for="lm-user">Username</label>' +
                '<input id="lm-user" name="username" autocomplete="username" autocapitalize="off" spellcheck="false" required></div>' +
              '<div class="field"><label for="lm-pass">Password</label>' +
                '<input id="lm-pass" name="password" type="password" autocomplete="current-password" required></div>' +
              '<p class="login-err" role="alert" hidden></p>' +
              '<button class="btn" type="submit">Sign in</button>' +
            '</form>' +
          '</div>';
        document.body.appendChild(modal);
        /* card + chrome styled inline too (theme-aware via CSS vars), so the overlay
           renders correctly without depending on the cached stylesheet. */
        modal.querySelector('.login-card').style.cssText = 'position:relative;width:100%;max-width:360px;background:var(--bg);color:var(--fg);border:1px solid var(--line2);border-radius:8px;padding:24px;box-shadow:0 18px 50px rgba(0,0,0,.3)';
        modal.querySelector('.login-x').style.cssText = 'position:absolute;top:8px;right:10px;background:none;border:0;color:var(--muted);font-size:22px;line-height:1;cursor:pointer;padding:2px 7px';
        modal.querySelector('.login-sub').style.cssText = 'color:var(--muted);font-size:12.5px;margin:0 0 18px';
        var form = modal.querySelector('.login-form');
        var err = modal.querySelector('.login-err');
        err.style.cssText = 'color:#d9534f;font-size:12.5px;margin:0 0 12px';
        var sBtn = form.querySelector('button[type=submit]');
        sBtn.style.cssText = 'width:100%;background:none;cursor:pointer;margin-top:2px';
        var close = function () { modal.style.display = 'none'; modal.classList.remove('show'); pendingHref = null; };
        modal.addEventListener('mousedown', function (e) { if (e.target === modal) close(); });
        modal.querySelector('.login-x').addEventListener('click', close);
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.style.display === 'flex') close(); });
        form.addEventListener('submit', function (e) {
          e.preventDefault(); err.hidden = true;
          sBtn.disabled = true; sBtn.textContent = 'signing in…';
          fetch('/__authlogin', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ username: form.username.value, password: form.password.value, keepMeLoggedIn: true, requestMethod: 'GET', targetURL: location.href })
          })
            .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
            .then(function (res) {
              if (res.ok && res.j && res.j.status === 'OK') {
                var go = pendingHref; close(); form.reset();
                if (go) { location.href = go; } else { refresh(); }
                return;
              }
              throw new Error((res.j && res.j.message) || 'Invalid username or password');
            })
            .catch(function (e2) { err.textContent = (e2 && e2.message) || 'Login failed'; err.hidden = false; })
            .finally(function () { sBtn.disabled = false; sBtn.textContent = 'Sign in'; });
        });
        return modal;
      }
      function openModal(href) {
        pendingHref = href || null;
        var m = buildModal();
        m.style.display = 'flex'; m.classList.add('show');
        setTimeout(function () { var u = modal.querySelector('#lm-user'); if (u) u.focus(); }, 30);
      }
      function logout() {
        fetch('/__authlogout', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: '{}' })
          .then(function () { return refresh(); })
          .catch(function () { location.href = authHost + '/logout'; });
      }

      authEls.forEach(function (el) {
        el.addEventListener('click', function (e) {
          if (!inlineActive) return;               /* outside caddy stack: use the href fallback */
          e.preventDefault();
          if (authed) logout(); else openModal(null);
        });
      });

      refresh().catch(function () { /* same-origin auth proxy unreachable; keep portal-link fallback */ });
    })();

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

    /* live Meron telemetry (project page) — safe aggregates via the same-origin
       /__meron/summary proxy; renders stat cards + a weekly-mileage sparkline. */
    var meronLive = document.getElementById('meron-live');
    if (meronLive) {
      fetch('/__meron/summary', { headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (s) {
          if (!s || !s.ok) { meronLive.style.display = 'none'; return; }
          var fmt = function (n) { return (n || 0).toLocaleString('en-US'); };
          var weekly = s.weekly_miles || [], spark = '';
          if (weekly.length > 1) {
            var max = Math.max.apply(null, weekly) || 1, W = 100, H = 30, n = weekly.length;
            var pts = weekly.map(function (v, i) {
              return ((i / (n - 1)) * W).toFixed(1) + ',' + (H - (v / max) * H).toFixed(1);
            }).join(' ');
            spark = '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="var(--accent)" stroke-width="1.5" points="' + pts + '"/></svg>';
          }
          var lm = s.lift_maxes || {};
          meronLive.innerHTML =
            '<div class="ml-h">running</div>' +
            '<div class="stats">' +
              '<div class="stat"><span class="n">' + fmt(s.runs) + '</span><span class="l">runs</span></div>' +
              '<div class="stat"><span class="n">' + fmt(Math.round(s.run_miles)) + '</span><span class="l">miles</span></div>' +
              '<div class="stat"><span class="n">' + (s.longest_run_mi || 0) + '</span><span class="l">longest · mi</span></div>' +
              '<div class="stat"><span class="n">' + (s.since || '—') + '</span><span class="l">since</span></div>' +
            '</div>' + spark +
            '<div class="ml-h ml-h2">lifting</div>' +
            '<div class="stats">' +
              '<div class="stat"><span class="n">' + fmt(s.lift_sessions) + '</span><span class="l">sessions</span></div>' +
              '<div class="stat"><span class="n">' + (lm.bench || 0) + '</span><span class="l">bench · lb</span></div>' +
              '<div class="stat"><span class="n">' + (lm.squat || 0) + '</span><span class="l">squat · lb</span></div>' +
              '<div class="stat"><span class="n">' + (lm.deadlift || 0) + '</span><span class="l">deadlift · lb</span></div>' +
            '</div>' +
            '<p class="cap"><span class="live-dot"></span>live from the Meron dashboard · running &amp; lifting</p>';
        })
        .catch(function () { meronLive.style.display = 'none'; });
    }

    /* Athenaeum shelf preview — pulls Gordon's favorited books straight from
       the public books API (no proxy needed; CORS is open). Renders
       all-time favorites with a gold border, then a top-5 per genre. */
    var athLive = document.getElementById('athenaeum-live');
    if (athLive) {
      var BOOKS_HOST = 'https://books.gordongouger.com';
      var USERNAME = 'ggouger';
      var USER_ID = 2;
      var GENRES = ['Religious', 'Fiction', 'Other'];

      var esc = function (s) {
        var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
      };
      var coverUrl = function (b) {
        if (!b.cover_filename) return '';
        var u = BOOKS_HOST + '/covers/' + USER_ID + '/' + b.cover_filename;
        if (b.cover_updated_at) u += '?v=' + encodeURIComponent(b.cover_updated_at);
        return u;
      };
      var bookCard = function (b) {
        var cov = coverUrl(b);
        var img = cov
          ? '<img src="' + cov + '" alt="" loading="lazy" ' +
              'onerror="this.outerHTML=\'<div class=&quot;ath-no-cover&quot;></div>\'">'
          : '<div class="ath-no-cover"></div>';
        var tierClass = b.is_all_time_fav === 1 ? ' ath-all-time'
          : b.is_second_fav === 1 ? ' ath-second-fav' : '';
        return '<a class="ath-book' + tierClass + '" ' +
                  'href="' + BOOKS_HOST + '/' + USERNAME + '/#/book/' + b.id + '" ' +
                  'target="_blank" rel="noopener">' +
          img +
          '<div class="ath-title">' + esc(b.title) + '</div>' +
          '<div class="ath-author">' + esc(b.authors) + '</div>' +
        '</a>';
      };

      fetch(BOOKS_HOST + '/api/' + USERNAME + '/books?is_favorite=true&limit=200&sort=title')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !d.books || !d.books.length) {
            athLive.style.display = 'none';
            return;
          }
          var books = d.books;
          var allTime = books.filter(function (b) { return b.is_all_time_fav === 1; });

          var byGenre = {};
          GENRES.forEach(function (g) { byGenre[g] = []; });
          books.forEach(function (b) {
            var g = (b.manual_category && byGenre[b.manual_category]) ? b.manual_category : 'Other';
            byGenre[g].push(b);
          });
          var tier = function (b) {
            if (b.is_all_time_fav === 1) return 0;
            if (b.is_second_fav === 1) return 1;
            return 2;
          };
          GENRES.forEach(function (g) {
            byGenre[g].sort(function (a, b) {
              var t = tier(a) - tier(b);
              if (t !== 0) return t;
              var ar = a.rating || 0, br = b.rating || 0;
              if (br !== ar) return br - ar;
              return (a.sort_title || a.title || '').localeCompare(b.sort_title || b.title || '');
            });
            byGenre[g] = byGenre[g].slice(0, 5);
          });

          var html = '';
          if (allTime.length) {
            html += '<div class="ml-h">all-time favorites</div>';
            html += '<div class="ath-row">';
            allTime.forEach(function (b) { html += bookCard(b); });
            html += '</div>';
          }
          GENRES.forEach(function (g) {
            var items = byGenre[g];
            if (!items.length) return;
            html += '<div class="ml-h ml-h2">top ' + items.length + ' &middot; ' + g.toLowerCase() + '</div>';
            html += '<div class="ath-row">';
            items.forEach(function (b) { html += bookCard(b); });
            html += '</div>';
          });
          html += '<p class="cap"><span class="live-dot"></span>live from the Athenaeum DB</p>';
          athLive.innerHTML = html;
        })
        .catch(function () { athLive.style.display = 'none'; });
    }

    /* contact form — AJAX submit to the self-hosted /contact endpoint */
    var cform = document.getElementById('contactForm');
    if (cform) {
      var cstatus = document.getElementById('contactStatus');
      var setStatus = function (msg, ok) {
        if (!cstatus) return;
        cstatus.hidden = false;
        cstatus.textContent = msg;
        cstatus.style.color = ok ? 'var(--accent)' : '#d9534f';
      };
      cform.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = cform.querySelector('button[type=submit]');
        var label = btn.textContent;
        btn.disabled = true; btn.textContent = 'sending…';
        // FormData auto-encodes multipart so any attached files come along.
        var fd = new FormData(cform);
        fetch('/contact', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: fd
        })
          .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (res) {
            if (res.ok && res.j && res.j.ok) {
              cform.reset();
              setStatus('Thanks — your message was sent.', true);
            } else {
              setStatus((res.j && (res.j.detail || res.j.error)) || 'Something went wrong — try again, or reach me on LinkedIn.', false);
            }
          })
          .catch(function () { setStatus('Network error — try again, or reach me on LinkedIn.', false); })
          .finally(function () { btn.disabled = false; btn.textContent = label; });
      });
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
