(function () {
  function playerSlug(name) {
    if (window.NBCML_playerSlug) return window.NBCML_playerSlug(name);
    return String(name || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function scrollRowToViewportCenter(row) {
    var rect = row.getBoundingClientRect();
    var rowCenter = window.scrollY + rect.top + rect.height / 2;
    var target = rowCenter - window.innerHeight / 2;
    window.scrollTo({
      top: Math.max(0, target),
      behavior: "smooth"
    });
  }

  var data = window.NBCML_LEADERS;
  if (!data) return;
  var lede = document.getElementById("leaders-lede");
  if (lede && data.note) lede.textContent = data.note;

  var table = document.getElementById("leaders-table");
  var tbody = table && table.querySelector("tbody");
  if (!tbody) return;

  var teamColors = {};
  (window.NBCML_ROSTERS || []).forEach(function (team) {
    if (team && team.id != null && team.color) {
      teamColors[String(team.id)] = team.color;
    }
  });
  // Fallback if rosters.js did not load — same palette as data/rosters.js
  if (!Object.keys(teamColors).length) {
    teamColors = {
      "1": "#ffffff",
      "2": "#e8d9c0",
      "3": "#f5e6a3",
      "4": "#f5c9b8",
      "5": "#c8e6c0",
      "6": "#c5daf5"
    };
  }

  var players = (data.players || []).slice();
  var sortKey = "rank";
  var sortDir = "asc";

  function cmp(a, b) {
    var av;
    var bv;
    if (sortKey === "player") {
      av = String(a.player || "").toLowerCase();
      bv = String(b.player || "").toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    }
    if (sortKey === "team") {
      av = Number(a.team);
      bv = Number(b.team);
    } else if (sortKey === "gp") {
      av = Number(a.gp);
      bv = Number(b.gp);
    } else if (sortKey === "tp") {
      av = Number(a.tp);
      bv = Number(b.tp);
    } else if (sortKey === "avg") {
      av = Number(a.avg);
      bv = Number(b.avg);
    } else {
      av = a.rank == null ? Infinity : Number(a.rank);
      bv = b.rank == null ? Infinity : Number(b.rank);
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    // Stable-ish tie-break by name
    var an = String(a.player || "").toLowerCase();
    var bn = String(b.player || "").toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  }

  function updateHeaderState() {
    table.querySelectorAll("th.sortable").forEach(function (th) {
      var key = th.getAttribute("data-sort");
      var ind = th.querySelector(".sort-ind");
      if (key === sortKey) {
        th.setAttribute("aria-sort", sortDir === "asc" ? "ascending" : "descending");
        if (ind) ind.textContent = sortDir === "asc" ? "▲" : "▼";
      } else {
        th.setAttribute("aria-sort", "none");
        if (ind) ind.textContent = "";
      }
    });
  }

  function render() {
    if (!players.length) {
      tbody.innerHTML =
        '<tr><td colspan="6">2026–27 scoring will appear as games are played. FINAL 2025–26 leaders: <a href="seasons/2025-26/individual-scoring.html">Season 2025/2026</a>.</td></tr>';
      updateHeaderState();
      return;
    }
    var sorted = players.slice().sort(cmp);
    tbody.innerHTML = sorted
      .map(function (p) {
        var rank = p.rank != null ? p.rank : "—";
        var slug = playerSlug(p.player);
        var bg = teamColors[String(p.team)] || "";
        var styleAttr = bg
          ? ' style="--team-bg:' + bg + ';background:' + bg + '"'
          : "";
        return (
          '<tr class="team-tint" id="p-' +
          slug +
          '" data-team="' +
          p.team +
          '"' +
          styleAttr +
          ">" +
          '<td class="num">' +
          rank +
          "</td>" +
          '<td><a class="player-name-link" href="' +
          (window.NBCML_playerHref ? window.NBCML_playerHref(p.player) : ("player.html?id=" + slug)) +
          '">' +
          p.player +
          "</a></td>" +
          '<td class="col-team">T' +
          p.team +
          "</td>" +
          '<td class="num">' +
          p.gp +
          "</td>" +
          '<td class="num">' +
          p.tp +
          "</td>" +
          '<td class="num">' +
          Number(p.avg).toFixed(1) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    updateHeaderState();
    highlightFromHash(false);
  }

  function highlightFromHash(doScroll) {
    var hash = (location.hash || "").replace(/^#/, "");
    if (!hash) return;
    var row = document.getElementById(hash);
    if (!row) return;
    tbody.querySelectorAll("tr.is-target").forEach(function (el) {
      el.classList.remove("is-target");
    });
    row.classList.add("is-target");
    if (doScroll === false) return;
    requestAnimationFrame(function () {
      scrollRowToViewportCenter(row);
      setTimeout(function () {
        scrollRowToViewportCenter(row);
      }, 50);
    });
  }

  table.querySelectorAll("th.sortable").forEach(function (th) {
    th.addEventListener("click", function () {
      var key = th.getAttribute("data-sort");
      if (!key) return;
      if (sortKey === key) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortKey = key;
        // Numbers default high→low except official rank (#); names A→Z
        sortDir = key === "player" || key === "rank" || key === "team" ? "asc" : "desc";
      }
      render();
    });
  });

  if (location.hash && "scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  render();
  window.addEventListener("hashchange", function () {
    highlightFromHash(true);
  });
  window.addEventListener("load", function () {
    highlightFromHash(true);
  });
})();
