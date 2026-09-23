(function () {
  var root = document.getElementById("game-detail");
  if (!root) return;

  function params() {
    var q = {};
    location.search
      .replace(/^\?/, "")
      .split("&")
      .forEach(function (pair) {
        if (!pair) return;
        var parts = pair.split("=");
        q[decodeURIComponent(parts[0])] = decodeURIComponent(parts.slice(1).join("=") || "");
      });
    return q;
  }

  function lastName(full) {
    if (!full) return "";
    var parts = String(full).trim().split(/\s+/);
    return parts[parts.length - 1];
  }

  function slotLabel(slot) {
    if (!slot) return "";
    return slot.charAt(0).toUpperCase() + slot.slice(1);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var data = window.NBCML_GAMES;
  var id = params().id;
  if (!data || !data.games) {
    root.innerHTML = '<p class="lede">Game data failed to load.</p>';
    return;
  }
  if (!id) {
    root.innerHTML =
      '<h1>Game Box Score</h1><p class="lede">Missing game id. Pick a game from the ' +
      '<a href="schedule.html">Schedule</a>.</p>';
    return;
  }

  var game = null;
  for (var i = 0; i < data.games.length; i++) {
    if (data.games[i].id === id) {
      game = data.games[i];
      break;
    }
  }
  if (!game) {
    root.innerHTML =
      "<h1>Game not found</h1><p class=\"lede\">No game with id <code>" +
      esc(id) +
      '</code>. Return to the <a href="schedule.html">Schedule</a>.</p>';
    return;
  }

  var h = game.home;
  var a = game.away;
  var headline =
    "Team " +
    h.team +
    " (" +
    lastName(h.captain) +
    ") " +
    h.score +
    " – " +
    a.score +
    " Team " +
    a.team +
    " (" +
    lastName(a.captain) +
    ")";

  var resultNote = "";
  if (game.winner == null) resultNote = "Final — Tie";
  else resultNote = "Final — Team " + game.winner + " wins";

  function playersFor(teamNum) {
    return (game.players || []).filter(function (p) {
      return p.team === teamNum;
    });
  }

  function teamTable(teamNum, score, captain, isWinner) {
    var rows = playersFor(teamNum)
      .map(function (p) {
        var num = p.number ? esc(p.number) : "—";
        return (
          "<tr>" +
          '<td class="num">' +
          num +
          "</td>" +
          "<td>" +
          esc(p.name) +
          "</td>" +
          '<td class="num">' +
          esc(p.points) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    if (!rows) {
      rows = '<tr><td colspan="3">No player stats recorded.</td></tr>';
    }
    var cls = "box-team" + (isWinner ? " box-winner" : "");
    return (
      '<div class="' +
      cls +
      '">' +
      "<h2>Team " +
      teamNum +
      " <span class=\"captain-tag\">" +
      esc(captain) +
      '</span> <span class="team-total">' +
      score +
      "</span></h2>" +
      '<div class="table-wrap"><table class="data-table box-score-table" aria-label="Team ' +
      teamNum +
      ' scoring">' +
      "<thead><tr><th class=\"num\">#</th><th>Player</th><th class=\"num\">Pts</th></tr></thead>" +
      "<tbody>" +
      rows +
      "</tbody></table></div></div>"
    );
  }

  document.title =
    "W" +
    game.week +
    " " +
    slotLabel(game.slot) +
    " — " +
    h.score +
    "–" +
    a.score +
    " — NBCML";

  root.innerHTML =
    "<h1>Week " +
    game.week +
    " · " +
    esc(slotLabel(game.slot)) +
    ' <span class="badge final">' +
    esc(game.date) +
    "</span></h1>" +
    '<p class="lede">' +
    esc(game.time || "") +
    (game.time ? " · " : "") +
    esc(resultNote) +
    "</p>" +
    '<div class="final-score' +
    (game.winner === h.team ? " home-won" : "") +
    (game.winner === a.team ? " away-won" : "") +
    '">' +
    '<div class="final-score-line">' +
    esc(headline) +
    "</div></div>" +
    '<div class="box-grid">' +
    teamTable(h.team, h.score, h.captain, game.winner === h.team) +
    teamTable(a.team, a.score, a.captain, game.winner === a.team) +
    "</div>";
})();
