(function () {
  var data = window.NBCML_SCOREKEEPING;
  if (!data) return;

  var MONTHS = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  function parseClubDate(str) {
    var m = String(str || "").match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
    if (!m) return null;
    var mon = MONTHS[m[2]];
    if (mon == null) return null;
    return new Date(2000 + parseInt(m[3], 10), mon, parseInt(m[1], 10));
  }

  function hasAssignments(w) {
    if (!w) return false;
    return (
      (w.early && w.early.length) ||
      (w.middle && w.middle.length) ||
      (w.late && w.late.length)
    );
  }

  function startOfToday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** First game night on/after today that has scorekeeping names. */
  function findNextWeekIndex(weeks) {
    var today = startOfToday();
    var i;
    for (i = 0; i < weeks.length; i++) {
      if (!hasAssignments(weeks[i])) continue;
      var d = parseClubDate(weeks[i].date);
      if (d && d.getTime() >= today.getTime()) return i;
    }
    return -1;
  }

  var rules = document.getElementById("sk-rules");
  if (rules && data.rules) {
    rules.innerHTML =
      "<strong>Key rules</strong><ul style='margin:8px 0 0;padding-left:1.2rem'>" +
      data.rules.map(function (r) { return "<li>" + r + "</li>"; }).join("") +
      "</ul>";
  }

  function playerHref(name) {
    if (window.NBCML_playerHref) return window.NBCML_playerHref(name);
    var slug = String(name || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return "player.html?id=" + encodeURIComponent(slug);
  }

  function fmt(list) {
    if (!list || !list.length) return "—";
    return list
      .map(function (x) {
        return (
          '<a class="player-name-link" href="' +
          playerHref(x.name) +
          '">' +
          x.name +
          "</a> <span style='color:#888'>(T" +
          x.team +
          ")</span>"
        );
      })
      .join("<br>");
  }

  var tbody = document.querySelector("#scorekeeping-table tbody");
  if (!tbody) return;
  var weeks = data.weeks || [];
  if (!weeks.length) {
    tbody.innerHTML =
      '<tr><td colspan="5">Scorekeeping assignments coming soon.</td></tr>';
    return;
  }

  var nextIdx = findNextWeekIndex(weeks);

  tbody.innerHTML = weeks
    .map(function (w, idx) {
      var emptySlots =
        !(w.early && w.early.length) &&
        !(w.middle && w.middle.length) &&
        !(w.late && w.late.length);
      if (emptySlots && w.note) {
        return (
          '<tr class="break-row">' +
          "<td>" +
          w.date +
          "</td>" +
          '<td colspan="3">' +
          w.note +
          "</td>" +
          "<td></td>" +
          "</tr>"
        );
      }
      var isNext = idx === nextIdx;
      var dateCell = w.date;
      if (isNext) {
        dateCell =
          w.date +
          ' <span class="sk-next-badge" title="Next game day">Next</span>';
      }
      return (
        "<tr" +
        (isNext ? ' id="sk-next" class="sk-next-row"' : "") +
        ">" +
        "<td>" +
        dateCell +
        "</td>" +
        "<td>" +
        fmt(w.early) +
        "</td>" +
        "<td>" +
        fmt(w.middle) +
        "</td>" +
        "<td>" +
        fmt(w.late) +
        "</td>" +
        "<td>" +
        (w.note || "") +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  function stickyOffset() {
    var header = document.querySelector(".site-header");
    var th = document.querySelector("#scorekeeping-table thead th");
    var h = header ? header.getBoundingClientRect().height : 0;
    var t = th ? th.getBoundingClientRect().height : 0;
    return Math.ceil(h + t + 8);
  }

  function scrollNextToTop() {
    var row = document.getElementById("sk-next");
    if (!row) return;
    row.style.scrollMarginTop = stickyOffset() + "px";
    row.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  // After layout (sticky header height is known)
  if (nextIdx >= 0) {
    requestAnimationFrame(function () {
      requestAnimationFrame(scrollNextToTop);
    });
  }
})();
