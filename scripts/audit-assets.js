#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const maxGitFileBytes = 95 * 1024 * 1024;
const assetConfigPath = path.join(root, "static/robosnap/viewers/asset-config.js");
const assetConfig = fs.existsSync(assetConfigPath) ? fs.readFileSync(assetConfigPath, "utf8") : "";
const gaussianBaseMatch = assetConfig.match(/^\s*window\.ROBOSNAP_GAUSSIAN_BASE\s*=\s*["']([^"']+)["']/m);
const gaussianBaseConfigured = Boolean(gaussianBaseMatch && gaussianBaseMatch[1].trim());

const checkedFiles = [
  "index.html",
  "static/css/index.css",
  "static/js/index.js",
  "static/robosnap/viewers/scene-viewer.html",
  "static/robosnap/viewers/scene-viewer.js",
  "static/robosnap/viewers/foreground-clean.html",
  "static/robosnap/viewers/foreground-viewer.html",
  "static/robosnap/viewers/foreground-viewer.js"
];

function walk(dir, visit) {
  for (const name of fs.readdirSync(dir)) {
    if (name === ".git") continue;
    const full = path.join(dir, name);
    const stat = fs.lstatSync(full);
    visit(full, stat);
    if (stat.isDirectory()) walk(full, visit);
  }
}

function isExternal(raw) {
  return /^(?:[a-z]+:)?\/\//i.test(raw) ||
    raw.startsWith("mailto:") ||
    raw.startsWith("data:") ||
    raw.startsWith("#");
}

function collectRefs(file) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const refs = [];
  const patterns = [
    /(?:src|href|poster|data-video-src)=["']([^"']+)["']/g,
    /url\(["']?([^)'\"]+)["']?\)/g,
    /(?:splat|mesh|meta):\s*["']([^"']+)["']/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      const raw = match[1];
      if (!raw || isExternal(raw)) continue;
      refs.push(raw);
    }
  }
  return refs;
}

const symlinks = [];
const oversized = [];

walk(root, (full, stat) => {
  const rel = path.relative(root, full);
  if (stat.isSymbolicLink()) symlinks.push(rel);
  if (stat.isFile() && stat.size > maxGitFileBytes) {
    oversized.push({ rel, size: stat.size });
  }
});

const missing = [];
const externallyHostedGaussian = [];
const outside = [];
let refCount = 0;

for (const file of checkedFiles) {
  const refs = collectRefs(file);
  refCount += refs.length;
  for (const raw of refs) {
    const clean = raw.split(/[?#]/)[0];
    const resolved = path.resolve(root, path.dirname(file), clean);
    if (!resolved.startsWith(root + path.sep)) {
      outside.push({ file, raw });
    } else if (!fs.existsSync(resolved)) {
      const rel = path.relative(root, resolved).replaceAll(path.sep, "/");
      if (gaussianBaseConfigured && /^static\/robosnap\/gaussian\/[^/]+\.ply$/.test(rel)) {
        externallyHostedGaussian.push({ file, raw });
      } else {
        missing.push({ file, raw });
      }
    }
  }
}

console.log(`Checked local resource references: ${refCount}`);
console.log(`Symlinks: ${symlinks.length}`);
console.log(`Missing local resources: ${missing.length}`);
console.log(`Externally hosted Gaussian PLY refs: ${externallyHostedGaussian.length}`);
console.log(`Resources outside web/: ${outside.length}`);
console.log(`Files above 95 MiB: ${oversized.length}`);
console.log(`Production Gaussian asset base configured: ${gaussianBaseConfigured ? "yes" : "no"}`);

if (symlinks.length) {
  console.log("\nSymlinks:");
  symlinks.forEach((rel) => console.log(`  ${rel}`));
}

if (missing.length) {
  console.log("\nMissing:");
  missing.forEach(({ file, raw }) => console.log(`  ${file}: ${raw}`));
}

if (outside.length) {
  console.log("\nOutside web/:");
  outside.forEach(({ file, raw }) => console.log(`  ${file}: ${raw}`));
}

if (oversized.length) {
  console.log("\nLarge files:");
  oversized
    .sort((a, b) => b.size - a.size)
    .forEach(({ rel, size }) => {
      console.log(`  ${(size / 1024 / 1024).toFixed(1)} MiB  ${rel}`);
    });
}

const oversizedPublishBlockers = oversized.filter(({ rel }) => {
  return !(gaussianBaseConfigured && /^static\/robosnap\/gaussian\/[^/]+\.ply$/.test(rel));
});

if (!gaussianBaseConfigured && oversized.some(({ rel }) => /^static\/robosnap\/gaussian\/[^/]+\.ply$/.test(rel))) {
  console.log("\nProduction blocker: Gaussian PLY files exceed GitHub's ordinary file limit.");
  console.log("Set ROBOSNAP_GAUSSIAN_BASE in static/robosnap/viewers/asset-config.js after hosting them externally.");
}

if (symlinks.length || missing.length || outside.length || oversizedPublishBlockers.length) {
  process.exitCode = 1;
}
