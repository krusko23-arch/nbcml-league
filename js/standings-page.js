(function () {
  var data = window.NBCML_STANDINGS || {};
  var tbody = document.querySelector("#standings-table tbody");
  if (!tbody) return;

  function slotOrder(slot) {
    var s = String(slot || "").toLowerCase();
    if (s === "early") return 0;
    if (s === "middle" || s === "mid") return 1;
    if (s === "late") return 2;
    return 9;
  }

  /**
   * Standings from game results (data/games.js).
   * Order: points desc; ties on points → head-to-head wins among the tied
   * teams (mini-group for 3+), then point differential, points for, team #.
   */
  function computeFromGames(games, fallbackRows) {
    var captains = {};
    var teams = {};
    function ensure(num) {
      if (!teams[num]) {
        teams[num] = { team: num, w: 0, l: 0, t: 0, pf: 0, pa: 0, res: [] };
      }
      return teams[num];
    }
    (fallbackRows || []).forEach(function (r) {
      ensure(r.team);
      if (r.captain) captains[r.team] = r.captain;
    });
    var ordered = games.slice().sort(function (a, b) {
      var ad = a.isoDate || "";
      var bd = b.isoDate || "";
      if (ad !== bd) return ad < bd ? -1 : 1;
      return slotOrder(a.slot) - slotOrder(b.slot);
    });
    ordered.forEach(function (g) {
      if (!g.home || !g.away) return;
      [[g.home, g.away], [g.away, g.home]].forEach(function (pair) {
        var me = pair[0];
        var op = pair[1];
        var s = ensure(me.team);
        if (me.captain && !captains[me.team]) captains[me.team] = me.captain;
        s.pf += Number(me.score) || 0;
        s.pa += Number(op.score) || 0;
        var r = me.score > op.score ? "W" : me.score < op.score ? "L" : "T";
        if (r === "W") s.w++;
        else if (r === "L") s.l++;
        else s.t++;
        s.res.push(r);
      });
    });

    var list = Object.keys(teams).map(function (k) {
      var s = teams[k];
      var gp = s.w + s.l + s.t;
      s.tp = 2 * s.w + s.t;
      s.diff = s.pf - s.pa;
      s.ppg = gp ? s.pf / gp : 0;
      s.opp_ppg = gp ? s.pa / gp : 0;
      var last = s.res.length ? s.res[s.res.length - 1] : "";
      var n = 0;
      for (var i = s.res.length - 1; i >= 0 && s.res[i] === last; i--) n++;
      s.streak = last ? n + " " + last : "—";
      s.captain = captains[s.team] || "";
      return s;
    });

    // Head-to-head wins within each group of teams tied on points
    var byTp = {};
    list.forEach(function (s) {
      (byTp[s.tp] = byTp[s.tp] || []).push(s.team);
    });
    list.forEach(function (s) {
      var group = byTp[s.tp];
      s.h2h = 0;
      if (group.length < 2) return;
      ordered.forEach(function (g) {
        if (!g.home || !g.away) return;
        var ht = g.home.team;
        var at = g.away.team;
        if (group.indexOf(ht) === -1 || group.indexOf(at) === -1) return;
        if (g.winner === s.team) s.h2h++;
      });
    });

    list.sort(function (a, b) {
      if (b.tp !== a.tp) return b.tp - a.tp;
      if (b.h2h !== a.h2h) return b.h2h - a.h2h;
      if (b.diff !== a.diff) return b.diff - a.diff;
      if (b.pf !== a.pf) return b.pf - a.pf;
      return a.team - b.team;
    });
    var top = list.length ? list[0].tp : 0;
    list.forEach(function (s, i) {
      s.seed = i + 1;
      s.gbl = top - s.tp;
    });
    return list;
  }

  var games = window.NBCML_GAMES && window.NBCML_GAMES.games;
  var rows =
    games && games.length
      ? computeFromGames(games, data.standings)
      : data.standings || [];
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
          '<td class="num">' + Number(s.ppg).toFixed(1) + "</td>" +
          '<td class="num">' + Number(s.opp_ppg).toFixed(1) + "</td>" +
          '<td class="num">' + s.tp + "</td>" +
          '<td class="num">' + s.gbl + "</td>" +
          "<td>" + s.streak + "</td>" +
        "</tr>"
      );
    })
    .join("");
})();
