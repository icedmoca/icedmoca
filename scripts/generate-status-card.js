const fs = require("fs");
const axios = require("axios");

const URL = "https://mrshu.github.io/github-statuses/parsed/incidents.jsonl";

function escapeXML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmtDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

(async () => {
  fs.mkdirSync("svgs", { recursive: true });

  const { data } = await axios.get(URL, {
    headers: { "User-Agent": "icedmoca-github-status-card" }
  });

  const incidents = data
    .trim()
    .split("\n")
    .map(line => JSON.parse(line));

  const today = new Date();
  const days = [];

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);

    const dayIncidents = incidents.filter(x => {
      const raw = x.started_at || x.created_at || x.date || x.startedAt;
      if (!raw) return false;
      return String(raw).slice(0, 10) === key;
    });

    let status = "operational";

    const text = JSON.stringify(dayIncidents).toLowerCase();

    if (text.includes("major") || text.includes("outage")) status = "major";
    else if (text.includes("minor") || text.includes("degraded") || text.includes("partial")) status = "minor";
    else if (text.includes("maintenance")) status = "maintenance";

    days.push({ key, status });
  }

  const incidentCount = days.filter(d => d.status !== "operational").length;
  const uptime = (((90 - incidentCount) / 90) * 100).toFixed(2);

  const colors = {
    operational: "#2da44e",
    minor: "#d97706",
    major: "#cf222e",
    maintenance: "#1f6feb"
  };

  const bars = days.map((d, i) => {
    const x = 48 + i * 14;
    return `<rect x="${x}" y="150" width="9" height="54" rx="4" fill="${colors[d.status]}"/>`;
  }).join("");

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="300" viewBox="0 0 1400 300">
  <rect width="1400" height="300" fill="#0d1117"/>

  <rect x="30" y="30" width="1340" height="240" rx="22" fill="#161b22" stroke="#30363d"/>

  <text x="60" y="82" fill="#f0f6fc" font-size="30" font-family="Arial" font-weight="700">
    Last 90 days uptime
  </text>

  <text x="1030" y="75" fill="#8b949e" font-size="17" font-family="Arial">
    Last updated ${escapeXML(fmtDate(today))}
  </text>

  <text x="1030" y="105" fill="#8b949e" font-size="17" font-family="Arial">
    ${incidentCount} incidents in last 90 days
  </text>

  <text x="60" y="130" fill="#f0f6fc" font-size="21" font-family="Arial" font-weight="700">
    GitHub Platform
  </text>

  <text x="1160" y="130" fill="#8b949e" font-size="21" font-family="Arial" font-weight="700">
    ${uptime}% uptime
  </text>

  ${bars}

  <text x="60" y="232" fill="#8b949e" font-size="15" font-family="Arial">90 days ago</text>
  <text x="1250" y="232" fill="#8b949e" font-size="15" font-family="Arial">Today</text>

  <circle cx="60" cy="252" r="6" fill="${colors.operational}"/>
  <text x="74" y="257" fill="#8b949e" font-size="14" font-family="Arial">Operational</text>

  <circle cx="190" cy="252" r="6" fill="${colors.maintenance}"/>
  <text x="204" y="257" fill="#8b949e" font-size="14" font-family="Arial">Maintenance</text>

  <circle cx="335" cy="252" r="6" fill="${colors.minor}"/>
  <text x="349" y="257" fill="#8b949e" font-size="14" font-family="Arial">Minor</text>

  <circle cx="430" cy="252" r="6" fill="${colors.major}"/>
  <text x="444" y="257" fill="#8b949e" font-size="14" font-family="Arial">Major</text>
</svg>`;

  fs.writeFileSync("svgs/github-status-card.svg", svg);
  console.log("Generated pure SVG github-status-card.svg");
})();
