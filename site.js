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
    /* resolve app links (Library / Athletic Analytics / login) to the right apex for
       this environment. Handles both the dev/local *.ggouger.localhost
       and prod *.gordongouger.com — when we're already on a subdomain
       (e.g. opened from athletic-analytics.<apex>), strip it so the data-app prefix
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

    /* Keep the portfolio's utility navigation consistent with every app. */
    var siteHead = document.querySelector('.site-head');
    var projectsLink = siteHead && siteHead.querySelector('.nav a[href$="projects.html"]');
    if (projectsLink) projectsLink.textContent = 'all projects';
    if (siteHead && !siteHead.querySelector('.site-auth')) {
      var siteAuth = document.createElement('a');
      siteAuth.className = 'site-auth';
      siteAuth.setAttribute('data-app', 'auth');
      siteAuth.href = location.protocol + '//auth.' + _base + '/';
      siteAuth.textContent = 'owner sign in';
      siteHead.appendChild(siteAuth);
    }

    /* ---- single sign-on ----
       Every app delegates authentication to the central Authelia portal so passkeys,
       recovery, lockout, and session policy are enforced in exactly one place. */
    (function () {
      var authEls = document.querySelectorAll('[data-app="auth"]');
      if (!authEls.length) return;
      var authHost = location.protocol + '//auth.' + _base;
      var authed = false;

      function renderButton(d) {
        var here = encodeURIComponent(location.href);
        authed = !!(d && d.authentication_level >= 1);
        authEls.forEach(function (el) {
          el.textContent = authed ? (d.username ? (d.username + ' · sign out') : 'sign out') : 'owner sign in';
          el.href = authed ? (authHost + '/logout?rd=' + here) : (authHost + '/?rd=' + here); /* no-JS fallback */
        });
      }
      function refresh() {
        return fetch('/__authstate', { credentials: 'include', headers: { 'Accept': 'application/json' } })
          .then(function (r) { if (!r.ok) throw 0; return r.json(); })
          .then(function (s) { renderButton(s && s.data); });
      }
      function logout() {
        fetch('/__authlogout', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: '{}' })
          .then(function () { return refresh(); })
          .catch(function () { location.href = authHost + '/logout'; });
      }

      authEls.forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          if (authed) logout();
          else location.href = authHost + '/?rd=' + encodeURIComponent(location.href);
        });
      });

      refresh().catch(function () { renderButton(null); });
    })();

    var btn = document.getElementById('themeBtn');
    if (btn) btn.addEventListener('click', function () {
      setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    });

    /* The portfolio embeds the separate tracker app as a compact, live poster.
       Local previews use its own local server; production uses the subdomain. */
    var trackerEmbed = document.getElementById('trackerEmbed');
    if (trackerEmbed) {
      var localTracker = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      trackerEmbed.addEventListener('load', function () {
        /* The preview is a poster, not a second scrollable website. Because the
           production embed is served from this origin, trim it to the terrain
           canvas and size that canvas to the frame. The full tracker remains
           interactive behind the adjacent link. */
        try {
          var frameDoc = trackerEmbed.contentDocument;
          if (!frameDoc || !frameDoc.head) return;
          var previewStyle = frameDoc.createElement('style');
          previewStyle.textContent =
            'html,body{height:100%!important;overflow:hidden!important}' +
            'body.embed main{height:100%!important;padding:0!important}' +
            'body.embed .tracker-grid,body.embed .poster-pane,body.embed .ribbon-lab-pane{height:100%!important;min-height:0!important}' +
            'body.embed .ribbon-lab-heading,body.embed .ribbon-progress-strip,body.embed .ribbon-insights,body.embed .terrain-switcher,body.embed .ribbon-key,body.embed .ribbon-help,body.embed .range-photo-heading,body.embed .range-photo-grid{display:none!important}' +
            'body.embed .terrain-webgl-shell{height:100%!important;min-height:0!important;border:0!important;border-radius:0!important;box-shadow:none!important}' +
            'body.embed .terrain-rotate-note,body.embed .terrain-axis-key{display:none!important}';
          frameDoc.head.appendChild(previewStyle);
          trackerEmbed.contentWindow.dispatchEvent(new Event('resize'));
        } catch (e) { /* Cross-origin local fallback keeps its normal embed view. */ }
      });
      trackerEmbed.src = localTracker
        ? 'http://localhost:8001/?embed=1&widget=ribbon-lab&v=preview-2'
        : '/14ers-app/?embed=1&widget=ribbon-lab&v=preview-2';
    }

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

    /* Live Athletic Analytics telemetry — safe, aligned weekly aggregates only.
       The preview deliberately tells a combined training story without exposing
       routes, dates, individual activities, or the private application shell. */
    var athleticsLive = document.getElementById('athletics-live');
    if (athleticsLive) {
      var renderAthletics = function (s, sample) {
        var fmt = function (n) { return (n || 0).toLocaleString('en-US'); };
        var training = Array.isArray(s.weekly_training) && s.weekly_training.length
          ? s.weekly_training
          : (s.weekly_miles || []).map(function (miles) { return { run_miles: miles, lift_sessions: 0 }; });
        var recent = training.slice(-4);
        var recentMiles = recent.reduce(function (sum, week) { return sum + (Number(week.run_miles) || 0); }, 0);
        var recentLifts = recent.reduce(function (sum, week) { return sum + (Number(week.lift_sessions) || 0); }, 0);
        var maxMiles = Math.max.apply(null, training.map(function (week) { return Number(week.run_miles) || 0; }).concat([1]));
        var maxLifts = Math.max.apply(null, training.map(function (week) { return Number(week.lift_sessions) || 0; }).concat([1]));
        var W = 176, runTop = 5, runH = 36, liftTop = 54, liftH = 12;
        var chart = training.length ? '<svg class="training-rhythm" viewBox="0 0 ' + W + ' 72" role="img" aria-label="Recent weekly running miles and lifting sessions">' +
          '<line class="training-grid" x1="0" x2="' + W + '" y1="46" y2="46"/><line class="training-grid" x1="0" x2="' + W + '" y1="69" y2="69"/>' +
          training.map(function (week, i) {
            var slot = W / training.length, x = i * slot + Math.max(1, slot * .18), width = Math.max(2, slot * .64);
            var miles = Number(week.run_miles) || 0, lifts = Number(week.lift_sessions) || 0;
            var runHeight = miles / maxMiles * runH, liftHeight = lifts / maxLifts * liftH;
            return '<rect class="run-bar" x="' + x.toFixed(1) + '" y="' + (runTop + runH - runHeight).toFixed(1) + '" width="' + width.toFixed(1) + '" height="' + runHeight.toFixed(1) + '" rx="1"/>' +
              '<rect class="lift-bar" x="' + x.toFixed(1) + '" y="' + (liftTop + liftH - liftHeight).toFixed(1) + '" width="' + width.toFixed(1) + '" height="' + liftHeight.toFixed(1) + '" rx="1"/>';
          }).join('') + '</svg>' : '<p class="training-empty">No recent weeks are available yet.</p>';
        var insight = recentMiles || recentLifts
          ? 'Last four weeks: ' + recentMiles.toFixed(1) + ' running miles and ' + fmt(recentLifts) + ' lift sessions.'
          : 'No recent training has been recorded in the four-week window.';
        athleticsLive.innerHTML =
          '<div class="preview-data-line"><span>' + (sample ? 'illustrative sample state' : 'last 16 weeks · aggregate only') + '</span><span>' + (sample ? 'sample' : '<i class="live-dot"></i>live') + '</span></div>' +
          '<div class="training-summary"><div><span class="training-number">' + (Number(s.this_week_miles) || 0).toFixed(1) + '</span><span>mi this week</span></div><div><span class="training-number">' + fmt(s.this_week_lift_sessions) + '</span><span>lifts this week</span></div><div><span class="training-number">' + (Number(s.this_month_miles) || 0).toFixed(1) + '</span><span>mi this month</span></div><div><span class="training-number">' + fmt(s.this_month_lift_sessions) + '</span><span>lifts this month</span></div></div>' +
          '<figure class="training-figure"><figcaption><span><i class="run-key"></i>running miles</span><span><i class="lift-key"></i>lifting sessions</span></figcaption>' + chart + '</figure>' +
          '<p class="training-insight">' + insight + '</p>';
      };
      var sampleAthletics = {
        weekly_training: [{run_miles: 3.2, lift_sessions: 1}, {run_miles: 5.1, lift_sessions: 2}, {run_miles: 4.0, lift_sessions: 1}, {run_miles: 6.4, lift_sessions: 2}],
        this_week_miles: 6.4, this_week_lift_sessions: 2, this_month_miles: 18.7, this_month_lift_sessions: 6
      };
      fetch('/__athletics/summary', { headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (s) {
          renderAthletics(s && s.ok ? s : sampleAthletics, !s || !s.ok);
        })
        .catch(function () { renderAthletics(sampleAthletics, true); });
    }

    /* Library shelf preview — pulls Gordon's favorited books straight from
       the public Library API (no proxy needed; CORS is open). Renders
       all-time favorites with a gold border, then a top-5 per genre. */
    var libraryLive = document.getElementById('library-live');
    if (libraryLive) {
      var BOOKS_HOST = 'https://library.gordongouger.com';
      var USERNAME = 'ggouger';
      var USER_ID = 2;

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
            libraryLive.style.display = 'none';
            return;
          }
          var books = d.books;
          var allTime = books.filter(function (b) { return b.is_all_time_fav === 1; });
          var tier = function (b) {
            if (b.is_all_time_fav === 1) return 0;
            if (b.is_second_fav === 1) return 1;
            return 2;
          };
          var ordered = books.slice().sort(function (a, b) {
            var t = tier(a) - tier(b);
            if (t !== 0) return t;
            var ar = a.rating || 0, br = b.rating || 0;
            if (br !== ar) return br - ar;
            return (a.sort_title || a.title || '').localeCompare(b.sort_title || b.title || '');
          });
          var shelf = allTime.concat(ordered.filter(function (b) { return allTime.indexOf(b) < 0; })).slice(0, 6);
          var html = '<div class="preview-data-line"><span>' + shelf.length + ' picks from the public shelf</span><span><i class="live-dot"></i>live</span></div><div class="ath-row">';
          shelf.forEach(function (b) { html += bookCard(b); });
          html += '</div>';
          libraryLive.innerHTML = html;
        })
        .catch(function () { libraryLive.style.display = 'none'; });
    }

    /* Colorado 14er project-page preview — the full list lives on the dedicated
       tracker subapp; this keeps the personal-site page light and visual. */
    var peakPreview = document.getElementById('peakPreview');
    if (peakPreview) {
      fetch('/peaks.json', { headers: { 'Accept': 'application/json' } })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (peaks) {
          return fetch('/summits.json', { headers: { 'Accept': 'application/json' } })
            .then(function (r) { if (!r.ok) throw 0; return r.json(); })
            .then(function (summits) { return { peaks: peaks, summits: summits || {} }; });
        })
        .then(function (data) {
          var peaks = data.peaks, summits = data.summits, done = peaks.filter(function (p) { return !!summits[p.slug]; });
          if (!Array.isArray(peaks) || peaks.length !== 58) throw 0;
          var paths = '', labels = '', ranges = ['Sawatch', 'San Juan', 'Sangre de Cristo', 'Elk', 'Front', 'Tenmile-Mosquito'];
          peaks.forEach(function (p) {
            var isDone = !!summits[p.slug], x = p.xy[0], y = p.xy[1], w = p.w, h = 175, cx = x + w / 2;
            var name = p.name.replace(/^Mount /, 'Mt. '), rangeClass = ranges.indexOf(p.range);
            paths += '<g class="peak' + (isDone ? ' is-done' : '') + ' range-' + rangeClass + '" aria-hidden="true"><title>' + name + ' · ' + p.elev.toLocaleString('en-US') + ' ft</title><path d="M ' + cx + ' ' + y + ' L ' + x + ' ' + (y + h) + ' L ' + (x + w) + ' ' + (y + h) + ' Z"/></g>';
            if (isDone) labels += '<text class="peak-label" x="' + cx + '" y="' + (y + h - 30) + '"><tspan class="peak-elev" x="' + cx + '" dy="0">' + p.elev.toLocaleString('en-US') + '</tspan><tspan x="' + cx + '" dy="14">' + name + '</tspan></text>';
          });
          peakPreview.innerHTML =
            '<a class="peak-preview-link" href="https://14ers.gordongouger.com" aria-label="Open the full 14er tracker">' +
              '<svg class="peak-poster" viewBox="0 0 700 980" role="img" aria-label="Colorado 14ers — ' + done.length + ' of 58 summited">' + paths + labels + '</svg>' +
            '</a>' +
            '<div class="peak-stats"><div class="stat"><span class="n">' + done.length + ' / 58</span><span class="l">summited</span></div><div class="stat"><span class="n">full tracker ↗</span><span class="l">14ers.gordongouger.com</span></div></div>';
        })
        .catch(function () { peakPreview.innerHTML = '<p class="cap">The peak preview could not load. Try reloading this page.</p>'; });
    }

    /* Colorado 14er tracker — fixed peak reference data plus a tiny, personal
       summit log. This deliberately stays client-side: both files are static,
       same-origin JSON and a summit entry updates every view at once. */
    var peakMap = document.getElementById('peakMap');
    var peakList = document.getElementById('peakList');
    if (peakMap && peakList) {
      var PEAK_RANGES = ['Sawatch', 'San Juan', 'Sangre de Cristo', 'Elk', 'Front', 'Tenmile-Mosquito'];
      var escPeak = function (s) {
        var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML;
      };
      var num = function (n) { return Number(n || 0).toLocaleString('en-US'); };
      var prettyDate = function (s) {
        var d = /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? new Date(s + 'T12:00:00') : null;
        return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : escPeak(s || 'date unknown');
      };
      var failPeaks = function () {
        peakMap.innerHTML = '<p class="cap">The peak graphic could not load. Try reloading this page.</p>';
        peakList.innerHTML = '<p class="cap">The summit list could not load. Try reloading this page.</p>';
      };

      Promise.all([
        fetch('/peaks.json', { headers: { 'Accept': 'application/json' } }).then(function (r) { if (!r.ok) throw 0; return r.json(); }),
        fetch('/summits.json', { headers: { 'Accept': 'application/json' } }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      ]).then(function (data) {
        var peaks = data[0], summits = data[1] || {};
        if (!Array.isArray(peaks) || peaks.length !== 58) throw 0;
        var done = peaks.filter(function (p) { return !!summits[p.slug]; });
        var byRange = {};
        PEAK_RANGES.forEach(function (range) { byRange[range] = []; });
        peaks.forEach(function (p) { if (byRange[p.range]) byRange[p.range].push(p); });
        var complete = PEAK_RANGES.filter(function (range) {
          return byRange[range].length && byRange[range].every(function (p) { return !!summits[p.slug]; });
        }).length;
        var highest = done.length ? done.reduce(function (a, b) { return a.elev > b.elev ? a : b; }) : null;
        var summitFeet = done.reduce(function (sum, p) { return sum + p.elev; }, 0);
        var paths = '', labels = '';

        peaks.forEach(function (p) {
          var isDone = !!summits[p.slug], x = p.xy[0], y = p.xy[1], w = p.w, h = 175, cx = x + w / 2;
          var rangeClass = PEAK_RANGES.indexOf(p.range);
          paths += '<g class="peak' + (isDone ? ' is-done' : '') + ' range-' + rangeClass + '" data-slug="' + escPeak(p.slug) + '" aria-hidden="true">' +
            '<title>' + escPeak(p.name + ' · ' + num(p.elev) + ' ft' + (isDone ? ' · summited' : '')) + '</title>' +
            '<path d="M ' + cx + ' ' + y + ' L ' + x + ' ' + (y + h) + ' L ' + (x + w) + ' ' + (y + h) + ' Z"/></g>';
          if (isDone) {
            labels += '<text class="peak-label" x="' + cx + '" y="' + (y + h - 30) + '"><tspan class="peak-elev" x="' + cx + '" dy="0">' + num(p.elev) + '</tspan><tspan x="' + cx + '" dy="14">' + escPeak(p.name.replace(/^Mount /, 'Mt. ')) + '</tspan></text>';
          }
        });

        peakMap.innerHTML =
          '<svg class="peak-poster" viewBox="0 0 700 980" role="img" aria-label="Colorado 14ers — ' + done.length + ' of 58 summited">' + paths + labels + '</svg>' +
          '<div class="peak-stats">' +
            '<div class="stat"><span class="n">' + done.length + ' / 58</span><span class="l">summited</span></div>' +
            '<div class="stat"><span class="n">' + (highest ? escPeak(highest.name.replace(/^Mount /, 'Mt. ')) : '—') + '</span><span class="l">highest</span></div>' +
            '<div class="stat"><span class="n">' + complete + ' / 6</span><span class="l">ranges complete</span></div>' +
            '<div class="stat"><span class="n">' + (summitFeet ? num(summitFeet) : '—') + '</span><span class="l">summit feet</span></div>' +
          '</div>';

        var listHtml = '';
        PEAK_RANGES.forEach(function (range) {
          var rangePeaks = byRange[range];
          listHtml += '<section class="range-group"><p class="label"><span class="hash">#</span> ' + escPeak(range.toLowerCase()) + ' <span class="range-count">' + rangePeaks.filter(function (p) { return !!summits[p.slug]; }).length + '/' + rangePeaks.length + '</span></p>';
          rangePeaks.forEach(function (p) {
            var s = summits[p.slug], log = '';
            if (s) {
              log = '<div class="peak-log">summited ' + prettyDate(s.date);
              if (s.strava) log += '<a href="' + escPeak(s.strava) + '" target="_blank" rel="noopener">Strava <span class="ext">↗</span></a>';
              if (s.note) log += '<span class="peak-note"> · ' + escPeak(s.note) + '</span>';
              log += '</div>';
            }
            listHtml += '<div class="peak-row' + (s ? ' is-done' : '') + '" id="peak-' + escPeak(p.slug) + '">' +
              '<div class="peak-name">' + escPeak(p.name) + (p.ranked ? '' : '<span class="unranked">unranked</span>') + '</div>' +
              '<div class="peak-meta">' + num(p.elev) + ' ft · class ' + p.class + '</div>' + log + '</div>';
          });
          listHtml += '</section>';
        });
        peakList.innerHTML = listHtml;

        Array.prototype.slice.call(peakMap.querySelectorAll('.peak')).forEach(function (el) {
          el.addEventListener('click', function () {
            var row = document.getElementById('peak-' + el.dataset.slug);
            if (!row) return;
            row.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
            row.classList.remove('peak-flash');
            void row.offsetWidth;
            row.classList.add('peak-flash');
            if (!reduce) setTimeout(function () { row.classList.remove('peak-flash'); }, 1000);
          });
        });
      }).catch(failPeaks);
    }

    /* contact form — AJAX submit to the self-hosted /contact endpoint */
    var cform = document.getElementById('contactForm');
    if (cform) {
      var cstatus = document.getElementById('contactStatus');
      var turnstileWidgetId = null;
      var setStatus = function (msg, ok) {
        if (!cstatus) return;
        cstatus.hidden = false;
        cstatus.textContent = msg;
        cstatus.style.color = ok ? 'var(--accent)' : '#d9534f';
      };
      fetch('/contact/config', { headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (cfg) {
          if (!cfg.turnstile_site_key) throw new Error('missing site key');
          var renderTurnstile = function () {
            if (!window.turnstile) return setTimeout(renderTurnstile, 100);
            turnstileWidgetId = window.turnstile.render('#turnstileWidget', {
              sitekey: cfg.turnstile_site_key,
              action: 'contact',
              theme: 'auto',
              appearance: 'interaction-only'
            });
          };
          renderTurnstile();
        })
        .catch(function () { setStatus('Message verification is unavailable — please try again later.', false); });
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
          .finally(function () {
            btn.disabled = false; btn.textContent = label;
            if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
          });
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
