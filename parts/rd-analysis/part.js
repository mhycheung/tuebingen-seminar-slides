// Ringdown data analysis: the whitened GW250114 fit, and (f, gamma) start-time animations
// replayed from the exported contours (src/export_gamma_f_anim.py).
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  // matplotlib C0..C3 and the two shades of make_videos.py (bold: base * 0.6; faint: towards white)
  var BASE = { blue: [31, 119, 180], orange: [255, 127, 14], green: [44, 160, 44], red: [214, 39, 40] };
  function rgb(c) { return "rgb(" + c.map(Math.round).join(",") + ")"; }
  function shade(name, frac) {
    return rgb(BASE[name].map(function (b) {
      b /= 255;
      return 255 * (b * 0.6 + ((b + (1 - b) * 0.65) - b * 0.6) * frac);
    }));
  }

  function el(parent, tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  // An HTML label at slide pixel (x, y); anchor: [fx, fy] fraction of its own size to shift by.
  function label(box, x, y, tex, size, anchor, color) {
    var d = document.createElement("div");
    d.className = "rd-analysis-lab";
    d.style.left = x + "px";
    d.style.top = y + "px";
    d.style.fontSize = size + "px";
    if (color) d.style.color = color;
    d.style.transform = "translate(" + (-100 * anchor[0]) + "%," + (-100 * anchor[1]) + "%)";
    if (tex.charAt(0) === "$") katex.render(tex.slice(1, -1), d, { throwOnError: false });
    else d.textContent = tex;
    box.appendChild(d);
    return d;
  }

  // ---------------------------------------------------------------- whitened fit
  Deck.widget("rd-analysis-fit", {
    enter: function (slide) {
      var svg = slide.querySelector(".rd-analysis-fitplot");
      if (svg.childNodes.length) return;
      var D = rd_analysis_fit, t = D.t_ms, d = D.H1;
      var L = 160, R = 1780, T = 300, B = 920;
      var t0 = t[0], t1 = 35;
      var ymax = 0;
      d.strain.forEach(function (v) { ymax = Math.max(ymax, Math.abs(v)); });
      ymax *= 1.05;
      function X(v) { return L + (v - t0) / (t1 - t0) * (R - L); }
      function Y(v) { return (T + B) / 2 - v / ymax * (B - T) / 2; }
      function line(arr) {
        return arr.map(function (v, i) { return (i ? "L" : "M") + X(t[i]).toFixed(1) + " " + Y(v).toFixed(1); }).join("");
      }
      var band = line(d.hi_90) + d.lo_90.slice().reverse().map(function (v, i) {
        return "L" + X(t[t.length - 1 - i]).toFixed(1) + " " + Y(v).toFixed(1);
      }).join("") + "Z";
      el(svg, "path", { d: band, fill: "rgb(31,119,180)", "fill-opacity": 0.25, stroke: "none" });
      el(svg, "path", { d: line(d.strain), fill: "none", stroke: "#000", "stroke-width": 3 });
      el(svg, "path", { d: line(d.median), fill: "none", stroke: "rgb(31,119,180)", "stroke-width": 6 });
      el(svg, "line", { x1: L, x2: R, y1: B + 20, y2: B + 20, stroke: "#000", "stroke-width": 2 });
      var box = slide;
      for (var v = 5; v <= 35; v += 5) {
        el(svg, "line", { x1: X(v), x2: X(v), y1: B + 20, y2: B + 34, stroke: "#000", "stroke-width": 2 });
        label(box, X(v), B + 38, String(v), 36, [0.5, 0]);
      }
      label(box, R - 10, T - 10, "H1", 40, [1, 1]);
    }
  });

  // ---------------------------------------------------------------- animations
  var PL = 190, PT = 170, PW = 800, PH = 760;              // omega-plane panel
  var CL = 1230, CR = 1830;                                   // circle list, column centres
  var FRAME_MS = 500, HOLD = 4;                               // ms per frame; extra frames at the end

  function setup(slide, D) {
    var svg = slide.querySelector(".rd-analysis-anim");
    var box = slide.querySelector(".rd-analysis-labs");
    var x0 = D.xlim[0], x1 = D.xlim[1], y0 = D.ylim[0], y1 = D.ylim[1];
    function X(f) { return PL + (f - x0) / (x1 - x0) * PW; }
    function Y(g) { return PT + PH - (g - y0) / (y1 - y0) * PH; }
    function path(seg) {
      return seg.map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join("");
    }
    var clip = el(el(svg, "defs", {}), "clipPath", { id: slide.id + "-clip" });
    el(clip, "rect", { x: PL, y: PT, width: PW, height: PH });
    // grid, frame, ticks
    var fx, gy;
    for (fx = 100; fx <= x1; fx += 100) {
      el(svg, "line", { x1: X(fx), x2: X(fx), y1: PT, y2: PT + PH, stroke: "#000", "stroke-opacity": 0.12, "stroke-width": 1.5 });
      label(box, X(fx), PT + PH + 10, String(fx), 32, [0.5, 0]);
    }
    for (gy = 0; gy <= y1; gy += 250) {
      el(svg, "line", { x1: PL, x2: PL + PW, y1: Y(gy), y2: Y(gy), stroke: "#000", "stroke-opacity": 0.12, "stroke-width": 1.5 });
      label(box, PL - 12, Y(gy), String(gy), 32, [1, 0.5]);
    }
    el(svg, "rect", { x: PL, y: PT, width: PW, height: PH, fill: "none", stroke: "#000", "stroke-width": 2 });
    label(box, PL + PW / 2, PT + PH + 60, "$f\\ [\\mathrm{Hz}]$", 40, [0.5, 0]);
    var yl = label(box, PL - 120, PT + PH / 2, "$\\gamma = 1/\\tau\\ [\\mathrm{s^{-1}}]$", 40, [0.5, 0.5]);
    yl.style.transform = "translate(-50%,-50%) rotate(-90deg)";
    var plot = el(svg, "g", { "clip-path": "url(#" + slide.id + "-clip)" });
    var cont = el(plot, "g", {});
    var fixed = el(plot, "g", {});
    // IMR (real data) contours, dashed black, labelled above
    if (D.imr) {
      Object.keys(D.imr).forEach(function (n) {
        D.imr[n].forEach(function (seg) {
          el(fixed, "path", { d: path(seg), fill: "none", stroke: "#000", "stroke-width": 2.5, "stroke-dasharray": "8 5" });
        });
        label(box, X(D.imr_top[n][0]), Y(D.imr_top[n][1]) - 6, "IMR " + n, 26, [0.5, 1]);
      });
    }
    // Kerr QNMs of the injected remnant (3G), black crosses
    if (D.truths) {
      Object.keys(D.truths).forEach(function (n) {
        var x = X(D.truths[n][0]), y = Y(D.truths[n][1]), s = 9;
        el(fixed, "path", { d: "M" + (x - s) + " " + (y - s) + "L" + (x + s) + " " + (y + s) + "M" + (x - s) + " " + (y + s) + "L" + (x + s) + " " + (y - s),
                            stroke: "#000", "stroke-width": 3 });
        label(box, x + 8, y - 4, n.replace("x", "×"), 24, [0, 1]);
      });
    }
    var tlab = label(box, PL + PW - 16, PT + 14, "", 44, [1, 0]);
    tlab.style.background = "rgba(255,255,255,0.85)";
    // circle list
    var n = D.frames.length, rows = D.rows, dx = (CR - CL) / (n - 1), dy = 78;
    var r = Math.min(14, dx * 0.4);
    var top = 560 - (rows.length - 1) * dy / 2;
    var shadeCol = el(svg, "rect", { x: 0, y: top - dy / 2, width: dx, height: rows.length * dy, fill: "#000", "fill-opacity": 0.08 });
    var circles = rows.map(function (q, ri) {
      var y = top + ri * dy;
      label(box, CL - 30, y, q.replace("x", "×"), 36, [1, 0.5]);
      return D.frames.map(function (fr, i) {
        var c = D.circles[q][i];
        return el(svg, "circle", { cx: CL + i * dx, cy: y, r: r, fill: c ? rgb(BASE[c]) : "#b3b3b3", stroke: "#000", "stroke-width": 0 });
      });
    });
    var axY = top + (rows.length - 0.5) * dy + 10;
    el(svg, "line", { x1: CL - dx / 2, x2: CR + dx / 2, y1: axY, y2: axY, stroke: "#000", "stroke-width": 2 });
    D.frames.forEach(function (fr, i) {
      if (fr.t0 % 5) return;
      el(svg, "line", { x1: CL + i * dx, x2: CL + i * dx, y1: axY, y2: axY + 12, stroke: "#000", "stroke-width": 2 });
      label(box, CL + i * dx, axY + 16, String(fr.t0), 32, [0.5, 0]);
    });
    label(box, (CL + CR) / 2, axY + 70, "$t_{\\rm start}\\ [M_{\\rm rem}]$", 40, [0.5, 0]);

    function show(k) {
      while (cont.firstChild) cont.removeChild(cont.firstChild);
      D.frames.forEach(function (fr, i) {
        if (i > k) return;
        fr.blobs.forEach(function (b) {
          b.segs.forEach(function (seg) {
            el(cont, "path", i < k
              ? { d: path(seg), fill: "none", stroke: shade(b.c, 0.6), "stroke-opacity": 0.35, "stroke-width": 1.6 }
              : { d: path(seg), fill: "none", stroke: shade(b.c, 0), "stroke-width": 4.5 });
          });
        });
      });
      katex.render("t_{\\rm start} = " + D.frames[k].t0 + "\\,M_{\\rm rem}", tlab);
      shadeCol.setAttribute("x", CL + (k - 0.5) * dx);
      circles.forEach(function (row) {
        row.forEach(function (c, i) { c.setAttribute("stroke-width", i === k ? 3 : 0); });
      });
    }
    return { show: show, n: n };
  }

  // Plays the start times at 2 per second and loops, holding the last one; a click pauses.
  function anim(id, data) {
    var A = null, timer = null, k = 0, paused = false;
    function tick() {
      if (paused) return;
      k = (k + 1) % (A.n + HOLD);
      if (k < A.n) A.show(k);
    }
    Deck.widget(id, {
      enter: function (slide) {
        if (!A) {
          A = setup(slide, data);
          slide.addEventListener("click", function () { paused = !paused; });
        }
        k = 0; paused = false;
        A.show(0);
        timer = setInterval(tick, FRAME_MS);
      },
      leave: function () { clearInterval(timer); timer = null; }
    });
  }

  anim("rd-analysis-real", rd_analysis_real_n2);
  anim("rd-analysis-aligned", rd_analysis_nr3617_n4);
  anim("rd-analysis-precessing", rd_analysis_nr4018_n3);
})();
