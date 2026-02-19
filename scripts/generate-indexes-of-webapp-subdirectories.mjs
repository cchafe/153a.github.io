#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WEBAPPS_DIRNAME = "webapps";
const webappsDir = path.join(ROOT, WEBAPPS_DIRNAME);

function escHtml(s) {
  return String(s)
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

async function listImmediateSubdirs(dirAbs) {
  const entries = await fs.readdir(dirAbs, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith("."))
    .sort((a, b) => a.localeCompare(b, "en"));
}

async function listHtmlFilesInDir(dirAbs) {
  const entries = await fs.readdir(dirAbs, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => /\.(html?)$/i.test(n))
    .filter((n) => n.toLowerCase() !== "index.html")
    .sort((a, b) => a.localeCompare(b, "en"));
}

function pageShell(title, nowIso, bodyHtml, backLinksHtml) {
  return (
`<!doctype html>
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
    .toplink { margin-top: 1.25rem; }
    code { background: #f5f5f5; padding: 0.1rem 0.25rem; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${escHtml(title)}</h1>
  <p class="meta">Auto-generated on <code>${escHtml(nowIso)}</code>. Do not edit manually.</p>

${bodyHtml}

${backLinksHtml}
</body>
</html>
`
  );
}

async function writeFileEnsuringDir(fileAbs, content) {
  await fs.mkdir(path.dirname(fileAbs), { recursive: true });
  await fs.writeFile(fileAbs, content, "utf8");
}

function ulFromItems(itemsHtml) {
  if (!itemsHtml.length) return "";
  return "<ul>\n" + itemsHtml.join("\n") + "\n  </ul>";
}

async function generateIndexForWebappSubdir(subdirName) {
  const dirAbs = path.join(webappsDir, subdirName);
  const outFile = path.join(dirAbs, "index.html");

  const htmlFiles = await listHtmlFilesInDir(dirAbs);
  const nowIso = new Date().toISOString();
  const title = WEBAPPS_DIRNAME + "/" + subdirName + "/";

  let bodyHtml = "";
  if (htmlFiles.length) {
    const items = htmlFiles.map((f) => {
      const href = "./" + encodeURIComponent(f);
      return "    <li><a href=\"" + href + "\">" + escHtml(f) + "</a></li>";
    });
    bodyHtml = "  " + ulFromItems(items);
  } else {
    bodyHtml =
      "  <p class=\"empty\">No HTML files found in <code>" +
      escHtml(WEBAPPS_DIRNAME + "/" + subdirName + "/") +
      "</code> (other than <code>index.html</code>).</p>";
  }

  const backLinksHtml =
    "  <p class=\"toplink\"><a href=\"../\">← Back to " + escHtml(WEBAPPS_DIRNAME) + "/</a></p>\n" +
    "  <p class=\"toplink\"><a href=\"../../\">← Back to site root</a></p>";

  const html = pageShell(title, nowIso, bodyHtml, backLinksHtml);

  await writeFileEnsuringDir(outFile, html);
  console.log(
    "Wrote " + path.relative(ROOT, outFile) + " with " + htmlFiles.length + " links."
  );
}

async function generateWebappsIndex(subdirs) {
  const outFile = path.join(webappsDir, "index.html");
  const nowIso = new Date().toISOString();
  const title = WEBAPPS_DIRNAME + "/";

  let bodyHtml = "";
  if (subdirs.length) {
    const items = subdirs.map((d) => {
      const href = "./" + encodeURIComponent(d) + "/";
      return "    <li><a href=\"" + href + "\">" + escHtml(d) + "/</a></li>";
    });
    bodyHtml = "  " + ulFromItems(items);
  } else {
    bodyHtml =
      "  <p class=\"empty\">No subdirectories found in <code>" +
      escHtml(WEBAPPS_DIRNAME + "/") +
      "</code>.</p>";
  }

  const backLinksHtml =
    "  <p class=\"toplink\"><a href=\"../\">← Back to site root</a></p>";

  const html = pageShell(title, nowIso, bodyHtml, backLinksHtml);

  await writeFileEnsuringDir(outFile, html);
  console.log(
    "Wrote " + path.relative(ROOT, outFile) + " with " + subdirs.length + " links."
  );
}

async function main() {
  if (!(await isDirectory(webappsDir))) {
    console.error("Missing directory: " + webappsDir);
    process.exit(1);
  }

  const subdirs = await listImmediateSubdirs(webappsDir);

  for (const subdir of subdirs) {
    await generateIndexForWebappSubdir(subdir);
  }

  await generateWebappsIndex(subdirs);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

