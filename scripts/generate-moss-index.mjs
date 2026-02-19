#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const mossDir = path.join(ROOT, "moss");
const outFile = path.join(mossDir, "index.html");

function escHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function main() {
  const st = await fs.stat(mossDir).catch(() => null);
  if (!st || !st.isDirectory()) {
    console.error(`Missing directory: ${mossDir}`);
    process.exit(1);
  }

  const entries = await fs.readdir(mossDir, { withFileTypes: true });

  const htmlFiles = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => /\.(html?|HTML?)$/.test(n))
    .filter((n) => n.toLowerCase() !== "index.html")
    .sort((a, b) => a.localeCompare(b, "en"));

  const now = new Date().toISOString();

  const items = htmlFiles
    .map(
      (f) =>
        `      <li><a href="./${encodeURIComponent(f)}">${escHtml(
          f
        )}</a></li>`
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>moss/</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 2rem; line-height: 1.4; }
    h1 { margin: 0 0 0.75rem; }
    .meta { color: #555; margin: 0 0 1.25rem; }
    ul { padding-left: 1.25rem; }
    li { margin: 0.35rem 0; }
    a { text-decoration: none; }
    a:hover { text-decoration: underline; }
    .empty { color: #777; }
    .toplink { margin-top: 1.5rem; }
    code { background: #f5f5f5; padding: 0.1rem 0.25rem; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>moss/</h1>
  <p class="meta">Auto-generated on <code>${escHtml(now)}</code>. Do not edit manually.</p>

  ${
    htmlFiles.length
      ? `<ul>\n${items}\n    </ul>`
      : `<p class="empty">No HTML files found in <code>moss/</code> (other than <code>index.html</code>).</p>`
  }

  <p class="toplink"><a href="../">← Back to site root</a></p>
</body>
</html>
`;

  await fs.writeFile(outFile, html, "utf8");
  console.log(`Wrote ${path.relative(ROOT, outFile)} with ${htmlFiles.length} links.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

