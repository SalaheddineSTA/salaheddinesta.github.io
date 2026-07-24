(function () {
  "use strict";

  /* ---------- Mobile sidebar toggle ---------- */
  const sidebar = document.getElementById("sidebar");
  const navToggle = document.getElementById("navToggle");
  const scrim = document.getElementById("scrim");

  function closeSidebar() {
    sidebar.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      const isOpen = sidebar.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }
  if (scrim) scrim.addEventListener("click", closeSidebar);

  document.querySelectorAll('.sidebar-scroll a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", closeSidebar);
  });

  /* ---------- Top nav active-section highlighting ---------- */
  const navLinks = Array.from(document.querySelectorAll(".topnav a"));
  const sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  function onScroll() {
    let currentId = sections[0] && sections[0].id;
    const scrollPos = window.scrollY + 120;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) currentId = sec.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + currentId);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- GitHub portfolio: latest repos, fetched live ---------- */
  const GITHUB_USER = "SalaheddineSTA";
  const repoGrid = document.getElementById("repoGrid");
  const repoStatus = document.getElementById("repoStatus");

  const LANG_COLORS = {
    "C++": "#f34b7d", "C": "#555555", "Python": "#3572A5",
    "JavaScript": "#f1e05a", "C#": "#178600", "HTML": "#e34c26",
    "CSS": "#563d7c", "Rust": "#dea584", "Jupyter Notebook": "#DA5B0B"
  };

  function timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diffMs / 86400000);
    if (days < 1) return "today";
    if (days === 1) return "1 day ago";
    if (days < 30) return days + " days ago";
    const months = Math.floor(days / 30);
    if (months < 12) return months + (months === 1 ? " month ago" : " months ago");
    const years = Math.floor(months / 12);
    return years + (years === 1 ? " year ago" : " years ago");
  }

  function extractReadmeQuoteLine(content) {
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith(">")) {
        return trimmed.replace(/^>\s?/, "").trim();
      }
    }
    return "";
  }

  function getRepoDescription(repo) {
    return fetch("https://api.github.com/repos/" + GITHUB_USER + "/" + repo.name + "/readme", {
      headers: { Accept: "application/vnd.github+json" }
    })
      .then(function (res) {
        if (!res.ok) throw new Error("README not found");
        return res.json();
      })
      .then(function (data) {
        if (!data.content) return repo.description || "No description yet.";
        const decoded = window.atob(data.content.replace(/\s/g, ""));
        return extractReadmeQuoteLine(decoded) || repo.description || "No description yet.";
      })
      .catch(function () {
        return repo.description || "No description yet.";
      });
  }

  function repoCard(repo) {
    const a = document.createElement("a");
    a.className = "repo-card";
    a.href = repo.html_url;
    a.target = "_blank";
    a.rel = "noopener";

    const color = LANG_COLORS[repo.language] || "#8b96a0";

    const descriptionText = repo.descriptionText || repo.description || "No description yet.";

    a.innerHTML =
      '<span class="bracket tl small"></span><span class="bracket tr small"></span>' +
      '<span class="bracket bl small"></span><span class="bracket br small"></span>' +
      '<span class="repo-name">' +
        '<svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M12 .5a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.7-1.4-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.5.1-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 016 0c2.3-1.6 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.7 5.6-5.4 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .5z"/></svg>' +
        escapeHtml(repo.name) +
      "</span>" +
      '<span class="repo-desc">' + escapeHtml(descriptionText) + "</span>" +
      '<span class="repo-meta">' +
        (repo.language ? '<span><span class="dot" style="background:' + color + '"></span>' + escapeHtml(repo.language) + "</span>" : "") +
        '<span>★ ' + repo.stargazers_count + "</span>" +
        "<span>" + timeAgo(repo.pushed_at) + "</span>" +
      "</span>";
    return a;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  fetch("https://api.github.com/users/" + GITHUB_USER + "/repos?sort=pushed&per_page=100")
    .then(function (res) {
      if (!res.ok) throw new Error("GitHub API error " + res.status);
      return res.json();
    })
    .then(function (repos) {
      const top = repos
        .filter(function (r) { return !r.fork; })
        .sort(function (a, b) { return new Date(b.pushed_at) - new Date(a.pushed_at); })
        .slice(0, 6);

      if (!top.length) {
        repoStatus.textContent = "No public repositories found.";
        return;
      }

      return Promise.all(top.map(function (repo) {
        return getRepoDescription(repo).then(function (descriptionText) {
          return Object.assign({}, repo, { descriptionText: descriptionText });
        });
      }));
    })
    .then(function (reposWithDescriptions) {
      if (!reposWithDescriptions || !reposWithDescriptions.length) return;

      repoGrid.innerHTML = "";
      reposWithDescriptions.forEach(function (repo) { repoGrid.appendChild(repoCard(repo)); });
    })
    .catch(function () {
      repoStatus.textContent =
        "Couldn't reach the GitHub API right now — see the full list at github.com/" + GITHUB_USER + ".";
    });

  /* ---------- Blog list rendering (data comes from js/blog-data.js) ---------- */
  const blogList = document.getElementById("blogList");
  if (blogList && typeof blogPosts !== "undefined") {
    const sorted = blogPosts.slice().sort(function (a, b) {
      if (!a.date) return -1;
      if (!b.date) return 1;
      return new Date(b.date) - new Date(a.date);
    });

    sorted.forEach(function (post) {
      const card = document.createElement("div");
      card.className = "blog-card" + (post.url ? " is-live" : "");
      card.innerHTML =
        '<span class="bracket tl small"></span><span class="bracket tr small"></span>' +
        '<span class="bracket bl small"></span><span class="bracket br small"></span>' +
        '<span class="blog-badge">' + (post.date ? formatDate(post.date) : "Coming soon") + "</span>" +
        "<h3>" + escapeHtml(post.title) + "</h3>" +
        "<p>" + escapeHtml(post.excerpt) + "</p>" +
        (post.url ? '<a class="blog-link" href="' + post.url + '">Read the post →</a>' : "");
      blogList.appendChild(card);
    });
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  /* ---------- Contact form → mailto (static site, no backend) ---------- */
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const data = new FormData(contactForm);
      const name = data.get("name") || "";
      const email = data.get("email") || "";
      const message = data.get("message") || "";
      const subject = encodeURIComponent("Message from " + name);
      const body = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
      window.location.href = "mailto:saleh.sta@live.fr?subject=" + subject + "&body=" + body;
    });
  }
})();
