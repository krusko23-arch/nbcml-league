(function () {
  var data = window.NBCML_SCOREKEEPING;
  if (!data) return;

  var rules = document.getElementById("sk-rules");
  if (rules && data.rules) {
    rules.innerHTML =
      "<strong>Key rules</strong><ul style='margin:8px 0 0;padding-left:1.2rem'>" +
      data.rules.map(function (r) { return "<li>" + r + "</li>"; }).join("") +
      "</ul>";
  }

  function fmt(list) {
    if (!list || !list.length) return "—";
    return list
      .map(function (x) { return x.name + " <span style='color:#888'>(T" + x.team + ")</span>"; })
      .join("<br>");
  }

  var tbody = document.querySelector("#scorekeeping-table tbody");
  if (!tbody) return;
  var weeks = data.weeks || [];
  if (!weeks.length) {
    tbody.innerHTML =
      '<tr><td colspan="5">Scorekeeping assignments coming soon.</td></tr>';
    return;
  }
  tbody.innerHTML = weeks
    .map(function (w) {
      var emptySlots = !(w.early && w.early.length) && !(w.middle && w.middle.length) && !(w.late && w.late.length);
      if (emptySlots && w.note) {
        return (
          '<tr class="break-row">' +
            "<td>" + w.date + "</td>" +
            '<td colspan="3">' + w.note + "</td>" +
            "<td></td>" +
          "</tr>"
        );
      }
      return (
        "<tr>" +
          "<td>" + w.date + "</td>" +
          "<td>" + fmt(w.early) + "</td>" +
          "<td>" + fmt(w.middle) + "</td>" +
          "<td>" + fmt(w.late) + "</td>" +
          "<td>" + (w.note || "") + "</td>" +
        "</tr>"
      );
    })
    .join("");
})();
