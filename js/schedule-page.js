(function () {
  var data = window.NBCML_SCHEDULE;
  if (!data) return;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  function teamLink(num, label) {
    if (num == null || num === "") return "—";
    var text = label != null ? label : "T" + num;
    return (
      '<a class="team-roster-link" href="rosters.html?team=' +
      num +
      "#team-" +
      num +
      '">' +
      esc(text) +
      "</a>"
    );
  }

  function buildGameLookup(games) {
    var byWeekSlot = {};
    var byDateSlot = {};
    (games || []).forEach(function (g) {
      if (g.week != null && g.slot) {
        byWeekSlot[String(g.week) + "|" + g.slot] = g;
      }
      if (g.date && g.slot) {
        byDateSlot[g.date + "|" + g.slot] = g;
      }
    });
    return { byWeekSlot: byWeekSlot, byDateSlot: byDateSlot };
  }

  function teamsOk(game, home, away) {
    if (home == null || away == null) return true;
    if (!game || !game.home || !game.away) return true;
    var ht = game.home.team;
    var at = game.away.team;
    return (ht === home && at === away) || (ht === away && at === home);
  }

  /** Prefer week+slot; fallback date+slot; optionally verify home/away. */
  function findResult(lookup, weekNum, date, slot, home, away) {
    if (!slot) return null;
    var primary =
      weekNum != null ? lookup.byWeekSlot[String(weekNum) + "|" + slot] : null;
    var fallback = date ? lookup.byDateSlot[date + "|" + slot] : null;
    var candidates = [];
    if (primary) candidates.push(primary);
    if (fallback && fallback !== primary) candidates.push(fallback);
    if (!candidates.length) return null;
    for (var i = 0; i < candidates.length; i++) {
      if (teamsOk(candidates[i], home, away)) return candidates[i];
    }
    return candidates[0];
  }

  var gamesData = window.NBCML_GAMES;
  var lookup = buildGameLookup(gamesData && gamesData.games);

  var caps = document.getElementById("captain-list");
  if (caps && data.captains) {
    caps.innerHTML = Object.keys(data.captains)
      .sort(function (a, b) {
        return Number(a) - Number(b);
      })
      .map(function (id) {
        return (
          '<span class="chip">' +
          teamLink(id, "T" + id) +
          ' <a class="player-name-link" href="' +
          playerHref(data.captains[id]) +
          '">' +
          esc(data.captains[id]) +
          "</a></span>"
        );
      })
      .join("");
  }

  function matchupCell(slotGame, weekNum, date, slot) {
    if (!slotGame) return "—";
    if (slotGame.label) return esc(slotGame.label);
    if (slotGame.matchup) return esc(slotGame.matchup);
    if (slotGame.home == null || slotGame.away == null) return "—";

    var base =
      teamLink(slotGame.home) + " vs " + teamLink(slotGame.away);
    var result = findResult(
      lookup,
      weekNum,
      date,
      slot,
      slotGame.home,
      slotGame.away
    );
    if (!result || !result.home || !result.away) {
      return '<div class="sched-cell">' + base + "</div>";
    }
    var score =
      result.home.score + "–" + result.away.score;
    return (
      '<div class="sched-cell">' +
      '<div class="sched-matchup">' +
      base +
      "</div>" +
      '<div class="sched-result">' +
      '<span class="sched-score">' +
      esc(score) +
      "</span> " +
      '<a class="box-link" href="game.html?id=' +
      encodeURIComponent(result.id) +
      '">Box score</a>' +
      "</div>" +
      "</div>"
    );
  }

  var tbody = document.querySelector("#schedule-table tbody");
  if (tbody) {
    var weeks = data.weeks || [];
    if (!weeks.length) {
      tbody.innerHTML =
        '<tr><td colspan="5">2026–27 schedule coming soon. See <a href="seasons/2025-26/schedule.html">Season 2025/2026</a> for last year.</td></tr>';
    } else {
      var html = [];
      var holidayInserted = { holiday: false, march: false, gym: false };
      weeks.forEach(function (w) {
        if (!holidayInserted.holiday && w.week === 14) {
          html.push(
            '<tr class="break-row"><td colspan="5">Holiday break — no games Dec 22 &amp; Dec 29</td></tr>'
          );
          holidayInserted.holiday = true;
        }
        if (!holidayInserted.march && w.week === 24) {
          html.push(
            '<tr class="break-row"><td colspan="5">March Break — no games March 17</td></tr>'
          );
          holidayInserted.march = true;
        }
        if (!holidayInserted.gym && w.week === 26) {
          html.push(
            '<tr class="break-row"><td colspan="5">Gym Maintenance — closed April 6</td></tr>'
          );
          holidayInserted.gym = true;
        }
        html.push(
          "<tr>" +
            '<td class="num">' +
            w.week +
            "</td>" +
            "<td>" +
            esc(w.date) +
            "</td>" +
            "<td>" +
            matchupCell(w.early, w.week, w.date, "early") +
            "</td>" +
            "<td>" +
            matchupCell(w.middle, w.week, w.date, "middle") +
            "</td>" +
            "<td>" +
            matchupCell(w.late, w.week, w.date, "late") +
            "</td>" +
            "</tr>"
        );
      });
      tbody.innerHTML = html.join("");
    }
  }

  var pbody = document.querySelector("#playoffs-table tbody");
  if (pbody && data.playoffs && data.playoffs.length) {
    var rows = [];
    data.playoffs.forEach(function (round) {
      round.games.forEach(function (g, i) {
        var matchupHtml = esc(g.matchup);
        var slotKey = (g.slot || "").toLowerCase();
        if (slotKey.indexOf("early") !== -1) slotKey = "early";
        else if (slotKey.indexOf("middle") !== -1) slotKey = "middle";
        else if (slotKey.indexOf("late") !== -1) slotKey = "late";
        else slotKey = "";
        var result = slotKey
          ? findResult(lookup, null, round.date, slotKey, null, null)
          : null;
        if (result && result.home && result.away && result.id) {
          matchupHtml =
            esc(g.matchup) +
            '<div class="sched-result">' +
            '<span class="sched-score">' +
            esc(result.home.score + "–" + result.away.score) +
            "</span> " +
            '<a class="box-link" href="game.html?id=' +
            encodeURIComponent(result.id) +
            '">Box score</a>' +
            "</div>";
        }
        rows.push(
          "<tr>" +
            "<td>" +
            (i === 0 ? esc(round.label) : "") +
            "</td>" +
            "<td>" +
            (i === 0 ? esc(round.date) : "") +
            "</td>" +
            "<td>" +
            esc(g.slot) +
            "</td>" +
            "<td>" +
            matchupHtml +
            "</td>" +
            "<td>" +
            esc(g.note || round.note || "") +
            "</td>" +
            "</tr>"
        );
      });
    });
    pbody.innerHTML =
      rows.join("") ||
      '<tr><td colspan="5">Playoff outline will be posted later in the season.</td></tr>';
  } else if (pbody) {
    pbody.innerHTML =
      '<tr><td colspan="5">Playoff outline will be posted later in the season.</td></tr>';
  }
})();
