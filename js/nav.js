/**
 * Highlight the active nav tab based on body[data-page].
 */
(function () {
  function setActiveNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;
    var links = document.querySelectorAll(".site-nav .nav-cell");
    links.forEach(function (link) {
      var key = link.getAttribute("data-nav");
      if (key === page) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setActiveNav);
  } else {
    setActiveNav();
  }
})();
