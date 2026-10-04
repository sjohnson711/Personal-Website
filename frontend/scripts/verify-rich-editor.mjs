import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const base = process.env.EDITOR_REVIEW_URL || "http://127.0.0.1:5175";
const output = resolve("node_modules/.cache/rich-editor-review");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.EDITOR_REVIEW_BROWSER || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => {
  window.editorCspErrors = [];
  document.addEventListener("securitypolicyviolation", (event) => window.editorCspErrors.push(event.violatedDirective));
});
let article = { id: 1, title: "A moment of forgiveness", slug: "editor-review", excerpt: "Making room for a new beginning.", content: "## A new beginning\n\nBefore the image\n\nAfter the image\n\n| Field | Note |\n| --- | --- |\n| Grace | A fresh start |\n\nhttps://www.youtube.com/watch?v=abc123", published: true, createdAt: "2026-10-04T00:00:00Z" };
// Every API request uses an in-memory fixture; tests never change live content.
await page.route("**/api/**", async (route) => {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  let body = {};
  if (path.endsWith("/auth/me")) body = { email: "editor-review@example.test" };
  else if (path.endsWith("/articles/1") && request.method() === "PUT") { article = { ...article, ...request.postDataJSON() }; body = article; }
  else if (path.endsWith("/articles/1") || path.endsWith("/articles/editor-review")) body = article;
  else if (path.endsWith("/articles")) body = { articles: [article], total: 1, page: 1, totalPages: 1 };
  else if (path.includes("/comments")) body = [];
  await route.fulfill({ json: body });
});
const area = page.getByRole("textbox", { name: "Content", exact: true });
async function selectText(text, offset = 0, length = 0) {
  await area.focus();
  await area.evaluate((element, { text, offset, length }) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const start = node.textContent.indexOf(text);
      if (start < 0) continue;
      const range = document.createRange(); range.setStart(node, start + offset); range.setEnd(node, start + offset + length);
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
      document.dispatchEvent(new Event("selectionchange")); return;
    }
    throw new Error(`Cannot find text: ${text}`);
  }, { text, offset, length });
  await page.waitForTimeout(60);
}
async function pasteFile(png, type = "image/png", size = null) {
  await area.evaluate((element, { png, type, size }) => {
    const bytes = size ? new Uint8Array(size) : Uint8Array.from(atob(png), (c) => c.charCodeAt(0));
    const data = new DataTransfer(); data.items.add(new File([bytes], "pasted-image", { type }));
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
  }, { png, type, size });
}
try {
  await page.goto(base + "/admin/articles/1/edit"); await area.waitFor();
  assert.equal(await area.locator("h3").innerText(), "A new beginning", "Markdown headings convert to editable headings");
  assert.ok(!(await area.innerText()).includes("##"));
  assert.ok((await area.locator("table").innerText()).includes("A fresh start"), "Legacy tables remain editable");
  await selectText("Before the image", 0, 6);
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  await page.getByLabel("Text color", { exact: true }).fill("#b91c1c");
  await page.getByLabel("Font size", { exact: true }).selectOption("20px");
  assert.equal(await area.locator("strong").innerText(), "Before");
  assert.ok((await area.locator("table").innerText()).includes("A fresh start"), "Table content survives saving");
  assert.equal(await area.locator("span[style*='color']").first().evaluate((e) => getComputedStyle(e).color), "rgb(185, 28, 28)");
  await page.getByRole("button", { name: "Align center", exact: true }).click();
  assert.equal(await area.locator("p").first().evaluate((e) => getComputedStyle(e).textAlign), "center");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.notEqual(await area.locator("p").first().evaluate((e) => getComputedStyle(e).textAlign), "center");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await selectText("After the image");
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 320; canvas.height = 160;
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "#256342"; ctx.fillRect(0, 0, 320, 160);
    ctx.fillStyle = "white"; ctx.font = "24px sans-serif"; ctx.fillText("A new beginning", 36, 86);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await pasteFile(png);
  await area.locator("img[src]").waitFor();
  await page.waitForFunction(() => document.querySelector("#article-content img[src]").naturalWidth === 320);
  const order = await area.innerHTML();
  assert.ok(order.indexOf("Before") < order.indexOf("<img") && order.indexOf("<img") < order.indexOf("After"), "Image remains between the paragraphs");
  await area.locator("img[src]").click();
  await page.getByLabel("Image size", { exact: true }).selectOption("50%");
  await page.getByRole("group", { name: "Selected image" }).getByLabel("Alternative text", { exact: true }).fill("A green card reading A new beginning");
  assert.equal(await area.locator("img[src]").getAttribute("width"), "50%");
  await area.scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(output, "editor-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "Save Changes", exact: true }).click(); await page.waitForURL("**/admin/dashboard");
  const saved = JSON.parse(article.content);
  assert.equal(saved.format, "richtext-v1"); assert.ok(saved.html.includes("rgb(185, 28, 28)"));
  assert.ok(saved.html.includes('width="50%"')); assert.ok(saved.html.includes('alt="A green card'));
  await page.goto(base + "/admin/articles/1/edit"); await area.waitFor();
  assert.equal(await area.locator("img[src]").getAttribute("width"), "50%");
  assert.equal(await area.locator("strong").innerText(), "Before");
  // Delay reads to exercise edits around a pending image and reader failures.
  await page.evaluate(() => {
    window.reviewReaders = [];
    window.FileReader = class {
      readAsDataURL() { window.reviewReaders.push(this); }
      abort() {}
    };
  });
  await selectText("After the image"); await pasteFile(png);
  assert.equal(await page.getByRole("button", { name: "Save Changes", exact: true }).isDisabled(), true);
  await selectText("After the image", 15); await page.keyboard.type(" while the image loads");
  await page.evaluate((png) => { const reader = window.reviewReaders[0]; reader.result = `data:image/png;base64,${png}`; reader.onload(); }, png);
  assert.equal(await area.locator("img[src]").count(), 2);
  assert.ok((await area.innerText()).includes("while the image loads"));
  const current = await area.innerHTML();
  assert.ok(current.lastIndexOf("<img") < current.indexOf("After"), "Pending image tracks edits around its anchor");
  await selectText("After the image", 0, 5); await pasteFile(png);
  await page.evaluate(() => window.reviewReaders[1].onerror());
  assert.ok((await area.innerText()).includes("After the image"), "Read failure restores selected text");
  assert.equal(await area.locator("img[src]").count(), 2);
  await page.getByRole("alert").filter({ hasText: "could not be read" }).waitFor();
  // Reopen the saved fixture before checking the remaining reader behavior.
  await page.goto(base + "/admin/articles/1/edit"); await area.waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await area.scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Mobile editor does not overflow");
  await page.screenshot({ path: resolve(output, "editor-mobile.png"), fullPage: true });
  await selectText("After the image");
  const imageCount = await area.locator("img[src]").count();
  await pasteFile(png, "image/svg+xml"); assert.equal(await area.locator("img[src]").count(), imageCount);
  await page.getByRole("alert").waitFor();
  await pasteFile(png, "image/png", 10 * 1024 * 1024 + 1); assert.equal(await area.locator("img[src]").count(), imageCount);
  await page.getByRole("alert").filter({ hasText: "exceeds 10 MB" }).waitFor();
  // HTML paste keeps safe formatting while dropping executable content.
  await area.evaluate((element) => {
    const data = new DataTransfer(); data.setData("text/html", '<p><span style="color: #256342">Pasted formatted text</span><img src="data:image/svg+xml;base64,PHN2Zz4=" onerror="window.injected=true"><script>window.injected=true</script></p>');
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
  });
  await page.getByText("Pasted formatted text", { exact: true }).waitFor();
  assert.ok(!(await area.innerHTML()).includes("onerror")); assert.equal(await page.evaluate(() => window.injected), undefined);
  // A valid PNG padded to 7 MB exercises both the former image and article caps.
  await selectText("After the image", 15);
  await area.evaluate((element, png) => {
    const original = Uint8Array.from(atob(png), (c) => c.charCodeAt(0));
    const bytes = new Uint8Array(7 * 1024 * 1024); bytes.set(original);
    const data = new DataTransfer(); data.items.add(new File([bytes], "large.png", { type: "image/png" }));
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
  }, png);
  await page.waitForFunction(() => document.querySelectorAll("#article-content img[src]").length === 2 && document.querySelectorAll("#article-content img[src]")[1].naturalWidth === 320);
  await page.getByRole("button", { name: "Save Changes", exact: true }).click(); await page.waitForURL("**/admin/dashboard");
  assert.ok(Buffer.byteLength(article.content) > 8 * 1024 * 1024, "Article saves above the former 8 MB cap");
  await page.goto(base + "/admin/articles/1/edit"); await area.waitFor();
  assert.equal(await area.locator("img[src]").count(), 2, "Large image reopens after saving");
  await page.goto(base + "/articles/editor-review");
  await page.locator(".prose-ink img[src^='data:image/png']").first().waitFor();
  assert.equal(await page.locator(".prose-ink span[style*='color']").first().evaluate((e) => getComputedStyle(e).color), "rgb(185, 28, 28)");
  assert.equal(await page.locator(".prose-ink img[src^='data:image/png']").first().getAttribute("alt"), "A green card reading A new beginning");
  assert.equal(await page.locator(".prose-ink img[src^='data:image/png']").count(), 2);
  await page.screenshot({ path: resolve(output, "reader-mobile.png"), fullPage: true });
  assert.deepEqual(errors, []);
  assert.deepEqual(await page.evaluate(() => window.editorCspErrors), [], "No editor CSP violations");
  console.log("PASS legacy conversion, formatting, undo/redo, image paste/resize/alt, 7 MB image save/reopen/render, mobile layout, 10 MB rejection and sanitized HTML paste.");
  console.log(`Screenshots: ${output}`);
} catch (error) {
  await page.screenshot({ path: resolve(output, "failure.png"), fullPage: true });
  console.error("URL:", page.url()); console.error((await page.locator("body").innerText()).slice(-2000)); throw error;
} finally { await browser.close(); }
