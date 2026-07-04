import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "index.html",
  "assets/styles.css",
  "assets/app.js",
  "assets/meridian-logo.svg",
  "design-tokens.json",
  "schemas/design-tokens.schema.json"
];

const requiredTokenPaths = [
  "color.primitive.brand.500",
  "color.primitive.neutral.900",
  "color.semantic.background.default",
  "color.semantic.action.primary.background.default",
  "color.semantic.focus.ring",
  "dimension.space.4",
  "radius.md",
  "typography.component.heading.display",
  "component.button.primary.background.default",
  "component.button.primary.focusRing",
  "component.input.border.error",
  "component.card.background",
  "component.modal.shadow",
  "breakpoint.lg",
  "zIndex.modal",
  "duration.base",
  "easing.standard"
];

const requiredAnchors = [
  "overview"
];

const requiredSections = [
  "tokens",
  "brand-inheritance",
  "atoms",
  "molecules",
  "components",
  "layouts",
  "motion-z",
  "handoff"
];

const requiredComponents = [
  "site-nav",
  "subnav",
  "system-snapshot",
  "token-layer",
  "token-mode-table",
  "brand-section-map",
  "color-scale",
  "type-scale",
  "spacing-scale",
  "radius-elevation",
  "button-group",
  "field",
  "tabs",
  "alert",
  "card",
  "table",
  "modal",
  "layout-dashboard",
  "layout-editorial",
  "layout-form",
  "motion-scale",
  "z-index-scale",
  "state-matrix",
  "export-contract",
  "figma-contract",
  "openpencil-contract"
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function getByPath(obj, tokenPath) {
  return tokenPath.split(".").reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}

function isObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function collectTokens(node, prefix = [], out = new Map()) {
  if (!isObject(node)) return out;
  if (Object.prototype.hasOwnProperty.call(node, "$value")) {
    out.set(prefix.join("."), node);
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    collectTokens(value, [...prefix, key], out);
  }
  return out;
}

function collectAliases(value, out = []) {
  if (typeof value === "string") {
    const matches = value.matchAll(/\{([^}]+)\}/g);
    for (const match of matches) out.push(match[1]);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectAliases(item, out));
  } else if (isObject(value)) {
    Object.values(value).forEach((item) => collectAliases(item, out));
  }
  return out;
}

for (const file of requiredFiles) {
  if (!existsSync(path.join(root, file))) fail(`Missing required file: ${file}`);
}

let tokens;
let html;
let schema;

try {
  tokens = JSON.parse(await readFile(path.join(root, "design-tokens.json"), "utf8"));
} catch (error) {
  fail(`Invalid design-tokens.json: ${error.message}`);
}

try {
  schema = JSON.parse(await readFile(path.join(root, "schemas/design-tokens.schema.json"), "utf8"));
} catch (error) {
  fail(`Invalid schemas/design-tokens.schema.json: ${error.message}`);
}

html = await readFile(path.join(root, "index.html"), "utf8");

if (!tokens?.$extensions?.figma?.variableCollections?.length) {
  fail("Missing $extensions.figma.variableCollections");
}

if (!tokens?.$extensions?.openPencil?.componentManifest?.length) {
  fail("Missing $extensions.openPencil.componentManifest");
}

if (!schema?.properties?.$extensions?.properties?.openPencil) {
  fail("Local schema does not describe OpenPencil metadata");
}

const tokenMap = collectTokens(tokens);
for (const [tokenPath, token] of tokenMap.entries()) {
  if (!token.$type) fail(`Token ${tokenPath} is missing $type`);
  if (token.$value == null) fail(`Token ${tokenPath} is missing $value`);
}

for (const tokenPath of requiredTokenPaths) {
  const token = getByPath(tokens, tokenPath);
  if (!token || !Object.prototype.hasOwnProperty.call(token, "$value")) {
    fail(`Missing required token: ${tokenPath}`);
  }
}

for (const [tokenPath, token] of tokenMap.entries()) {
  for (const alias of collectAliases(token.$value)) {
    const target = getByPath(tokens, alias);
    if (!target || !Object.prototype.hasOwnProperty.call(target, "$value")) {
      fail(`Broken alias in ${tokenPath}: ${alias}`);
    }
  }
}

for (const id of [...requiredAnchors, ...requiredSections]) {
  if (!html.includes(`id="${id}"`)) fail(`Missing documentation section: #${id}`);
}

for (const component of requiredComponents) {
  if (!html.includes(`data-component="${component}"`)) {
    fail(`Missing data-component example: ${component}`);
  }
}

for (const attr of ["aria-label", "aria-labelledby", "aria-describedby", "role=\"dialog\"", "role=\"tablist\"", "aria-invalid"]) {
  if (!html.includes(attr)) fail(`Missing semantic accessibility marker: ${attr}`);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(`Validated ${tokenMap.size} tokens, ${requiredSections.length} sections, ${requiredComponents.length} component examples.`);
