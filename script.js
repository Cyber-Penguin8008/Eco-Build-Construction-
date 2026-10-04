(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var here = location.pathname.split("/").pop() || "index.html";

  /* ---------------------------------------------------------- menu button */
  var nav = document.getElementById("nav");
  var burger = document.querySelector(".menu-btn");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      moveNav(false);
    });
  }

  /* ------------------------- sliding yellow marker on the menu ----------- */
  var hl = null;
  if (nav && nav.querySelector("ul")) {
    hl = nav.querySelector("ul").cloneNode(true);
    hl.classList.add("nav-hl");
    hl.setAttribute("aria-hidden", "true");
    hl.querySelectorAll("a").forEach(function (a) { a.setAttribute("tabindex", "-1"); });
    nav.appendChild(hl);
  }

  function linkFor(file) {
    if (!nav) return null;
    var links = nav.querySelectorAll("ul:not(.nav-hl) a"), i;
    for (i = 0; i < links.length; i++) {
      if (links[i].getAttribute("href") === file) return links[i];
    }
    return null;
  }

  function clipTo(link, animate) {
    if (!hl || !link) return;
    if (getComputedStyle(nav).display === "none") return;
    var c = hl.getBoundingClientRect(), a = link.getBoundingClientRect();
    if (!animate) hl.classList.add("no-anim");
    hl.style.clipPath = "inset(" + (a.top - c.top) + "px " + (c.right - a.right) + "px " +
                        (c.bottom - a.bottom) + "px " + (a.left - c.left) + "px)";
    if (!animate) { void hl.offsetWidth; hl.classList.remove("no-anim"); }
  }

  var intro = false;                      // true while the arrival slide is running
  function moveNav(animate) {
    if (!animate && intro) return;        // never snap mid-slide, or the slide is lost
    clipTo(linkFor(here), animate);
  }

  // On arriving from another page, start the marker where it was and slide it here.
  var from = null;
  try { from = sessionStorage.getItem("ecb-page"); } catch (e) {}
  if (from && from !== here && linkFor(from) && !reduce) {
    intro = true;
    clipTo(linkFor(from), false);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        clipTo(linkFor(here), true);
        setTimeout(function () { intro = false; }, 1000);
      });
    });
  } else {
    moveNav(false);
  }
  try { sessionStorage.setItem("ecb-page", here); } catch (e) {}

  window.addEventListener("resize", function () { moveNav(false); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveNav(false); });

  /* ------------------------------------------------------------ carousel */
  var car = document.getElementById("carousel");
  if (car) {
    var slides = car.querySelectorAll(".slide");
    var dots = car.querySelector(".dots");
    var cur = 0, timer;

    slides.forEach(function (_, i) {
      var d = document.createElement("button");
      d.setAttribute("aria-label", "Go to slide " + (i + 1));
      d.addEventListener("click", function () { go(i); restart(); });
      dots.appendChild(d);
    });

    function go(n) {
      slides[cur].classList.remove("active");
      dots.children[cur].removeAttribute("aria-current");
      cur = (n + slides.length) % slides.length;
      slides[cur].classList.add("active");
      dots.children[cur].setAttribute("aria-current", "true");
    }
    function restart() {
      clearInterval(timer);
      if (!reduce) timer = setInterval(function () { go(cur + 1); }, 6000);
    }
    car.querySelector(".prev").addEventListener("click", function () { go(cur - 1); restart(); });
    car.querySelector(".next").addEventListener("click", function () { go(cur + 1); restart(); });
    car.addEventListener("mouseenter", function () { clearInterval(timer); });
    car.addEventListener("mouseleave", restart);

    var sx = null;
    car.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    car.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); restart(); }
      sx = null;
    });
    go(0); restart();
  }

  /* ------------------------------------------------------- project filters */
  var fil = document.querySelector(".filters");
  if (fil) {
    var fhl = fil.cloneNode(true);
    fhl.className = "filters-hl";
    fhl.removeAttribute("role");
    fhl.removeAttribute("aria-label");
    fhl.setAttribute("aria-hidden", "true");
    fhl.querySelectorAll("button").forEach(function (b) { b.setAttribute("tabindex", "-1"); });
    fil.appendChild(fhl);

    var moveFil = function (animate) {
      var a = fil.querySelector('button[aria-pressed="true"]');
      if (!a) return;
      var c = fhl.getBoundingClientRect(), r = a.getBoundingClientRect();
      if (!animate) fhl.classList.add("no-anim");
      fhl.style.clipPath = "inset(" + (r.top - c.top) + "px " + (c.right - r.right) + "px " +
                           (c.bottom - r.bottom) + "px " + (r.left - c.left) + "px)";
      if (!animate) { void fhl.offsetWidth; fhl.classList.remove("no-anim"); }
    };
    window.addEventListener("resize", function () { moveFil(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveFil(false); });
    moveFil(false);

    fil.querySelectorAll(":scope > button").forEach(function (b) {
      b.addEventListener("click", function () {
        fil.querySelectorAll(":scope > button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        moveFil(true);
        var f = b.dataset.f;
        document.querySelectorAll("#project-grid .project").forEach(function (p) {
          p.style.display = (f === "all" || p.dataset.c === f) ? "" : "none";
        });
      });
    });
  }

  /* --------------------------------------------- slide in while scrolling */
  document.querySelectorAll("section .split > *").forEach(function (el, i) {
    el.classList.add("reveal");
    el.style.setProperty("--from", i % 2 === 0 ? "-48px" : "48px");
    el.style.setProperty("--fromY", "0px");
  });
  document.querySelectorAll("section .grid > *, .steps li, .stats > div, .mosaic > *").forEach(function (el, i) {
    if (el.closest(".split")) return;
    el.classList.add("reveal");
    el.style.setProperty("--from", i % 2 === 0 ? "-36px" : "36px");
    el.style.transitionDelay = ((i % 3) * 0.08) + "s";
  });
  document.querySelectorAll("section > .wrap > h2").forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ----------------------------------------------------------- the form */
  var cf = document.getElementById("contact-form");
  if (cf) {
    var note = document.getElementById("form-note");
    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var send = cf.querySelector('button[type="submit"]');
      send.disabled = true;
      note.textContent = "Sending...";
      fetch(cf.action, { method: "POST", body: new FormData(cf), headers: { "Accept": "application/json" } })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (d) {
          if (d && d.ok) { location.href = "thank-you.html"; return; }
          note.textContent = (d && d.error) || "Sorry, the message could not be sent. Please call us instead.";
          send.disabled = false;
        })
        .catch(function () {
          note.textContent = "Sorry, the message could not be sent. Please call us instead.";
          send.disabled = false;
        });
    });
  }
})();
