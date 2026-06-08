// Run: node apply-model-config.js
// From inside your cloned pathfinder repo directory.
// If not cloned yet: git clone https://github.com/IshanEdlabadkar/pathfinder.git && cd pathfinder

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CONFIG_IMPORT = `import { DEFAULT_MODEL } from "@/lib/models";`;

// --- Step 0: Scan the codebase to discover the model string(s) ---

function findFiles(dir, exts) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") {
      results = results.concat(findFiles(full, exts));
    } else if (entry.isFile() && exts.some((e) => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

// Patterns that indicate a hardcoded model string:
//   const MODEL = "some/model-name";
//   model: "some/model-name",
const MODEL_CONST_RE = /const\s+MODEL\s*=\s*"([^"]+)"/g;
const MODEL_INLINE_RE = /model:\s*"([^"]+)"/g;

const allFiles = findFiles("src", [".ts", ".tsx"]);
const discoveredModels = new Set();

for (const file of allFiles) {
  const content = fs.readFileSync(file, "utf-8");
  for (const re of [MODEL_CONST_RE, MODEL_INLINE_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      // Skip things that are clearly not model identifiers
      // (e.g. "application/json", URLs, file paths)
      const val = m[1];
      if (val.includes("://") || val.includes(".json") || val.startsWith("@")) continue;
      // Model IDs on OpenRouter look like "provider/model-name" or "provider/model:tag"
      if (val.includes("/")) {
        discoveredModels.add(val);
      }
    }
  }
}

if (discoveredModels.size === 0) {
  console.log("No hardcoded model strings found. Already patched?");
  process.exit(0);
}

console.log("Discovered model strings:");
for (const m of discoveredModels) {
  console.log(`  "${m}"`);
}

// Pick the first one as the canonical value for the config file.
// (If there are multiple, they'll all be replaced with DEFAULT_MODEL anyway.)
const canonicalModel = [...discoveredModels][0];

// --- Step 1: Create src/lib/models.ts ---

const configFile = path.join("src", "lib", "models.ts");
const modelsContent = `// src/lib/models.ts
// Central model configuration — change the model here to update it everywhere.

export const DEFAULT_MODEL = "${canonicalModel}";
`;
fs.writeFileSync(configFile, modelsContent);
console.log(`\nCreated ${configFile} with DEFAULT_MODEL = "${canonicalModel}"\n`);

// --- Step 2: Patch every file ---

let patchedFiles = [];

for (const file of allFiles) {
  if (path.resolve(file) === path.resolve(configFile)) continue;

  let content = fs.readFileSync(file, "utf-8");
  const original = content;

  // Check if this file has any model string we need to replace
  let hasMatch = false;
  for (const model of discoveredModels) {
    if (content.includes(model)) { hasMatch = true; break; }
  }
  if (!hasMatch) continue;

  // Replace `const MODEL = "any/model";` — remove the line
  content = content.replace(/const\s+MODEL\s*=\s*"[^"]+";\n?/g, "");

  // Replace inline `model: "any/model-string",` with `model: DEFAULT_MODEL,`
  for (const model of discoveredModels) {
    const escaped = model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    content = content.replace(
      new RegExp(`model:\\s*"${escaped}"`, "g"),
      "model: DEFAULT_MODEL"
    );
  }

  // Replace `model: MODEL,` (the old local constant) with `model: DEFAULT_MODEL,`
  content = content.replace(/model:\s*MODEL\b/g, "model: DEFAULT_MODEL");

  // Add the import if DEFAULT_MODEL is now used but not imported
  if (content.includes("DEFAULT_MODEL") && !content.includes("@/lib/models")) {
    const lines = content.split("\n");
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) lastImportIdx = i;
    }
    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, CONFIG_IMPORT);
    } else {
      lines.unshift(CONFIG_IMPORT);
    }
    content = lines.join("\n");
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    patchedFiles.push(file);
    console.log(`Patched: ${file}`);
  }
}

if (patchedFiles.length === 0) {
  console.log("No files needed patching.");
  process.exit(0);
}

// --- Step 3: Verify ---

console.log("\nVerifying no remaining hardcoded model references...");
let leaks = [];
for (const file of findFiles("src", [".ts", ".tsx"])) {
  if (path.resolve(file) === path.resolve(configFile)) continue;
  const content = fs.readFileSync(file, "utf-8");
  for (const model of discoveredModels) {
    if (content.includes(`"${model}"`)) {
      leaks.push({ file, model });
    }
  }
}
if (leaks.length > 0) {
  console.error("WARNING: These files still have hardcoded model strings:");
  for (const { file, model } of leaks) console.error(`  ${file} → "${model}"`);
} else {
  console.log("All clean.\n");
}

// --- Step 4: Commit and push ---

console.log("Committing...");
execSync("git add -A", { stdio: "inherit" });

const commitMsg = [
  "refactor: centralize model config into src/lib/models.ts",
  "",
  "Extract all hardcoded model references into a single DEFAULT_MODEL",
  "export in src/lib/models.ts. To change the model everywhere, edit",
  "that one file.",
  "",
  "Updated files:",
  ...patchedFiles.map((f) => `- ${f.replace(/\\/g, "/")}`),
].join("\n");

execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
execSync("git push origin main", { stdio: "inherit" });

console.log("\nDone! To change the model everywhere, edit DEFAULT_MODEL in src/lib/models.ts");
