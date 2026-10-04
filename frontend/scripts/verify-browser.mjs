import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const base = "http://127.0.0.1:5174";
const output = resolve("node_modules/.cache/local-review/screenshots");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
let restore = null;
page.on("pageerror", (error) => errors.push(error.message));
const png = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 8; canvas.height = 8; const context = canvas.getContext("2d"); context.fillStyle = "#7a5c10"; context.fillRect(0, 0, 8, 8); return canvas.toDataURL("image/png").split(",")[1]; });
await page.route("https://images.example.test/photo.png", (route) => route.fulfill({ contentType: "image/png", body: Buffer.from(png, "base64") }));
try {
  await page.goto(base + "/admin/analytics"); await page.waitForURL("**/gateway");
  await page.getByLabel("Email", { exact: true }).fill("review@letterofforgiveness.test");
  await page.getByLabel("Password", { exact: true }).fill("ReviewLocalOnly!2026");
  await page.getByRole("button", { name: "Sign In", exact: true }).click(); await page.waitForURL("**/admin/dashboard");
  await page.getByRole("link", { name: "Site Analytics" }).click();
  await page.getByRole("heading", { name: "Recent interactions" }).waitFor();
  await page.screenshot({ path: resolve(output, "analytics-desktop.png"), fullPage: true });
  await page.getByRole("combobox").selectOption("7");
  await page.waitForFunction(() => document.querySelectorAll(".traffic-chart > div").length === 7);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const days of [7, 30, 90]) {
    await page.getByRole("combobox").selectOption(String(days));
    await page.waitForFunction((days) => document.querySelectorAll(".traffic-chart > div").length === days, days);
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  }
  await page.screenshot({ path: resolve(output, "analytics-mobile.png") });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Mobile analytics must not overflow");
  await page.getByRole("heading", { name: "Recent interactions" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(output, "activity-mobile.png") });
  const article = await page.evaluate(async () => (await (await fetch("/api/articles?admin=true")).json()).articles.find((a) => a.slug === "local-image-test"));
  await page.goto(`${base}/admin/articles/${article.id}/edit`);
  const area = page.getByLabel("Content", { exact: true });
  await area.waitFor(); await area.focus();
  const original = article.content;
  const token = (await page.context().cookies()).find((c) => c.name === "token")?.value;
  restore = { article, token, content: original };
  await area.evaluate((element) => {
    const after = Array.from(element.children).find((node) => node.textContent.includes("After the image"));
    const range = document.createRange(); range.selectNodeContents(after); range.collapse(true);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
  await page.waitForTimeout(60);
  await area.evaluate((element, { png }) => {
    const bytes = Uint8Array.from(atob(png), (c) => c.charCodeAt(0));
    const data = new DataTransfer(); data.items.add(new File([bytes], "test.png", { type: "image/png" }));
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
  }, { png });
  await page.waitForFunction(() => document.querySelector("#article-content img[src^='data:image/png']")?.naturalWidth > 0);
  const pasted = await area.innerHTML();
  assert.ok(pasted.includes(`data:image/png;base64,${png}`));
  assert.ok(pasted.indexOf(`<img`) < pasted.indexOf("After the image"));
  await area.evaluate((element) => {
    const range = document.createRange(); range.selectNodeContents(element); range.collapse(false);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
  await page.waitForTimeout(60);
  await area.evaluate((element) => {
    const data = new DataTransfer(); data.setData("text/plain", "https://images.example.test/photo.png");
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
  });
  assert.ok((await area.innerHTML()).includes("https://images.example.test/photo.png"));
  const imageCount = await area.locator("img[src]").count();
  await page.getByRole("button", { name: "Save Changes", exact: true }).click(); await page.waitForURL("**/admin/dashboard");
  await page.goto(`${base}/admin/articles/${article.id}/edit`); await area.waitFor(); assert.equal(await area.locator("img[src]").count(), imageCount);
  await page.goto(base + "/articles/local-image-test"); await page.locator(".prose-ink img").first().waitFor();
  assert.equal(await page.locator(".prose-ink img").count(), imageCount);
  for (const img of await page.locator(".prose-ink img").all()) await img.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => Array.from(document.querySelectorAll(".prose-ink img")).every((img) => img.complete && img.naturalWidth > 0));
  await page.screenshot({ path: resolve(output, "article-mobile.png"), fullPage: true });
  await page.evaluate(async () => { await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "PersonalWebsite" }, body: "{}" }); });
  await page.goto(base + "/");
  const subscriber = `browser-review-${Date.now()}@example.com`;
  const form = page.getByRole("form", { name: "Stay in the Loop" });
  await form.getByRole("textbox").fill(subscriber);
  await form.getByRole("button").click();
  await page.getByText("Your subscription is registered. Thank you!").waitFor();
  const deadline = Date.now() + 30000;
  let captured = false;
  while (Date.now() < deadline) {
    const mailbox = await page.request.get(base + "/__review/mailbox");
    if ((await mailbox.text()).includes(subscriber)) { captured = true; break; }
    await page.waitForTimeout(500);
  }
  assert.ok(captured, "The signup alert must be captured within 30 seconds");
  await page.goto(base + "/__review/mailbox"); await page.getByText(subscriber, { exact: true }).waitFor();
  await page.screenshot({ path: resolve(output, "captured-signup-alert.png"), fullPage: true });
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log("PASS browser login/protected routes, analytics filters, mobile layout, image paste/save/reopen/render, signup, and captured alert.");
  console.log(`Screenshots: ${output}`);
} catch (error) {
  console.error("Browser failure URL:", page.url());
  console.error("Browser body:", (await page.locator("body").innerText()).slice(0, 1800));
  await page.screenshot({ path: resolve(output, "browser-failure.png"), fullPage: true });
  throw error;
} finally {
  if (restore) {
    const { article, token, content } = restore;
    const result = await fetch(`http://127.0.0.1:3002/api/articles/${article.id}`, { method: "PUT", headers: { Origin: base, "Content-Type": "application/json", "X-Requested-With": "PersonalWebsite", Cookie: `token=${token}` },
      body: JSON.stringify({ title: article.title, slug: article.slug, excerpt: article.excerpt, content, published: article.published }) });
    assert.equal(result.status, 200, "Restore the review article after the browser test");
  }
  await browser.close();
}
