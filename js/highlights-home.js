(function () {
  var root = document.getElementById("highlights-root");
  var sub = document.getElementById("highlights-sub");
  if (!root) return;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slotLabel(slot) {
    if (!slot) return "Game";
    return slot.charAt(0).toUpperCase() + slot.slice(1);
  }

  function slotOrder(slot) {
    var s = String(slot || "").toLowerCase();
    if (s === "early") return 0;
    if (s === "middle" || s === "mid") return 1;
    if (s === "late") return 2;
    return 9;
  }

  function topScorers(players, teamNum, n) {
    return (players || [])
      .filter(function (p) {
        return p.team === teamNum;
      })
      .slice()
      .sort(function (a, b) {
        return Number(b.points) - Number(a.points);
      })
      .slice(0, n);
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

  function scorersList(players) {
    if (!players.length) {
      return '<li class="hl-empty-scorer">No scorers listed</li>';
    }
    return players
      .map(function (p) {
        return (
          '<li><a class="hl-name player-name-link" href="' +
          playerHref(p.name) +
          '">' +
          esc(p.name) +
          '</a><span class="hl-pts">' +
          esc(p.points) +
          "</span></li>"
        );
      })
      .join("");
  }

  function gameCard(game) {
    var h = game.home || {};
    var a = game.away || {};
    var homeTop = topScorers(game.players, h.team, 3);
    var awayTop = topScorers(game.players, a.team, 3);
    var href = "game.html?id=" + encodeURIComponent(game.id);
    return (
      '<article class="hl-game">' +
      '<a class="hl-game-link" href="' +
      href +
      '">' +
      '<div class="hl-slot">' +
      esc(slotLabel(game.slot)) +
      (game.time ? " · " + esc(game.time) : "") +
      "</div>" +
      '<div class="hl-scoreline">' +
      '<span class="hl-team">T' +
      esc(h.team) +
      '</span><span class="hl-score">' +
      esc(h.score) +
      '</span><span class="hl-dash">–</span><span class="hl-score">' +
      esc(a.score) +
      '</span><span class="hl-team">T' +
      esc(a.team) +
      "</span>" +
      "</div></a>" +
      '<div class="hl-scorers-grid">' +
      '<div class="hl-scorers">' +
      "<h3>Team " +
      esc(h.team) +
      " · top 3</h3>" +
      "<ol>" +
      scorersList(homeTop) +
      "</ol></div>" +
      '<div class="hl-scorers">' +
      "<h3>Team " +
      esc(a.team) +
      " · top 3</h3>" +
      "<ol>" +
      scorersList(awayTop) +
      "</ol></div>" +
      "</div></article>"
    );
  }

  var data = window.NBCML_GAMES;
  var games = (data && data.games) || [];
  if (!games.length) {
    if (sub) sub.textContent = "Season 2026–2027 · results appear after tip-off";
    root.innerHTML =
      '<div class="hl-empty">' +
      "<p><strong>No game day results yet.</strong></p>" +
      "<p>After the first night, this spot shows the latest three games with each team’s top three scorers.</p>" +
      '<p class="hl-empty-links">See the <a href="schedule.html">Schedule</a> · last season’s finals are in <a href="seasons/2025-26/index.html">Season 2025/2026</a>.</p>' +
      "</div>";
    return;
  }

  var byDate = {};
  games.forEach(function (g) {
    var key = g.isoDate || g.date || "";
    if (!key) return;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(g);
  });
  var dates = Object.keys(byDate).sort();
  var latest = dates[dates.length - 1];
  var night = byDate[latest].slice().sort(function (a, b) {
    return slotOrder(a.slot) - slotOrder(b.slot);
  });

  var labelDate = night[0].date || latest;
  var week = night[0].week != null ? "Week " + night[0].week + " · " : "";
  if (sub) {
    sub.textContent = week + labelDate + " · " + night.length + " game" + (night.length === 1 ? "" : "s");
  }

  root.innerHTML =
    '<div class="hl-games">' + night.map(gameCard).join("") + "</div>";
})();
