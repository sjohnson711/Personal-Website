import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { randomUUID } from "node:crypto";
import ArticleEditor from "../src/components/ArticleEditor";
import AnalyticsPage from "../src/pages/admin/AnalyticsPage";
import { parseArticle, sanitizeArticleHtml } from "../src/lib/parseArticle";
import { directImageUrl } from "../src/lib/imagePaste";
import { api } from "../src/lib/api";

jest.mock("../src/lib/api", () => ({ api: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));
const originalReader = window.FileReader;
class Reader {
  static all: Reader[] = [];
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readAsDataURL() { Reader.all.push(this); }
  abort() {}
  complete() { this.result = "data:image/png;base64,YQ=="; this.onload?.(); }
}
beforeEach(() => {
  jest.clearAllMocks(); Reader.all = [];
  Object.defineProperty(window.crypto, "randomUUID", { configurable: true, value: randomUUID });
  Object.defineProperty(window, "FileReader", { configurable: true, value: Reader });
});
afterAll(() => { Object.defineProperty(window, "FileReader", { configurable: true, value: originalReader }); });
function editor(content = "Before\n\nAfter") {
  render(<MemoryRouter><ArticleEditor mode="edit" initialData={{ id: 1, title: "Test", slug: "test", excerpt: "Excerpt", content, published: false }} /></MemoryRouter>);
  const area = screen.getByLabelText("Content") as HTMLTextAreaElement;
  area.focus(); return area;
}
function paste(area: HTMLTextAreaElement, type = "image/png", size = 1) {
  const file = new File([new Uint8Array(size)], "image", { type });
  fireEvent.paste(area, { clipboardData: { items: [{ kind: "file", type, getAsFile: () => file }], getData: () => "" } });
}
test.each([0, 6, 13])("image stays at cursor offset %i and saves in place", async (position) => {
  const area = editor(); area.setSelectionRange(position, position);
  paste(area); expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
  act(() => Reader.all[0].complete());
  const expected = "Before\n\nAfter".slice(0, position) + "\n\n![](data:image/png;base64,YQ==)\n\n" + "Before\n\nAfter".slice(position);
  expect(area.value).toBe(expected);
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith("/articles/1", expect.objectContaining({ content: expected })));
});
test("an asynchronous paste follows edits before its anchor instead of jumping to an old offset", () => {
  const area = editor(); area.setSelectionRange(6, 6); paste(area);
  fireEvent.change(area, { target: { value: "New introduction\n" + area.value } });
  act(() => Reader.all[0].complete());
  expect(area.value).toMatch(/^New introduction\nBefore\n\n!\[\]\(data:image\/png/);
  expect(area.value).toContain("After");
});
test("failed image processing restores selected text", () => {
  const area = editor(); area.setSelectionRange(0, 6); paste(area);
  act(() => Reader.all[0].onerror?.());
  expect(area.value).toBe("Before\n\nAfter");
  expect(screen.getByRole("alert")).toHaveTextContent("could not be read");
});
test("multiple image reads may complete out of order without reordering the article", () => {
  const area = editor(); area.setSelectionRange(0, 0); paste(area);
  area.setSelectionRange(area.value.length, area.value.length); paste(area);
  act(() => Reader.all[1].complete()); act(() => Reader.all[0].complete());
  expect(area.value).toBe("\n\n![](data:image/png;base64,YQ==)\n\nBefore\n\nAfter\n\n![](data:image/png;base64,YQ==)\n\n");
});
test.each([["image/svg+xml", 1], ["image/png", 2 * 1024 * 1024 + 1]])("rejects unsupported/oversized image %s", (type, size) => {
  const area = editor(); paste(area, type as string, size as number);
  expect(area.value).toBe("Before\n\nAfter"); expect(screen.getByRole("alert")).toBeInTheDocument(); expect(Reader.all).toHaveLength(0);
});
test("direct HTTPS image URLs replace the selected text, ordinary links are untouched", () => {
  const area = editor(); area.setSelectionRange(0, 6);
  fireEvent.paste(area, { clipboardData: { items: [], getData: () => "https://example.com/photo.png?size=2" } });
  expect(area.value).toContain("![](<https://example.com/photo.png?size=2>)");
  expect(directImageUrl("https://example.com/article")).toBeNull();
  expect(directImageUrl("http://example.com/photo.png")).toBeNull();
  expect(directImageUrl("https://example.com/unsafe.svg")).toBeNull();
});
test("a reopened article renders its text and image in the saved order", () => {
  const segments = parseArticle("Before\n\n![](data:image/png;base64,YQ==)\n\nAfter");
  const html = segments.filter((s) => s.kind === "html").map((s) => s.html).join("");
  expect(html.indexOf("Before")).toBeLessThan(html.indexOf("<img"));
  expect(html.indexOf("<img")).toBeLessThan(html.indexOf("After"));
});
test("sanitization blocks script/event handlers, unsafe links, SVG and iframe injection", () => {
  const html = sanitizeArticleHtml('<script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">bad</a><img src="data:image/svg+xml;base64,PHN2Zz4="><iframe src="https://evil.example"></iframe><form><input name="cookie"></form>');
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
