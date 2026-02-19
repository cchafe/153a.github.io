#!/usr/bin/env node import { promises as fs } from "node:fs"; import path from "node:path"; const ROOT = process.cwd(); const webappsDir = path.join(ROOT, "webapps"); function escHtml(s) { return s .replaceAll("&", "&") .replaceAll("<", "<") .replaceAll(">", ">") .replaceAll('"', """) .replaceAll("'", "'"); } async function isDirectory(p) { const st = await fs.stat(p).catch(() => null); return !!st && st.isDirectory(); } async function generateIndexForSubdir(subdirName) { const dirAbs = path.join(webappsDir, subdirName); const outFile = path.join(dirAbs, "index.html"); const entries = await fs.readdir(dirAbs, { withFileTypes: true }); const htmlFiles = entries .filter((e) => e.isFile()) .map((e) => e.name) .filter((n) => /\.(html?)$/i.test(n)) .filter((n) => n.toLowerCase() !== "index.html") .sort((a, b) => a.localeCompare(b, "en")); const now = new Date().toISOString(); const items = htmlFiles .map( (f) => `
${escHtml( f )}
` ) .join("\n"); const title = `webapps/${subdirName}/`; const html = `
${escHtml(title)}

Auto-generated on ${escHtml(now)}. Do not edit manually.
${ htmlFiles.length ? `

    \n${items}\n 

` : `

No HTML files found in ${escHtml( `webapps/${subdirName}/` )} (other than index.html).
` }

← Back to webapps/

← Back to site root
`; await fs.writeFile(outFile, html, "utf8"); console.log( `Wrote ${path.relative(ROOT, outFile)} with ${htmlFiles.length} links.` ); } async function generateWebappsIndex(subdirs) { const outFile = path.join(webappsDir, "index.html"); const now = new Date().toISOString(); const items = subdirs .map((d) => `
${escHtml(d)}/
`) .join("\n"); const title = "webapps/"; const html = `
${escHtml(title)}

Auto-generated on ${escHtml(now)}. Do not edit manually.
${ subdirs.length ? `

    \n${items}\n 

` : `

No subdirectories found in webapps/.
` }

← Back to site root
`; await fs.writeFile(outFile, html, "utf8"); console.log(`Wrote ${path.relative(ROOT, outFile)} with ${subdirs.length} links.`); } async function main() { if (!(await isDirectory(webappsDir))) { console.error(`Missing directory: ${webappsDir}`); process.exit(1); } const entries = await fs.readdir(webappsDir, { withFileTypes: true }); const subdirs = entries .filter((e) => e.isDirectory()) .map((e) => e.name) .filter((name) => !name.startsWith(".")) .sort((a, b) => a.localeCompare(b, "en")); // First generate each webapps//index.html for (const subdir of subdirs) { await generateIndexForSubdir(subdir); } // Then generate webapps/index.html linking to each subdir await generateWebappsIndex(subdirs); } main().catch((err) => { console.error(err); process.exit(1); }); 
