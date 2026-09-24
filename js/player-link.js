/**
 * Shared player slug + href helpers for linking names to player.html.
 * Relative href works from site-root pages (and season folders that have player.html).
 */
(function (global) {
  function playerSlug(name) {
    return String(name || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function playerHref(name) {
    var slug = playerSlug(name);
    if (!slug) return "player.html";
    return "player.html?id=" + encodeURIComponent(slug);
  }

  /**
   * @param {string} name display name
   * @param {string} [className] optional CSS class (default player-name-link)
   * @param {string} [innerHtml] optional already-escaped/marked-up inner HTML
   *   (defaults to escaped name)
   */
  function playerLinkHtml(name, className, innerHtml) {
    var cls = className || "player-name-link";
    var inner =
      innerHtml != null
        ? innerHtml
        : String(name == null ? "" : name)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    return (
      '<a class="' +
      cls +
      '" href="' +
      playerHref(name) +
      '">' +
      inner +
      "</a>"
    );
  }

  global.NBCML_playerSlug = playerSlug;
  global.NBCML_playerHref = playerHref;
  global.NBCML_playerLinkHtml = playerLinkHtml;
})(typeof window !== "undefined" ? window : this);
