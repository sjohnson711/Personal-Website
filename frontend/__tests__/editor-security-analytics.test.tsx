import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AnalyticsPage from "../src/pages/admin/AnalyticsPage";
import { articleEditorHtml, parseArticle, sanitizeArticleHtml, serializeRichText } from "../src/lib/parseArticle";
import { directImageUrl } from "../src/lib/imagePaste";
import { api } from "../src/lib/api";

jest.mock("../src/lib/api", () => ({ api: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));

test("legacy Markdown opens with formatted headings, links and inline images", () => {
  const markdown = "## Heading\n\n**Before**\n\n![Description](data:image/png;base64,YQ==)\n\nAfter\n\nhttps://example.com/video";
  const html = articleEditorHtml(markdown);
  expect(html).toContain("<h3>Heading</h3>");
  expect(html).toContain("<strong>Before</strong>");
  expect(html.indexOf("Before")).toBeLessThan(html.indexOf("<img"));
  expect(html.indexOf("<img")).toBeLessThan(html.indexOf("After"));
  expect(html).toContain('alt="Description"');
  expect(html).toContain("https://example.com/video");
});

test("saved rich text reopens with color, size, alignment, image size and alt text", () => {
  const html = '<h2>Heading</h2><p style="text-align: center"><strong><span style="color: #b91c1c; font-size: 20px">Before</span></strong></p><img src="data:image/png;base64,YQ==" width="50%" alt="Description"><p>After</p>';
  const saved = serializeRichText(html);
  expect(JSON.parse(saved).format).toBe("richtext-v1");
  const reopened = articleEditorHtml(saved);
  expect(reopened).toContain("rgb(185, 28, 28)");
  expect(reopened).toContain("font-size: 20px");
  expect(reopened).toContain("text-align: center");
  expect(reopened).toContain('width="50%"');
  expect(reopened).toContain('alt="Description"');
  expect(parseArticle(saved)).toEqual([{ kind: "html", html: reopened }]);
});

test("rich text retains bare URL embeds between formatted paragraphs", () => {
  const saved = serializeRichText('<p>Before</p><p><a href="https://example.com/video">https://example.com/video</a></p><p>After</p>');
  expect(parseArticle(saved)).toEqual([
    { kind: "html", html: "<p>Before</p>" },
    { kind: "embed", url: "https://example.com/video" },
    { kind: "html", html: "<p>After</p>" },
  ]);
  expect(parseArticle(serializeRichText('<p><a href="https://example.com/video">Watch video</a></p>'))[0].kind).toBe("html");
});

test("rich text sanitization drops CSS overlays and executable content while keeping editor formatting", () => {
  const html = sanitizeArticleHtml('<p style="text-align:right;position:fixed;inset:0;background:url(https://evil.test)"><span style="color:#256342;font-size:20px;display:none">Safe</span></p><img src="https://example.com/photo.png" width="50000" height="9999" onerror="alert(1)" data-paste-id="bad"><script>alert(1)</script><iframe src="https://evil.test"></iframe>', true);
  expect(html).toContain("text-align: right");
  expect(html).toContain("rgb(37, 99, 66)");
  expect(html).toContain("font-size: 20px");
  expect(html).not.toMatch(/position|inset|background|display|onerror|data-paste|50000|9999|<script|<iframe/);
});

test("encoded text remains escaped when rendering a rich article", () => {
  const segments = parseArticle(serializeRichText('&lt;img src=x onerror=alert(1)&gt;<p>Text</p>'));
  const html = segments.filter((s) => s.kind === "html").map((s) => s.html).join("");
  expect(html).toContain("&lt;img");
  expect(html).not.toContain("<img");
});

test("ordinary JSON and malformed JSON article content remain legacy text", () => {
  expect(articleEditorHtml('{"title":"An article"}')).toContain("An article");
  expect(articleEditorHtml('{"format":"richtext-v1"')).toContain("richtext-v1");
});

test("direct image URLs require HTTPS raster images without credentials", () => {
  expect(directImageUrl("https://example.com/photo.png?size=2")).toBe("https://example.com/photo.png?size=2");
  for (const url of ["https://example.com/article", "http://example.com/photo.png", "https://example.com/unsafe.svg", "https://user:password@example.com/photo.png"]) expect(directImageUrl(url)).toBeNull();
});

test("legacy article rendering preserves text and image order", () => {
  const segments = parseArticle("Before\n\n![](data:image/png;base64,YQ==)\n\nAfter");
  const html = segments.filter((s) => s.kind === "html").map((s) => s.html).join("");
  expect(html.indexOf("Before")).toBeLessThan(html.indexOf("<img"));
  expect(html.indexOf("<img")).toBeLessThan(html.indexOf("After"));
});

test.each([false, true])("sanitization blocks scripts, unsafe URLs, SVG and iframe injection (rich=%s)", (rich) => {
  const html = sanitizeArticleHtml('<script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">bad</a><img src="data:image/svg+xml;base64,PHN2Zz4="><iframe src="https://evil.example"></iframe><form><input name="cookie"></form>', rich);
  expect(html).not.toMatch(/<script|onerror|javascript:|data:image\/svg|<iframe|<form|<input/);
  const markdown = parseArticle("[bad](javascript:alert(1))\n\n<script>alert(1)</script>\n\n![ok](https://example.com/photo.png)");
  const clean = markdown.filter((s) => s.kind === "html").map((s) => s.html).join("");
  expect(clean).not.toContain("javascript:"); expect(clean).not.toContain("<script"); expect(clean).toContain("https://example.com/photo.png");
});

test("analytics shows an accessible empty state and retries failures", async () => {
  const get = jest.mocked(api.get); get.mockRejectedValue(new Error("offline"));
  render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
  expect(await screen.findByRole("alert")).toHaveTextContent("couldn't load");
  get.mockImplementation(async (path) => path.includes("summary") ? { totals: { views: 0, subscriptions: 0, comments: 0, contacts: 0 }, daily: [], popularPages: [], sources: [], devices: [], trackingSince: null } : { items: [], total: 0, totalPages: 0 });
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("No interactions in this period.")).toBeInTheDocument();
  expect(screen.getByText("No active subscribers.")).toBeInTheDocument();
  expect(screen.getByRole("combobox")).toHaveValue("30");
});
