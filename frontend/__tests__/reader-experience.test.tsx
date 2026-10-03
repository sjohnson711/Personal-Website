import { useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import ArticlesPage from "../src/pages/ArticlesPage";
import ArticlePage from "../src/pages/ArticlePage";
import HomePage from "../src/pages/HomePage";
import ScrollReveal from "../src/components/ScrollReveal";
import ContactModal from "../src/components/ContactModal";
import Navbar from "../src/components/Navbar";
import { api } from "../src/lib/api";

jest.mock("../src/lib/api", () => ({ api: { get: jest.fn(), post: jest.fn() } }));
jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ email: null, logout: jest.fn() }),
}));
jest.mock("../src/components/CommentSection", () => () => null);

const get = jest.mocked(api.get);
const article = (title: string) => ({
  id: 1, title, slug: title.toLowerCase(), excerpt: "An article excerpt.",
  createdAt: "2026-10-01T12:00:00Z", published: true, content: "Article content.",
});

class Observer {
  static instances: Observer[] = [];
  targets = new Set<Element>();
  constructor(private callback: IntersectionObserverCallback) {
    Observer.instances.push(this);
  }
  observe = (element: Element) => { this.targets.add(element); };
  unobserve = (element: Element) => { this.targets.delete(element); };
  disconnect = () => { this.targets.clear(); };
  reveal() {
    this.callback(Array.from(this.targets, (target) => ({ target, isIntersecting: true } as IntersectionObserverEntry)), this as unknown as IntersectionObserver);
  }
}

beforeEach(() => {
  get.mockReset();
  Observer.instances = [];
  Object.defineProperty(window, "IntersectionObserver", { configurable: true, writable: true, value: Observer });
});
afterEach(() => { jest.restoreAllMocks(); });

test("reveals new cards when the next page has the same article count", async () => {
  get.mockResolvedValueOnce({ articles: [article("First")], total: 2, totalPages: 2 })
    .mockResolvedValueOnce({ articles: [article("Second")], total: 2, totalPages: 2 });
  render(<MemoryRouter initialEntries={["/articles"]}><ArticlesPage /></MemoryRouter>);
  const first = await screen.findByRole("heading", { name: "First" });
  act(() => { Observer.instances.forEach((observer) => observer.reveal()); });
  expect(first.closest(".reveal")).toHaveClass("visible");
  await userEvent.click(screen.getByRole("link", { name: "2" }));
  const second = await screen.findByRole("heading", { name: "Second" });
  act(() => { Observer.instances.forEach((observer) => observer.reveal()); });
  expect(second.closest(".reveal")).toHaveClass("visible");
  expect(second.closest(".reveal")).not.toHaveClass("reveal-pending");
});

test("shows a retry action for article-list failures rather than an empty collection", async () => {
  get.mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce({ articles: [article("Recovered")], total: 1, totalPages: 1 });
  render(<MemoryRouter><ArticlesPage /></MemoryRouter>);
  expect(await screen.findByRole("alert")).toHaveTextContent("couldn't load");
  expect(screen.queryByText(/No articles yet/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("heading", { name: "Recovered" })).toBeInTheDocument();
});

test("keeps the successful empty-collection message", async () => {
  get.mockResolvedValue({ articles: [], total: 0, totalPages: 1 });
  render(<MemoryRouter><ArticlesPage /></MemoryRouter>);
  expect(await screen.findByText(/No articles yet/)).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("ignores a slow response from an article page the reader has already left", async () => {
  let resolveFirst!: (value: unknown) => void;
  get.mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }))
    .mockResolvedValueOnce({ articles: [article("Current")], total: 2, totalPages: 2 });
  render(<MemoryRouter initialEntries={["/articles?page=1"]}><ReaderWithNavigation /></MemoryRouter>);
  await userEvent.click(screen.getByRole("button", { name: "Page two" }));
  expect(await screen.findByRole("heading", { name: "Current" })).toBeInTheDocument();
  await act(async () => { resolveFirst({ articles: [article("Stale")], total: 2, totalPages: 2 }); });
  expect(screen.queryByRole("heading", { name: "Stale" })).not.toBeInTheDocument();
});

function ReaderWithNavigation() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate("/articles?page=2")}>Page two</button><ArticlesPage /></>;
}

