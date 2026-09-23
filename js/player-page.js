(function () {
  var root = document.getElementById("player-detail");
  if (!root) return;

  function params() {
    var q = {};
    location.search
      .replace(/^\?/, "")
      .split("&")
      .forEach(function (pair) {
        if (!pair) return;
        var parts = pair.split("=");
        q[decodeURIComponent(parts[0])] = decodeURIComponent(
          parts.slice(1).join("=") || ""
        );
      });
    return q;
  }

  function playerSlug(name) {
    return String(name || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return esc(iso || "—");
    var parts = iso.split("-");
    return parts[1] + "." + parts[2] + "." + parts[0];
  }

  var q = params();
  var idOrName = (q.id || q.name || "").trim();
  var gamesData = window.NBCML_GAMES;
  var leadersData = window.NBCML_LEADERS;

  if (!idOrName) {
    root.innerHTML =
      '<h1>Player</h1><p class="lede">Missing player id. Pick a player from ' +
      '<a href="individual-scoring.html">Player Stats</a>.</p>';
    return;
  }

  var targetSlug = playerSlug(idOrName);
  var displayName = null;
  var teamFromGames = null;
  var rows = [];

  if (gamesData && gamesData.games) {
    gamesData.games.forEach(function (game) {
      (game.players || []).forEach(function (p) {
        if (playerSlug(p.name) !== targetSlug) return;
        displayName = displayName || p.name;
        teamFromGames = teamFromGames != null ? teamFromGames : p.team;
        var own = p.team;
        var isHome = game.home && game.home.team === own;
        var opp = isHome
          ? game.away && game.away.team
          : game.home && game.home.team;
        var matchup =
          "T" +
          own +
          (isHome ? " vs " : " @ ") +
          "T" +
          (opp != null ? opp : "?");
        var result;
        if (game.winner == null) result = "T";
        else if (game.winner === own) result = "W";
        else result = "L";
        rows.push({
          isoDate: game.isoDate || "",
          date: formatDate(game.isoDate),
          matchup: matchup,
          result: result,
          points: p.points,
          gameId: game.id
        });
      });
    });
  }

  var leader = null;
  if (leadersData && leadersData.players) {
    for (var i = 0; i < leadersData.players.length; i++) {
      var lp = leadersData.players[i];
      if (playerSlug(lp.player) === targetSlug) {
        leader = lp;
        displayName = displayName || lp.player;
        break;
      }
    }
  }

  if (!displayName) {
    root.innerHTML =
      "<h1>Player not found</h1><p class=\"lede\">No player matching <code>" +
      esc(idOrName) +
      '</code>. Return to <a href="individual-scoring.html">Player Stats</a>.</p>';
    return;
  }

  rows.sort(function (a, b) {
    if (a.isoDate < b.isoDate) return 1;
    if (a.isoDate > b.isoDate) return -1;
    return 0;
  });

  var teamNum =
    leader && leader.team != null
      ? leader.team
      : teamFromGames != null
        ? teamFromGames
        : null;
  var gp = leader ? leader.gp : rows.length;
  var tp = leader
    ? leader.tp
    : rows.reduce(function (sum, r) {
        return sum + Number(r.points || 0);
      }, 0);
  var avg =
    leader && leader.avg != null
      ? Number(leader.avg).toFixed(1)
      : gp
        ? (tp / gp).toFixed(1)
        : "—";

  document.title = displayName + " — NBCML";

  var summaryHtml =
    '<div class="player-summary">' +
    '<div class="player-summary-stat"><span class="label">Team</span><span class="value">T' +
    (teamNum != null ? esc(teamNum) : "—") +
    "</span></div>" +
    '<div class="player-summary-stat"><span class="label">GP</span><span class="value">' +
    esc(gp) +
    "</span></div>" +
    '<div class="player-summary-stat"><span class="label">TP</span><span class="value">' +
    esc(tp) +
    "</span></div>" +
    '<div class="player-summary-stat"><span class="label">AVG</span><span class="value">' +
    esc(avg) +
    "</span></div>" +
    "</div>";

  var tableBody;
  if (!rows.length) {
    tableBody =
      '<tr><td colspan="4">No games recorded yet for this player (DNP or 0 GP).</td></tr>';
  } else {
    tableBody = rows
      .map(function (r) {
        var resultCls =
          r.result === "W"
            ? "result-w"
            : r.result === "L"
              ? "result-l"
              : "result-t";
        var matchupCell = r.gameId
          ? '<a class="box-link" href="game.html?id=' +
            esc(r.gameId) +
            '">' +
            esc(r.matchup) +
            "</a>"
          : esc(r.matchup);
        return (
          "<tr>" +
          "<td>" +
          r.date +
          "</td>" +
          "<td>" +
          matchupCell +
          "</td>" +
          '<td class="num"><span class="result-pill ' +
          resultCls +
          '">' +
          esc(r.result) +
          "</span></td>" +
          '<td class="num pts-cell">' +
          esc(r.points) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  root.innerHTML =
    "<h1>" +
    esc(displayName) +
    ' <span class="badge">2026-27</span></h1>' +
    summaryHtml +
    '<h2 class="player-log-heading">Recent Game Stats</h2>' +
    '<div class="table-wrap"><table class="data-table player-log-table" aria-label="Game-by-game points">' +
    "<thead><tr>" +
    "<th>DATE</th>" +
    "<th>MATCHUP</th>" +
    '<th class="num">RESULT</th>' +
    '<th class="num">PTS</th>' +
    "</tr></thead>" +
    "<tbody>" +
    tableBody +
    "</tbody></table></div>";
})();
