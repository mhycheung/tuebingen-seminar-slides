// rd-filter part: three slides around the rational filter.
// rd-filter-ringdown: Re h_22 of SXS:BBH:0305, ringdown highlighted (copied from the seminar_SBU
//   ringdown part, slide ringdown-title). No stages.
// rd-filter-sweep2: two free-QNM fits of SXS:BBH:0305 h_22 swept over the start time t0, waveform
//   and complex plane (copied from the seminar_SBU qnm-fit part, slide qnm-fit-sweep2).
// rd-filter-demo: |Re h_22| of SXS:BBH:0305 on a log scale, then the rational filter applied
//   for 220, 221 and 222 in turn, with fixed-frequency 221 and 222 fits in between
//   (data: src/make_rd_filter_data.py).
// Times in M_f, t = 0 at the peak of |h22|; frequencies as M_f omega.
(function () {
  "use strict";

  // ======================= rd-filter-ringdown =======================
  // Canvas backing store matched to its on-screen size; returns the scale.
  function fitCanvas(c) {
    var r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    var w = Math.max(50, Math.round(r.width * dpr)), h = Math.max(50, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return w / c.offsetWidth;
  }

  // One requestAnimationFrame loop per slide, running while the slide is shown.
  function Runner(frame) {
    var raf = null;
    function tick(now) { frame(now); raf = requestAnimationFrame(tick); }
    return {
      start: function () { if (!raf) raf = requestAnimationFrame(tick); },
      stop: function () { if (raf) cancelAnimationFrame(raf); raf = null; }
    };
  }

  // The ringdown, t > 0, is drawn in HL_COLOR on a pale band; both fade in over [-HL_EDGE, 0] M_f.
  (function () {
    var W = window.RDFILTER_TITLE, HL_COLOR = "31, 119, 180", HL_EDGE = 8, BAND = 0.13;
    var canvas, run, drawn = 0;
    function draw() {
      var k = fitCanvas(canvas);
      if (k === drawn) return;
      drawn = k;
      var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
      var t0 = W.tStart, t1 = W.t[W.t.length - 1], amax = 0;
      W.re.forEach(function (v) { amax = Math.max(amax, Math.abs(v)); });
      function X(t) { return (t - t0) / (t1 - t0) * w; }
      function Y(v) { return h / 2 - v / amax * 0.46 * h; }
      ctx.clearRect(0, 0, w, h);
      var g = ctx.createLinearGradient(X(-HL_EDGE), 0, X(0), 0);
      g.addColorStop(0, "rgba(" + HL_COLOR + ", 0)");
      g.addColorStop(1, "rgba(" + HL_COLOR + ", " + BAND + ")");
      ctx.fillStyle = g;
      ctx.fillRect(X(-HL_EDGE), 0, w - X(-HL_EDGE), h);
      var gl = ctx.createLinearGradient(X(-HL_EDGE), 0, X(0), 0);
      gl.addColorStop(0, "#333");
      gl.addColorStop(1, "rgb(" + HL_COLOR + ")");
      ctx.strokeStyle = gl;
      ctx.lineWidth = 5 * k;
      ctx.lineJoin = "round";
      ctx.beginPath();
      W.t.forEach(function (t, i) {
        if (t < t0) return;
        var x = X(t), y = Y(W.re[i]);
        if (t === W.t[0] || W.t[i - 1] < t0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    Deck.widget("rd-filter-ringdown", {
      steps: 0,
      enter: function (slide) {
        canvas = slide.querySelector("#rd-filter-title-wave");
        drawn = 0;
        run = Runner(draw);  // redraws only when the on-screen size changes
        run.start();
      },
      leave: function () { run.stop(); },
      step: function () { draw(); }
    });
  })();

  // ======================= shared plotting =======================
  var WAVE = "#333333";                  // waveform: very dark grey, apart from the black frame
  var WAVE_UNUSED = "#c8c8c8";           // waveform before the fit window; earlier curves
  var FIT_COLOR = "#d62728";             // fits (matplotlib C3)
  var MODE_COLORS = ["#1f77b4", "#ff7f0e"];  // fitted frequencies: matplotlib C0, C1

  // Canvas whose backing store matches its on-screen size in device pixels; drawing is in
  // slide pixels (its CSS size).
  function setup(canvas) {
    var cssW = parseFloat(canvas.style.width), cssH = parseFloat(canvas.style.height);
    var s = canvas.getBoundingClientRect().width * (window.devicePixelRatio || 1) / cssW;
    s = Math.max(s, 0.25);
    var bw = Math.round(cssW * s), bh = Math.round(cssH * s);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    var ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bh);
    ctx.setTransform(bw / cssW, 0, 0, bh / cssH, 0, 0);
    return { ctx: ctx, w: cssW, h: cssH };
  }

  // Axes box with ticks; returns the data -> slide-pixel maps.
  function frame(c, xr, yr, xticks, yticks, fmtx, fmty) {
    var L = 110, R = c.w - 40, T = 25, B = c.h - 60, ctx = c.ctx;
    var X = function (x) { return L + (x - xr[0]) / (xr[1] - xr[0]) * (R - L); };
    var Y = function (y) { return B - (y - yr[0]) / (yr[1] - yr[0]) * (B - T); };
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(L, T, R - L, B - T);
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    xticks.forEach(function (x) {
      ctx.beginPath(); ctx.moveTo(X(x), B); ctx.lineTo(X(x), B - 12); ctx.stroke();
      ctx.fillText(fmtx(x), X(x), B + 10);
    });
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    yticks.forEach(function (y) {
      ctx.beginPath(); ctx.moveTo(L, Y(y)); ctx.lineTo(L + 12, Y(y)); ctx.stroke();
      ctx.fillText(fmty(y), L - 10, Y(y));
    });
    return { X: X, Y: Y, L: L, R: R, T: T, B: B };
  }

  function range(a, b, d) { var r = []; for (var x = a; x <= b + 1e-9; x += d) r.push(+x.toFixed(6)); return r; }
  function fixed(n) { return function (x) { return x.toFixed(n); }; }

  function clip(c, f) {
    c.ctx.save();
    c.ctx.beginPath();
    c.ctx.rect(f.L, f.T, f.R - f.L, f.B - f.T);
    c.ctx.clip();
  }

  // ======================= rd-filter-sweep2 =======================
  var D = window.RDFILTER_FIT;
  var Wv = D.wave;
  var STAGE_K = [null, 0, 1, 2, 3, 4];   // t0 / M_f shown at stages 1-5
  var SWEEP_STAGE = STAGE_K.length;      // stage 6 on: sweep from t0 = 4 to 50 M_f
  var SWEEP_RATE = 46 / 6000;            // M_f per ms: t0 = 4 -> 50 in 6 s

  function kIndex(k) { return Math.round(k * 10); }  // D.k = 0, 0.1, ..., 50

  // Waveform samples with t0 <= t <= t1 (plus one either side), in `color`.
  function drawWave(c, f, t0, t1, color) {
    var ctx = c.ctx, started = false;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (var i = 0; i < Wv.t.length; i++) {
      if (Wv.t[i + 1] < t0 || Wv.t[i - 1] > t1) continue;
      var x = f.X(Wv.t[i]), y = f.Y(Wv.re[i]);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function cross(p, x, y) {
    var a = 14;
    [["#fff", 9], ["#000", 4]].forEach(function (st) {
      p.strokeStyle = st[0];
      p.lineWidth = st[1];
      p.beginPath();
      p.moveTo(x - a, y - a); p.lineTo(x + a, y + a);
      p.moveTo(x - a, y + a); p.lineTo(x + a, y - a);
      p.stroke();
    });
  }

  var LX = [-20, 80];
  var LYR = [-0.42, 0.6];                // headroom above the waveform for the window arrow
  var YT = [-0.4, -0.2, 0, 0.2, 0.4];

  // Left panel: waveform (light before t0), fit window, arrow, reconstruction of fit `F` at index cur.
  function drawLeft(slide, F, cur) {
    var cl = setup(slide.querySelector(".rd-filter-left"));
    var fl = frame(cl, LX, LYR, range(-20, 80, 20), YT, fixed(0), fixed(1));
    var ctx = cl.ctx;
    clip(cl, fl);
    if (cur < 0) { drawWave(cl, fl, LX[0], LX[1], WAVE); ctx.restore(); return; }
    var t0 = D.k[cur];
    ctx.fillStyle = "#ededed";
    ctx.fillRect(fl.X(t0), fl.T, fl.R - fl.X(t0), fl.B - fl.T);
    drawWave(cl, fl, LX[0], t0, WAVE_UNUSED);
    drawWave(cl, fl, t0, LX[1], WAVE);
    ctx.strokeStyle = FIT_COLOR;
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    for (var t = t0; t <= LX[1]; t += 0.25) {
      // jaxqualin model h = sum A exp(-i[(wr + i wi) t + phi]); Re h = sum A e^{wi t} cos(wr t + phi)
      var h = 0;
      for (var j = 0; j < F.A[cur].length; j++)
        h += F.A[cur][j] * Math.exp(F.wi[cur][j] * t) * Math.cos(F.wr[cur][j] * t + F.phi[cur][j]);
      if (t === t0) ctx.moveTo(fl.X(t), fl.Y(h)); else ctx.lineTo(fl.X(t), fl.Y(h));
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // "fitting window" arrow, starting at t0 and pointing right
    var x0 = fl.X(t0), x1 = x0 + 170, y = fl.Y(0.52);
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - 4, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - 18, y - 9); ctx.lineTo(x1 - 18, y + 9); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x0, y - 14); ctx.lineTo(x0, y + 14); ctx.stroke();
    ctx.font = "30px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("fitting window", x0 + 4, y - 12);
    ctx.restore();
  }

  // One sweep slide. opt: id, fit (one entry per t0, lists over modes), plane {x, y, xt, yt},
  // markers [{w, label, from}] (from: first stage at which the marker shows), pauses (t0 / M_f
  // at which the sweep stops until the next key press).
  function sweep(opt) {
    var F = opt.fit, raf = null, state = null, onResize = null;

    function draw(slide, stage, cur, trail, moving) {
      drawLeft(slide, F, cur);
      var cv = slide.querySelector(".rd-filter-right");
      var cr = setup(cv);
      var fr = frame(cr, opt.plane.x, opt.plane.y, opt.plane.xt, opt.plane.yt, fixed(2), fixed(2));
      var p = cr.ctx;
      clip(cr, fr);
      for (var j = 0; j < F.wr[0].length; j++) {
        p.fillStyle = MODE_COLORS[j];
        p.globalAlpha = 0.35;
        trail.forEach(function (i) {
          p.beginPath(); p.arc(fr.X(F.wr[i][j]), fr.Y(-F.wi[i][j]), 6, 0, 2 * Math.PI); p.fill();
        });
        p.globalAlpha = 1;
        if (cur >= 0) {
          p.beginPath(); p.arc(fr.X(F.wr[cur][j]), fr.Y(-F.wi[cur][j]), 15, 0, 2 * Math.PI); p.fill();
        }
      }
      opt.markers.forEach(function (m) {
        var el = slide.querySelector(".rd-filter-q" + m.label);
        var on = stage >= m.from;
        el.style.visibility = on ? "visible" : "hidden";
        if (!on) return;
        var qx = fr.X(m.w[0]), qy = fr.Y(-m.w[1]);
        cross(p, qx, qy);
        el.style.left = (parseFloat(cv.style.left) + qx + 14) + "px";
        el.style.top = (parseFloat(cv.style.top) + qy - 70) + "px";
      });
      p.restore();
      var t0el = slide.querySelector(".rd-filter-t0");
      if (cur < 0) t0el.innerHTML = "";
      else {
        // whole numbers while the sweep runs; one decimal when it rests on a non-integer t0
        var k = D.k[cur], txt = moving || Math.abs(k - Math.round(k)) < 1e-6 ? String(Math.round(k)) : k.toFixed(1);
        katex.render("t_0 = " + txt + "\\, M_f", t0el);
      }
    }

    // The sweep after the fixed stages runs in segments between opt.pauses, one step each, at
    // SWEEP_RATE M_f per ms. Stage SWEEP_STAGE + s plays segment s.
    var ends = [STAGE_K[SWEEP_STAGE - 1]].concat(opt.pauses || [], [50]);

    // Trail and current index at a stage; k is t0 / M_f during (and after) the sweep.
    function show(slide, stage, k, moving) {
      state = { stage: stage, k: k };
      var trail = [], s;
      for (s = 1; s < Math.min(stage, SWEEP_STAGE); s++) trail.push(kIndex(STAGE_K[s]));
      if (stage === 0) return draw(slide, stage, -1, trail);
      if (stage < SWEEP_STAGE) return draw(slide, stage, kIndex(STAGE_K[stage]), trail);
      var k0 = ends[0], cur = kIndex(k);
      trail.push(kIndex(k0));
      for (var i = kIndex(k0) + 1; i < cur; i++) trail.push(i);
      draw(slide, stage, cur, trail, moving);
    }

    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

    Deck.widget(opt.id, {
      steps: SWEEP_STAGE - 1 + ends.length - 1,
      enter: function (slide) {
        onResize = function () { if (state) show(slide, state.stage, state.k); };
        window.addEventListener("resize", onResize);
      },
      leave: function () { stop(); window.removeEventListener("resize", onResize); },
      step: function (slide, stage, dir) {
        stop();
        if (stage < SWEEP_STAGE) { show(slide, stage, 0); return; }
        var a = ends[stage - SWEEP_STAGE], b = ends[stage - SWEEP_STAGE + 1];
        if (dir < 0) { show(slide, stage, b); return; }
        var start = null, ms = (b - a) / SWEEP_RATE;
        (function tick(now) {
          if (start === null) start = now;
          var u = Math.max(0, Math.min(1, (now - start) / ms));  // rAF time may precede start
          show(slide, stage, a + (b - a) * u, u < 1);
          raf = u < 1 ? requestAnimationFrame(tick) : null;
        })(performance.now());
      }
    });
  }

  // Two modes; the sweep runs from t0 = 4 to 50 M_f without a pause.
  sweep({
    id: "rd-filter-sweep2", fit: D.fit2,
    plane: { x: [0.38, 0.64], y: [0.04, 0.36], xt: range(0.4, 0.6, 0.05), yt: range(0.05, 0.35, 0.05) },
    markers: [{ w: D.w220, label: "220", from: 0 }, { w: D.w221, label: "221", from: 0 }]
  });

  // ======================= rd-filter-demo =======================
  // Stage 0: |Re h|. Stage 1: filter 220. Stage 2: fixed-frequency 221 fit (dashed). Stage 3:
  // filter 221 too. Stage 4: 222 fit. Stage 5: filter 222 too. The current curve is blue, the
  // original waveform stays in light grey once filtered.
  (function () {
    var R = window.RDFILTER_DATA;
    var XR = [-20, 60], LOG = [-5, 0];
    var CUR = "#1f77b4";
    var FILT = "\\tilde h(\\omega) \\xrightarrow{\\text{filter}} ";
    function fac(n) { return "\\frac{\\omega - \\omega_{" + n + "}}{\\omega - \\omega_{" + n + "}^*}"; }
    var EQ = ["", FILT + fac("220") + "\\,\\tilde h(\\omega)", null,
              FILT + fac("220") + fac("221") + "\\,\\tilde h(\\omega)", null,
              FILT + fac("220") + fac("221") + fac("222") + "\\,\\tilde h(\\omega)"];
    EQ[2] = EQ[1]; EQ[4] = EQ[3];
    var CURVE = ["h", "f220", "f220", "f221", "f221", "f222"];
    var FIT = [null, null, { d: R.fit221, w: R.w221, n: "221" }, null, { d: R.fit222, w: R.w222, n: "222" }, null];
    var stage = 0, slideEl = null, onResize = null;

    function lg(v) { return Math.log10(Math.max(Math.abs(v), 1e-12)); }

    function curve(c, f, ys, color, width) {
      var ctx = c.ctx;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.beginPath();
      R.t.forEach(function (t, i) {
        var x = f.X(t), y = f.Y(Math.max(lg(ys[i]), LOG[0] - 1));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    function draw() {
      var slide = slideEl;
      var c = setup(slide.querySelector("#rd-filter-demo-plot"));
      var f = frame(c, XR, LOG, range(-20, 60, 10), range(LOG[0], LOG[1], 1), fixed(0),
                    function (e) { return e === 0 ? "1" : "10" + String(e).replace("-", "⁻").replace(/\d/g, function (d) { return "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]; }); });
      clip(c, f);
      if (stage > 0) curve(c, f, R.h, WAVE_UNUSED, 3);
      curve(c, f, R[CURVE[stage]], stage === 0 ? WAVE : CUR, 4);
      var lab = slide.querySelector(".rd-filter-fitlabel");
      var F = FIT[stage];
      lab.style.visibility = F ? "visible" : "hidden";
      if (F) {
        // Re[A e^{-i w t}] from t = 0
        var ctx = c.ctx, A = F.d.A, w = F.w;
        ctx.strokeStyle = FIT_COLOR;
        ctx.lineWidth = 4;
        ctx.setLineDash([14, 10]);
        ctx.beginPath();
        for (var t = 0; t <= XR[1]; t += 0.05) {
          var e = Math.exp(w[1] * t), re = e * (A[0] * Math.cos(w[0] * t) + A[1] * Math.sin(w[0] * t));
          var y = f.Y(Math.max(lg(re), LOG[0] - 1));
          if (t === 0) ctx.moveTo(f.X(t), y); else ctx.lineTo(f.X(t), y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        // label at the envelope |A| e^{w_i t} where it crosses 10^-3.5
        var amp = Math.hypot(A[0], A[1]), tl = (-3.5 - Math.log10(amp)) / (w[1] / Math.LN10);
        var cv = slide.querySelector("#rd-filter-demo-plot");
        katex.render("\\omega_{" + F.n + "}", lab);
        lab.style.left = (parseFloat(cv.style.left) + f.X(tl) + 20) + "px";
        lab.style.top = (parseFloat(cv.style.top) + f.Y(-3.5) - 60) + "px";
      }
      c.ctx.restore();
      var eq = slide.querySelector(".rd-filter-eq");
      if (EQ[stage]) katex.render(EQ[stage], eq, { displayMode: true }); else eq.innerHTML = "";
    }

    Deck.widget("rd-filter-demo", {
      steps: 5,
      enter: function (slide) {
        slideEl = slide;
        onResize = function () { draw(); };
        window.addEventListener("resize", onResize);
      },
      leave: function () { window.removeEventListener("resize", onResize); },
      step: function (slide, k) { slideEl = slide; stage = k; draw(); }
    });
  })();
})();
