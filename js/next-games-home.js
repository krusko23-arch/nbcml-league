(function () {
  var dateEl = document.getElementById("next-game-date");
  var body = document.getElementById("next-games-body");
  var note = document.getElementById("next-games-note");
  if (!body) return;

  var data = window.NBCML_SCHEDULE;
  if (!data || !data.weeks) return;

  var MONTHS = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11
  };

  function parseClubDate(str) {
    // 22-Sep-26 or 5-Jan-27
    var m = String(str || "").match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
    if (!m) return null;
    var day = parseInt(m[1], 10);
    var mon = MONTHS[m[2]];
    if (mon == null) return null;
    var year = 2000 + parseInt(m[3], 10);
    return new Date(year, mon, day);
  }

  function formatLong(d, club) {
    if (!d) return club || "";
    try {
      return d.toLocaleDateString("en-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch (e) {
      return club || "";
    }
  }

  function tipShort(time) {
    if (!time) return "—";
    return String(time).replace(/\s*pm$/i, "");
  }

  function teamLink(num) {
    if (num == null || num === "") return "—";
    return (
      '<a class="team-roster-link" href="rosters.html?team=' +
      num +
      "#team-" +
      num +
      '">Team ' +
      num +
      "</a>"
    );
  }

  function matchupCell(slot) {
    if (!slot || slot.home == null || slot.away == null) {
      if (slot && slot.label) return slot.label;
      return "—";
    }
    return teamLink(slot.home) + " vs " + teamLink(slot.away);
  }

  function isPlayableWeek(w) {
    if (!w || !w.early) return false;
    return w.early.home != null && w.early.away != null;
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var next = null;
  for (var i = 0; i < data.weeks.length; i++) {
    var w = data.weeks[i];
    if (!isPlayableWeek(w)) continue;
    var d = parseClubDate(w.date);
    if (!d) continue;
    if (d.getTime() >= today.getTime()) {
      next = w;
      break;
    }
  }
  if (!next) {
    // Season over or unparsable — show last playable week
    for (var j = data.weeks.length - 1; j >= 0; j--) {
      if (isPlayableWeek(data.weeks[j])) {
        next = data.weeks[j];
        break;
      }
    }
  }
  if (!next) return;

  var nextDate = parseClubDate(next.date);
  if (dateEl) {
    dateEl.textContent =
      "Next game · " + formatLong(nextDate, next.date) + (next.week != null ? " (Week " + next.week + ")" : "");
  }

  var slots = [
    { name: "Early", key: "early" },
    { name: "Middle", key: "middle" },
    { name: "Late", key: "late" }
  ];

  body.innerHTML = slots
    .map(function (s) {
      var slot = next[s.key] || {};
      return (
        "<tr><td>" +
        s.name +
        "</td><td>" +
        tipShort(slot.time || (data.times && data.times[s.key])) +
        "</td><td>" +
        matchupCell(slot) +
        "</td></tr>"
      );
    })
    .join("");

  if (note) {
    note.innerHTML =
      "Week " +
      next.week +
      " matchups · team names open that roster. Full grid on the " +
      '<a href="schedule.html">Schedule</a>.';
  }
})();
