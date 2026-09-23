(function () {
  var data = window.NBCML_STANDINGS;
  if (!data) return;
  var lede = document.getElementById("standings-lede");
  if (lede) {
    lede.textContent =
      (data.label || "Standings") +
      (data.gamesPlayed ? " · " + data.gamesPlayed + " games played" : "") +
      ". " +
      (data.note || "");
  }
  var tbody = document.querySelector("#standings-table tbody");
  if (!tbody) return;
  var rows = data.standings || [];
  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="11">No standings yet — 2026–27 season has not started. See <a href="seasons/2025-26/standings.html">Season 2025/2026</a> for FINAL results.</td></tr>';
    return;
  }
  tbody.innerHTML = rows
    .map(function (s) {
      return (
        "<tr>" +
          '<td class="num">' + s.seed + "</td>" +
          "<td>Team " + s.team + "</td>" +
          "<td>" + s.captain + "</td>" +
          '<td class="num">' + s.w + "</td>" +
          '<td class="num">' + s.l + "</td>" +
          '<td class="num">' + (s.t != null ? s.t : 0) + "</td>" +
          '<td class="num">' + s.ppg.toFixed(1) + "</td>" +
          '<td class="num">' + s.opp_ppg.toFixed(1) + "</td>" +
          '<td class="num">' + s.tp + "</td>" +
          '<td class="num">' + s.gbl + "</td>" +
          "<td>" + s.streak + "</td>" +
        "</tr>"
      );
    })
    .join("");
})();
