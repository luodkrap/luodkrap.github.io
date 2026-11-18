/* 박도울 웹 포트폴리오 — 움직임과 상호작용. 이 파일이 죽어도 내용은 전부 보인다(숨김은 html.anim 아래에만 있고, 머리의 타이머가 그 클래스를 걷어 낸다). */
(function () {
  'use strict';
  var w = window, d = document, html = d.documentElement;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var editing = !!w.__edit, lenis = null;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  var relayouts = [];
  function relayout() { relayouts.forEach(function (f) { f(); }); if (lenis) lenis.resize(); }
  w.__site = 1;

  /* 1. 부드러운 스크롤(Lenis) — 움직임 줄이기 설정이거나 편집 모드면 켜지 않는다 */
  var gsap = w.gsap, ST = w.ScrollTrigger;
  if (gsap && ST) { gsap.registerPlugin(ST); ST.config({ ignoreMobileResize: true }); relayouts.push(function () { ST.refresh(); }); }
  if (!reduce && !editing && w.Lenis) {
    try {
      lenis = new w.Lenis({ lerp: 0.11 });
      if (gsap && ST) {
        lenis.on('scroll', ST.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        (function loop(t) { lenis.raf(t); w.requestAnimationFrame(loop); })(w.performance.now());
      }
    } catch (e) { lenis = null; }
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1), el = id && d.getElementById(id);
    if (!el) return;
    e.preventDefault();
    var top = id === 'top' ? 0 : Math.round(el.getBoundingClientRect().top + w.scrollY - 56);
    if (lenis) lenis.scrollTo(top, { duration: 1.1 });
    else w.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    try { w.history.replaceState(null, '', id === 'top' ? w.location.pathname : '#' + id); } catch (err) { /* file:// */ }
  });

  /* 1-2. 홈 머리 — 들어오면 화면 가득 릴, 스크롤하면 이름 옆 칸으로 줄어들고 글·SNS 가 드러난다 */
  var top = $('.top');
  if (top && html.classList.contains('pin') && gsap && ST) {
    var stage = $('.top-stage'), inner = $('.top-inner'), reel = $('.top-reel'), slot = $('.top-slot'), strip = $('.chan-wrap'), rect = {};
    var fits = function () { return inner.scrollHeight <= stage.clientHeight + 1; };
    if (!fits() && strip && strip.parentNode === inner) { top.parentNode.insertBefore(strip, top.nextSibling); strip.classList.add('chan-out'); }   /* 폰: SNS 띠는 머리 다음으로 */
    if (!fits()) {
      html.classList.remove('pin');
    } else {
      var measure = function () {
        var sr = stage.getBoundingClientRect(), r = slot.getBoundingClientRect();
        rect = { top: r.top - sr.top, left: r.left - sr.left, width: r.width, height: r.height };
      };
      measure();
      ST.addEventListener('refreshInit', measure);
      var fade = [$('.top-name'), $('.top-side')];
      if (strip && strip.parentNode === inner) fade.push(strip);
      gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: top, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true,
        onUpdate: function (st) { html.classList.toggle('past-hero', st.progress > 0.42); } } })
        .to('.top-over', { autoAlpha: 0, y: -30, duration: 0.18 }, 0)
        .to('.top-scrim', { opacity: 0, duration: 0.3 }, 0)
        .fromTo(reel,
          { top: 0, left: 0, width: function () { return stage.clientWidth; }, height: function () { return stage.clientHeight; } },
          { top: function () { return rect.top; }, left: function () { return rect.left; }, width: function () { return rect.width; }, height: function () { return rect.height; }, duration: 0.6, ease: 'power2.inOut' }, 0.05)
        .fromTo(fade, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.06, ease: 'power2.out' }, 0.42)
        .to({}, { duration: 0.12 });
      if (w.location.hash) { var tgt = d.getElementById(w.location.hash.slice(1)); if (tgt) w.scrollTo(0, tgt.getBoundingClientRect().top + w.scrollY); }
    }
  } else if (top) {
    html.classList.remove('pin');
  }

  /* 2. 등장 — 첫 화면 글자, 그리고 화면에 들어올 때 한 번 */
  var rv = $$('[data-rv]');
  if (html.classList.contains('anim') && 'IntersectionObserver' in w) {
    var io = new w.IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }
  w.requestAnimationFrame(function () { w.requestAnimationFrame(function () { html.classList.add('ready'); }); });

  /* 3. 영상 — 화면에 들어왔을 때만 돈다. 포스터와 글이 먼저 뜨도록 load 뒤에 받기 시작한다 */
  var autos = $$('video[data-auto]');
  if (reduce) {
    autos.forEach(function (v) { v.controls = true; v.removeAttribute('aria-hidden'); });
  } else if ('IntersectionObserver' in w) {
    var vio = new w.IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) play(e.target); else e.target.pause(); });
    }, { threshold: 0.15 });
    var startAutos = function () { autos.forEach(function (v) { vio.observe(v); }); };
    if (d.readyState === 'complete') startAutos(); else w.addEventListener('load', startAutos);
  }

  /* 4. 모자이크 칸 영상 — 화면에 들어오면 무음으로 돈다(움직임 줄이기면 포스터만) */
  $$('.m-media.has-video').forEach(function (m) {
    var v = $('video', m);
    v.addEventListener('playing', function () { m.classList.add('playing'); });
    if (reduce || !('IntersectionObserver' in w)) return;
    var mio = new w.IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) play(v); else v.pause(); });
    }, { threshold: 0.3 });
    var go = function () { mio.observe(m); };
    if (d.readyState === 'complete') go(); else w.addEventListener('load', go);
  });

  /* 5. 모자이크 줄 맞춤 — 그림을 자르지 않고, 줄마다 높이를 같게 맞춰 폭을 꽉 채운다.
        JS 가 없으면 CSS flex-grow 만으로 비슷하게 깔린다. */
  var grid = $('[data-grid]'), list = $('[data-list]');
  function justify() {
    if (!grid || grid.hidden) return;
    var cs = w.getComputedStyle(grid);
    var items = $$('.m', grid).filter(function (el) { return !el.hidden; });
    var W = grid.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var gap = parseFloat(cs.columnGap) || 16;
    var H = W < 700 ? Math.max(118, W * 0.4) : Math.min(300, Math.max(170, W * 0.165));
    var r = items.map(function (el) { return parseFloat(el.style.getPropertyValue('--r')) || 1.7778; });
    var n = r.length, best = [0], from = [0], i, j;
    /* 줄 나누기 — 줄 높이가 목표에서 벗어난 정도(제곱)의 합이 가장 작게. 마지막 줄은 덜 차도 된다 */
    for (j = 1; j <= n; j++) {
      best[j] = Infinity;
      var sum = 0;
      for (i = j - 1; i >= 0; i--) {
        sum += r[i];
        var h = (W - gap * (j - i - 1)) / sum;
        if (h < H * 0.5 && j - i > 1) break;
        var cost = (j === n && h > H) ? 0 : Math.pow((h - H) / H, 2) + (h > H * 1.6 ? 3 : 0);
        if (best[i] + cost < best[j]) { best[j] = best[i] + cost; from[j] = i; }
      }
    }
    var rows = [];
    for (j = n; j > 0; j = from[j]) rows.unshift([from[j], j]);
    rows.forEach(function (row) {
      var a = row[0], b = row[1], s2 = 0, k;
      for (k = a; k < b; k++) s2 += r[k];
      var h2 = (W - gap * (b - a - 1)) / s2;
      if (b === n && h2 > H) h2 = H;
      if (h2 > H * 1.6) h2 = H * 1.6;
      for (k = a; k < b; k++) {
        items[k].style.flex = '0 0 ' + (Math.floor(r[k] * h2 * 100) / 100) + 'px';
        items[k].style.maxWidth = 'none';
      }
    });
    grid.classList.add('just');
  }
  relayouts.push(justify);

  /* 6. 거르기와 보기 전환 */
  if (grid) {
    var fbtns = $$('.fw'), vbtns = $$('[data-view]'), cur = '', view = 'grid';
    var has = function (el) { return !cur || (el.getAttribute('data-tags') || '').split('|').indexOf(cur) >= 0; };
    var apply = function () {
      $$('.m', grid).forEach(function (t) { t.hidden = !has(t); });
      if (list) $$('li', list).forEach(function (li) { li.hidden = li.hasAttribute('data-group') ? !!cur : !has(li); });
      fbtns.forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-filter') || '') === cur)); });
      vbtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === view)); });
      grid.hidden = view !== 'grid';
      if (list) { list.removeAttribute('data-init'); list.hidden = view !== 'list'; }
      justify();
      try { w.sessionStorage.setItem('pf-list', JSON.stringify([cur, view])); } catch (e) { /* 저장 못 해도 된다 */ }
    };
    var change = function () {
      if (!reduce && d.startViewTransition) { var t = d.startViewTransition(apply); if (t && t.finished) t.finished.then(relayout, relayout); }
      else { apply(); relayout(); }
    };
    fbtns.forEach(function (b) { b.addEventListener('click', function () { cur = b.getAttribute('data-filter') || ''; change(); }); });
    vbtns.forEach(function (b) { b.addEventListener('click', function () { view = b.getAttribute('data-view'); change(); }); });
    try {
      var saved = JSON.parse(w.sessionStorage.getItem('pf-list') || 'null');
      if (saved && (saved[0] || saved[1] === 'list')) {
        if (fbtns.some(function (b) { return b.getAttribute('data-filter') === saved[0]; })) cur = saved[0];
        if (saved[1] === 'list' && list) view = 'list';
      }
    } catch (e) { /* 처음 상태 그대로 */ }
    apply();
    var rt = null;
    if ('ResizeObserver' in w) new w.ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(justify, 60); }).observe(grid);
    else w.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(justify, 100); });
  }

  /* 7. 나란히 비교 — 클립 재생 또는 드래그 경계선 */
  $$('[data-pair]').forEach(function (p) {
    if (p.getAttribute('data-pair') === 'clip') {
      var b = $('[data-clip-toggle]', p), box = $('.pair-clip', p), v = $('video', box);
      b.addEventListener('click', function () {
        var on = !p.classList.contains('is-clip');
        p.classList.toggle('is-clip', on); box.hidden = !on;
        b.textContent = b.getAttribute(on ? 'data-on' : 'data-off');
        if (on) { v.currentTime = 0; play(v); } else v.pause();
        relayout();
      });
    } else {
      var c = $('.cmp', p), r = $('input', c), t = $('[data-cmp-toggle]', p);
      var set = function (on) { p.classList.toggle('is-cmp', on); c.hidden = !on; t.textContent = t.getAttribute(on ? 'data-on' : 'data-off'); };
      r.addEventListener('input', function () { c.style.setProperty('--pos', r.value + '%'); });
      t.addEventListener('click', function () { set(!p.classList.contains('is-cmp')); relayout(); });
      set(true);
    }
  });

  /* 8. 프레임 확대(PhotoSwipe) */
  if (w.PhotoSwipeLightbox && w.PhotoSwipe && $('a.zoom')) {
    var lb = new w.PhotoSwipeLightbox({ gallery: '#main', children: 'a.zoom', pswpModule: w.PhotoSwipe, bgOpacity: 1,
      showHideAnimationType: reduce ? 'none' : 'zoom', padding: { top: 48, bottom: 48, left: 20, right: 20 } });
    lb.on('beforeOpen', function () { if (lenis) lenis.stop(); });
    lb.on('destroy', function () { if (lenis) lenis.start(); });
    lb.init();
  }

  /* 9. 유튜브 — 누른 뒤에만 youtube-nocookie 를 부른다 */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-yt]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var id = a.getAttribute('data-yt');
    if (!/^[\w-]{6,20}$/.test(id)) return;
    e.preventDefault();
    var box = d.createElement('div');
    box.className = 'yt';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', (a.getAttribute('data-title') || '') + ' 영상');
    box.innerHTML = '<button type="button" class="yt-close">닫기</button><div class="yt-box"><iframe title="YouTube" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1"></iframe></div>';
    var key = function (ev) { if (ev.key === 'Escape') close(); };
    var close = function () { box.remove(); d.removeEventListener('keydown', key); if (lenis) lenis.start(); a.focus(); };
    box.addEventListener('click', function (ev) { if (ev.target === box || ev.target.className === 'yt-close') close(); });
    d.addEventListener('keydown', key);
    d.body.appendChild(box);
    if (lenis) lenis.stop();
    $('.yt-close', box).focus();
  });

  /* 10. 화면 테마 — 흰 바탕이 기본. 머리의 단추로 다크를 켜고 끄며, 고른 값은 이 브라우저에만 남는다(localStorage pf-theme).
         첫 그림 전에 머리의 작은 스크립트가 같은 값을 먼저 입혀 깜박이지 않는다. 바뀌는 순간은 단추 자리에서 원이 퍼지며 덮는다 */
  var themeBtn = $('[data-theme-toggle]'), themeMeta = $('meta[name="theme-color"]');
  function setTheme(dark, keep) {
    if (dark) html.setAttribute('data-theme', 'dark'); else html.removeAttribute('data-theme');
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#121212' : '#ffffff');
    if (keep) { try { w.localStorage.setItem('pf-theme', dark ? 'dark' : 'light'); } catch (e) { /* 저장 못 해도 이번 화면은 바뀐다 */ } }
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var dark = html.getAttribute('data-theme') !== 'dark';
      if (reduce || !d.startViewTransition) { setTheme(dark, true); return; }
      var r = themeBtn.getBoundingClientRect(), x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
      var R = Math.ceil(Math.hypot(Math.max(x, w.innerWidth - x), Math.max(y, w.innerHeight - y)));
      html.classList.add('vt-theme');
      var done = function () { html.classList.remove('vt-theme'); };
      try {
        var t = d.startViewTransition(function () { setTheme(dark, true); });
        t.ready.then(function () {
          html.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)'] },
            { duration: 640, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' });
        }, function () { /* 전환이 건너뛰어져도 색은 이미 바뀌었다 */ });
        t.finished.then(done, done);
      } catch (e) { done(); setTheme(dark, true); }
    });
  }
  /* 뒤로 가기로 되살아난 쪽(bfcache)은 다른 쪽에서 바꾼 테마를 다시 읽는다 */
  w.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    try { var v = w.localStorage.getItem('pf-theme'); if (v) setTheme(v === 'dark', false); } catch (err) { /* 그대로 둔다 */ }
  });

  /* 글꼴이 바뀌어 높이가 달라지면 다시 잰다 */
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(relayout);
  w.addEventListener('load', relayout);
})();
