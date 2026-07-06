#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "static/robosnap/gaussian/manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const base = (process.argv[2] || "").replace(/\/$/, "");

if (!base) {
  console.error("Usage: node scripts/check-gaussian-host.js <public-gaussian-base-url>");
  console.error("Example: node scripts/check-gaussian-host.js https://huggingface.co/datasets/YOUR_NAME/robosnap-assets/resolve/main/gaussian");
  process.exit(2);
}

async function checkFile(file) {
  const url = `${base}/${file.name}`;
  const response = await fetch(url, {
    method: "HEAD",
    redirect: "follow",
    headers: {
      Origin: "https://robosnap.github.io"
    }
  });

  const length = Number(response.headers.get("content-length") || 0);
  const cors = response.headers.get("access-control-allow-origin") || "";
  const sizeOk = length === file.size;
  const corsOk = cors === "*" || cors === "https://robosnap.github.io";
  const ok = response.ok && sizeOk && corsOk;

  console.log(`${ok ? "OK" : "FAIL"} ${file.name}`);
  console.log(`  status: ${response.status}`);
  console.log(`  content-length: ${length || "missing"}${sizeOk ? "" : ` expected ${file.size}`}`);
  console.log(`  access-control-allow-origin: ${cors || "missing"}`);

  return ok;
}

async function main() {
  const results = [];
  for (const file of manifest.files) {
    try {
      results.push(await checkFile(file));
    } catch (error) {
      results.push(false);
      console.log(`FAIL ${file.name}`);
      console.log(`  ${error.message}`);
    }
  }

  if (results.some((ok) => !ok)) process.exit(1);
}

main();

