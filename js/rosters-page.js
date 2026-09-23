(function () {
  function playerSlug(name) {
    return String(name || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function requestedTeamId() {
    var params = new URLSearchParams(location.search || "");
    var q = params.get("team");
    if (q && /^\d+$/.test(q)) return q;
    var hash = (location.hash || "").replace(/^#/, "");
    var m = hash.match(/^team-(\d+)$/);
    return m ? m[1] : null;
  }

  var grid = document.getElementById("rosters-grid");
  var teams = window.NBCML_ROSTERS || [];
  if (!grid) return;
  if (!teams.length) {
    grid.innerHTML = '<p style="padding:20px;background:#fff">Roster data failed to load.</p>';
    return;
  }
  grid.innerHTML = teams
    .map(function (team) {
      var players = team.players
        .map(function (p) {
          var mark = p.captain ? ' <span class="captain-mark">(C)</span>' : "";
          var cls = p.captain ? ' class="captain"' : "";
          var href = "individual-scoring.html#p-" + playerSlug(p.name);
          return (
            "<li" +
            cls +
            '><a class="player-link" href="' +
            href +
            '">' +
            p.name +
            mark +
            "</a></li>"
          );
        })
        .join("");
      return (
        '<div class="team-col" id="team-' +
        team.id +
        '" data-team="' +
        team.id +
        '" style="background:' +
        team.color +
        '">' +
        '<div class="team-col-header">' +
        '<span class="team-num">' +
        team.id +
        "</span>" +
        '<span class="team-name">Team ' +
        team.id +
        "</span>" +
        "</div>" +
        '<ul class="player-list">' +
        players +
        "</ul>" +
        "</div>"
      );
    })
    .join("");

  function focusTeam(id) {
    if (!id) return;
    var el = document.getElementById("team-" + id);
    if (!el) return;
    grid.querySelectorAll(".team-col.is-target").forEach(function (c) {
      c.classList.remove("is-target");
    });
    el.classList.add("is-target");
    // Roster grid is horizontal — center the column in view.
    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    var scroller = document.querySelector(".rosters-scroll");
    if (scroller) {
      var left =
        el.offsetLeft - (scroller.clientWidth - el.offsetWidth) / 2;
      scroller.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
  }

  function focusFromLocation() {
    focusTeam(requestedTeamId());
  }

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  focusFromLocation();
  requestAnimationFrame(focusFromLocation);
  setTimeout(focusFromLocation, 50);
  setTimeout(focusFromLocation, 250);
  window.addEventListener("hashchange", focusFromLocation);
  window.addEventListener("load", focusFromLocation);
})();
