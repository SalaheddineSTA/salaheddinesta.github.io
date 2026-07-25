const GITHUB_USER = "SalaheddineSTA";
const MAX_REPOS = 6;

const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(date));

const renderRepos = (repos) => {
  const container = document.querySelector("#repos");
  container.innerHTML = repos.map((repo, index) => `
    <article class="repo-card reveal visible">
      <div class="repo-topline">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <span>Updated ${formatDate(repo.pushed_at)}</span>
      </div>
      <h3>${escapeHTML(repo.name.replaceAll("-", " "))}</h3>
      <p>${escapeHTML(repo.description || "An open-source project from my GitHub workspace.")}</p>
      <div class="repo-footer">
        <span class="language"><i style="--dot:${escapeHTML(languageColor(repo.language))}"></i>${escapeHTML(repo.language || "Code")}</span>
        <a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHTML(repo.name)} on GitHub">View project ↗</a>
      </div>
    </article>
  `).join("");
};

const languageColor = (language) => ({
  "C++": "#e06b46", "C": "#7b8da6", "Python": "#d8ad45", "JavaScript": "#bd8d2f",
  "HTML": "#e06b46", "CSS": "#876fa9", "Rust": "#a54d2f"
}[language] || "#6b8f7b");

const cleanMarkdown = (text) => text
  .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  .replace(/<[^>]+>/g, "")
  .replace(/[*_`~]/g, "")
  .replace(/\s+/g, " ")
  .trim();

const getReadmeDescription = async (repo) => {
  const fallback = "An open-source project from my GitHub workspace.";
  try {
    const branch = encodeURIComponent(repo.default_branch || "main");
    const name = encodeURIComponent(repo.name);
    const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${name}/${branch}/README.md`);
    if (!response.ok) return fallback;
    const readme = await response.text();
    const firstBlockquote = readme.match(/^>\s*(.+)$/m);
    if (!firstBlockquote) return fallback;
    return cleanMarkdown(firstBlockquote[1]) || fallback;
  } catch {
    return fallback;
  }
};

const loadRepos = async () => {
  const container = document.querySelector("#repos");
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=30`, {
      headers: { "Accept": "application/vnd.github+json" }
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const repos = (await response.json())
      .filter((repo) => !repo.fork && !repo.archived)
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, MAX_REPOS);
    if (!repos.length) throw new Error("No public repositories found");
    const descriptions = await Promise.all(repos.map(getReadmeDescription));
    repos.forEach((repo, index) => {
      repo.description = descriptions[index];
    });
    renderRepos(repos);
  } catch (error) {
    container.innerHTML = `
      <div class="repo-error">
        <p>GitHub is taking a coffee break.</p>
        <a class="arrow-link" href="https://github.com/${GITHUB_USER}?tab=repositories" target="_blank" rel="noreferrer">Browse repositories directly ↗</a>
      </div>`;
  }
};

const setupNavigation = () => {
  const links = [...document.querySelectorAll(".site-nav a")];
  const menu = document.querySelector(".site-nav");
  const toggle = document.querySelector(".menu-toggle");
  const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    menu.classList.toggle("open", !isOpen);
  });

  links.forEach((link) => link.addEventListener("click", () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    menu.classList.remove("open");
  }));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
      }
    });
  }, { rootMargin: "-35% 0px -60% 0px" });
  sections.forEach((section) => observer.observe(section));
};

const setupReveals = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
};

document.querySelector("#year").textContent = new Date().getFullYear();
setupNavigation();
setupReveals();
loadRepos();
