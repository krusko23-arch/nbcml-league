(function () {
  var data = window.NBCML_GAMES;
  var tbody = document.getElementById("games-tbody");
  if (!tbody) return;
  if (!data || !data.games || !data.games.length) {
    tbody.innerHTML =
      '<tr><td colspan="5">No 2026–27 games yet — results will appear after tip-off. Browse <a href="seasons/2025-26/schedule.html">Season 2025/2026</a> for last year’s box scores.</td></tr>';
    return;
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
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  tbody.innerHTML = data.games
    .map(function (g) {
      var h = g.home;
      var a = g.away;
      var matchup =
        "Team " +
        h.team +
        " (" +
        lastName(h.captain) +
        ") vs Team " +
        a.team +
        " (" +
        lastName(a.captain) +
        ")";
      var score = h.score + " – " + a.score;
      var winClass = "";
      if (g.winner === h.team) winClass = "winner-home";
      else if (g.winner === a.team) winClass = "winner-away";
      else if (g.winner == null && h.score === a.score) winClass = "tie-game";

      return (
        '<tr class="' +
        winClass +
        '">' +
        "<td>" +
        esc(g.date) +
        (g.week ? ' <span class="muted-week">W' + g.week + "</span>" : "") +
        "</td>" +
        "<td>" +
        esc(slotLabel(g.slot)) +
        (g.time ? ' <span class="muted-week">' + esc(g.time) + "</span>" : "") +
        "</td>" +
        "<td>" +
        esc(matchup) +
        "</td>" +
        '<td class="num score-cell">' +
        esc(score) +
        "</td>" +
        '<td><a class="box-link" href="game.html?id=' +
        encodeURIComponent(g.id) +
        '">Box score</a></td>' +
        "</tr>"
      );
    })
    .join("");
})();
