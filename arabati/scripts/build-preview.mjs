// Turn the production bundle into a portable preview with no runtime imports.
import fs from "node:fs/promises";
import path from "node:path";
const root = process.cwd(),
  dist = path.join(root, "dist");
let html = await fs.readFile(path.join(dist, "index.html"), "utf8");
const script = html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/);
const stylesheet = html.match(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/);
if (!script || !stylesheet)
  throw new Error("Expected one production JS bundle and stylesheet.");
let js = await fs.readFile(path.join(dist, script[1]), "utf8");
let css = await fs.readFile(path.join(dist, stylesheet[1]), "utf8");
const urls = [...css.matchAll(/url\((?:"|')?([^)'"\s]+)(?:"|')?\)/g)];
for (const match of urls) {
  if (
    match[1].startsWith("data:") ||
    match[1].startsWith("http") ||
    match[1].startsWith("#")
  )
    continue;
  const asset = path.resolve(dist, path.dirname(stylesheet[1]), match[1]);
  const bytes = await fs.readFile(asset);
  const ext = path.extname(asset).slice(1);
  const mime = ext === "svg" ? "image/svg+xml" : `image/${ext}`;
  css = css.replaceAll(
    match[0],
    `url("data:${mime};base64,${bytes.toString("base64")}")`,
  );
}
js = js
  .replace(/\/\/# sourceMappingURL=.*$/m, "")
  .replaceAll("</script", "<\\/script");
html = html
  .replace(script[0], () => `<script type="module">${js}</script>`)
  .replace(stylesheet[0], () => `<style>${css}</style>`);
const favicon = await fs.readFile(path.join(root, "public/favicon.svg"));
html = html.replace(
  /href="\.?\/favicon\.svg"/,
  `href="data:image/svg+xml;base64,${favicon.toString("base64")}"`,
);
await fs.mkdir(path.join(root, "preview"), { recursive: true });
await fs.writeFile(path.join(root, "preview/Arabati_Preview.html"), html);
await fs.writeFile(path.join(dist, "preview.html"), html);
console.log("Portable preview created: preview/Arabati_Preview.html");
