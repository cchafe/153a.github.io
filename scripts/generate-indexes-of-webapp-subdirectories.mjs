#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const webappsDir = path.join(ROOT, "webapps");

function escHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function isDirectory(p) {
  const st = await fs.stat(p).catch(() => null);
  return !!st && st.isDirectory();
}

async function generateIndexForSubdir(subdirName) {
  const dirAbs = path.join(webappsDir, subdirName);
  const outFile = path.join(dirAbs, "index.html");

  const entries = await fs.readdir(dirAbs, { withFileTypes: true });

  const htmlFiles = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => /\.(html?)$/i.test(n))
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

  const title = `webapps/${subdirName}/`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escHtml(title)}</title>
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
  <h1>${escHtml(title)}</h1>
  <p class="meta">Auto-generated on <code>${escHtml(now)}</code>. Do not edit manually.</p>

  ${
    htmlFiles.length
      ? `<ul>\n${items}\n    </ul>`
      : `<p class="empty">No HTML files found in <code>${escHtml(
          `webapps/${subdirName}/`
        )}</code> (other than <code>index.html</code>).</p>`
  }

  <p class="toplink"><a href="../../">← Back to site root</a></p>
</body>
</html>
`;

  await fs.writeFile(outFile, html, "utf8");
  console.log(
    `Wrote ${path.relative(ROOT, outFile)} with ${htmlFiles.length} links.`
  );
}

async function main() {
  if (!(await isDirectory(webappsDir))) {
    console.error(`Missing directory: ${webappsDir}`);
    process.exit(1);
  }

  const entries = await fs.readdir(webappsDir, { withFileTypes: true });

  const subdirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith(".")) // ignore .gitkeep, .DS_Store-like patterns (dirs), etc.
    .sort((a, b) => a.localeCompare(b, "en"));

  if (subdirs.length === 0) {
    console.log("No subdirectories found under webapps/. Nothing to do.");
    return;
  }

  for (const subdir of subdirs) {
    await generateIndexForSubdir(subdir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