test("homepage failures can be retried and the newsletter has an accessible name", async () => {
  get.mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce({ articles: [article("Latest")] });
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(screen.getByRole("form", { name: "Stay in the Loop" })).toBeInTheDocument();
  expect(await screen.findByRole("alert")).toHaveTextContent("couldn't load");
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("heading", { level: 1, name: "Latest" })).toBeInTheDocument();
});

test.each([500, undefined])("article request failure %s has a retry rather than a not-found message", async (status) => {
  get.mockRejectedValueOnce(Object.assign(new Error("Unavailable"), { status })).mockResolvedValueOnce(article("Recovered"));
  render(<MemoryRouter initialEntries={["/articles/example"]}><Routes><Route path="/articles/:slug" element={<ArticlePage />} /></Routes></MemoryRouter>);
  expect(await screen.findByRole("alert")).toHaveTextContent("couldn't load this article");
  expect(screen.queryByRole("heading", { name: "Article Not Found" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("heading", { name: "Recovered" })).toBeInTheDocument();
});

test("a real 404 keeps the article-not-found experience", async () => {
  get.mockRejectedValue(Object.assign(new Error("Missing"), { status: 404 }));
  render(<MemoryRouter initialEntries={["/articles/missing"]}><Routes><Route path="/articles/:slug" element={<ArticlePage />} /></Routes></MemoryRouter>);
  expect(await screen.findByRole("heading", { name: "Article Not Found" })).toBeInTheDocument();
});

test("article cards stay visible when IntersectionObserver is unavailable", () => {
  Object.defineProperty(window, "IntersectionObserver", { configurable: true, value: undefined });
  render(<ScrollReveal><p>Readable content</p></ScrollReveal>);
  expect(screen.getByText("Readable content").parentElement).not.toHaveClass("reveal-pending");
});

test("reduced-motion users get immediately visible content", () => {
  jest.spyOn(window, "matchMedia").mockImplementation((query) => ({ matches: query.includes("prefers-reduced-motion"), media: query, addEventListener: jest.fn(), removeEventListener: jest.fn() } as unknown as MediaQueryList));
  render(<ScrollReveal><p>Readable content</p></ScrollReveal>);
  expect(screen.getByText("Readable content").parentElement).not.toHaveClass("reveal-pending");
  expect(Observer.instances).toHaveLength(0);
});

test("contact dialog contains keyboard focus, blocks background interaction, and restores focus on Escape", async () => {
  function ContactExample() {
    const [open, setOpen] = useState(false);
    return <><button onClick={() => setOpen(true)}>Email</button><ContactModal isOpen={open} onClose={() => setOpen(false)} /></>;
  }
  const { container } = render(<ContactExample />);
  const trigger = screen.getByRole("button", { name: "Email" });
  await userEvent.click(trigger);
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
  expect(container.inert).toBe(true);
  screen.getByRole("button", { name: "Send Message" }).focus();
  await userEvent.tab();
  expect(screen.getByRole("button", { name: "Close contact form" })).toHaveFocus();
  await userEvent.tab({ shift: true });
  expect(screen.getByRole("button", { name: "Send Message" })).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(container.inert).toBeFalsy();
});

test("closed mobile-menu links are hidden and inert, and Escape returns focus to its button", async () => {
  jest.spyOn(window, "matchMedia").mockImplementation((query) => ({ matches: query.includes("max-width"), media: query, addEventListener: jest.fn(), removeEventListener: jest.fn() } as unknown as MediaQueryList));
  const { container } = render(<MemoryRouter><Navbar /></MemoryRouter>);
  const panel = container.querySelector("#mobile-nav-panel");
  expect(panel).toHaveAttribute("inert");
  expect(screen.queryByRole("link", { name: "Articles" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
  expect(panel).not.toHaveAttribute("inert");
  const link = screen.getByRole("link", { name: "Articles" });
  link.focus();
  fireEvent.keyDown(link, { key: "Escape" });
  await waitFor(() => expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus());
  expect(panel).toHaveAttribute("inert");
});

test("a parent rerender preserves dialog focus and uses the latest close handler", async () => {
  const firstClose = jest.fn();
  const nextClose = jest.fn();
  const view = render(<ContactModal isOpen onClose={firstClose} />);
  const email = screen.getByRole("textbox", { name: "Email" });
  email.focus();
  view.rerender(<ContactModal isOpen onClose={nextClose} />);
  expect(email).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(nextClose).toHaveBeenCalledTimes(1);
  expect(firstClose).not.toHaveBeenCalled();
});
