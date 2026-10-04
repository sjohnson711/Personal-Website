import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";
import { randomUUID } from "node:crypto";
import AnalyticsTracker from "../src/components/AnalyticsTracker";
import { recordPageView, privacyOptOut, externalReferrer } from "../src/lib/analytics";

jest.mock("../src/lib/api", () => ({ API_BASE: "/api" }));
let mockAuth = { email: null as string | null, loading: false };
jest.mock("../src/context/AuthContext", () => ({ useAuth: () => mockAuth }));
beforeEach(() => {
  mockAuth = { email: null, loading: false };
  Object.defineProperty(window.crypto, "randomUUID", { configurable: true, value: randomUUID });
  Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: "0" });
  Object.defineProperty(navigator, "globalPrivacyControl", { configurable: true, value: false });
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
});
test("strict rendering and repeated renders count once; route navigation counts again", async () => {
  render(<StrictMode><MemoryRouter><AnalyticsTracker /><Link to="/about">About</Link></MemoryRouter></StrictMode>);
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByText("About"));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  const body = JSON.parse(jest.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(Object.keys(body).sort()).toEqual(["device", "id", "path", "referrerHost"]);
  expect(jest.mocked(fetch).mock.calls[0][1]!.credentials).toBe("omit");
});
test("private routes and signed-in admins are excluded", () => {
  const first = render(<MemoryRouter initialEntries={["/admin/dashboard"]}><AnalyticsTracker /></MemoryRouter>);
  expect(fetch).not.toHaveBeenCalled(); first.unmount();
  mockAuth.email = "admin@example.com";
  render(<MemoryRouter><AnalyticsTracker /></MemoryRouter>);
  expect(fetch).not.toHaveBeenCalled();
});
test("browser privacy settings suppress traffic collection", async () => {
  Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: "1" });
  expect(privacyOptOut()).toBe(true); await recordPageView("/", null);
  expect(fetch).not.toHaveBeenCalled();
  Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: "0" });
  Object.defineProperty(navigator, "globalPrivacyControl", { configurable: true, value: true });
  await recordPageView("/", null); expect(fetch).not.toHaveBeenCalled();
});
test("network retries reuse an event ID and referrers discard paths and queries", async () => {
  Object.defineProperty(document, "referrer", { configurable: true, value: "https://google.com/private?email=secret@example.com" });
  expect(externalReferrer()).toBe("google.com");
  Object.defineProperty(document, "referrer", { configurable: true, value: "http://192.168.1.2/private" });
  expect(externalReferrer()).toBeNull();
  Object.defineProperty(document, "referrer", { configurable: true, value: "https://google.com/private?email=secret@example.com" });
  jest.mocked(fetch).mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({ ok: true } as Response);
  await recordPageView("/", externalReferrer());
  expect(jest.mocked(fetch).mock.calls[0][1]!.body).toBe(jest.mocked(fetch).mock.calls[1][1]!.body);
  expect(jest.mocked(fetch).mock.calls[0][1]!.body).not.toContain("secret@example.com");
});
