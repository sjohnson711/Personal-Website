import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

interface Summary {
  totals: { views: number; subscriptions: number; comments: number; contacts: number };
  daily: { day: string; views: number }[];
  popularPages: { path: string; title: string; views: number }[];
  sources: { source: string; views: number }[];
  devices: { device: string; views: number }[];
  trackingSince: string | null;
}
interface Activity { id: number; kind: string; name: string | null; email: string | null; articleId: number | null; createdAt: string; }
interface Subscriber { id: number; email: string; createdAt: string; }
interface Job { id: string; subscriberEmail: string; status: string; attempts: number; signupAt: string; sentAt: string | null; lastError: string | null; }
interface Collection<T> { items: T[]; total: number; totalPages: number; }
const date = (value: string) => new Date(value).toLocaleString();

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [subPage, setSubPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<{ summary: Summary; activity: Collection<Activity>; subscribers: Collection<Subscriber>; jobs: Job[]; deliveryEnabled: boolean } | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    Promise.all([api.get(`/analytics/summary?days=${days}`), api.get(`/analytics/activity?days=${days}&page=${page}`),
      api.get(`/analytics/subscribers?page=${subPage}`), api.get("/analytics/notifications")])
      .then(([summary, activity, subscribers, jobs]) => { if (active) setData({ summary, activity, subscribers, jobs: jobs.items, deliveryEnabled: jobs.deliveryEnabled }); })
      .catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [days, page, subPage, attempt]);
  return <div className="analytics-page fade-up">
    <Link to="/admin/dashboard">← Dashboard</Link>
    <div className="analytics-toolbar"><h1>Site analytics</h1><label>Period <select className="field-input" value={days} onChange={(e) => { setDays(Number(e.target.value)); setPage(1); }}>
      <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
    </select></label><button className="btn-ghost" onClick={() => setAttempt((n) => n + 1)}>Refresh</button></div>
    <p>Cookie-free page views, not unique people. Dates in traffic charts use UTC. History is kept for 90 days.</p>
    {loading ? <p role="status">Loading analytics…</p> : error ? <div className="alert-error" role="alert">We couldn't load analytics. <button className="btn-ghost" onClick={() => setAttempt((n) => n + 1)}>Try again</button></div> : data && <>
      <div className="analytics-stats">{Object.entries(data.summary.totals).map(([label, value]) => <div className="stat-card" key={label}><div className="stat-number">{value}</div><div className="stat-label">{label === "views" ? "Page views" : label}</div></div>)}</div>
      <section className="card no-lift analytics-panel"><h2>Daily page views</h2>
        <p>{data.summary.trackingSince ? `Available traffic history begins ${date(data.summary.trackingSince)}.` : "Traffic will appear after public pages are visited."}</p>
        <div className="traffic-chart" role="img" aria-label={`${days} days of page views; daily values follow in the table`}>
          {data.summary.daily.map((day) => <div key={day.day} title={`${day.day}: ${day.views} views`} style={{ height: `${day.views === 0 ? 0 : Math.max(2, day.views / Math.max(1, ...data.summary.daily.map((d) => d.views)) * 100)}%` }} />)}
        </div><details><summary>Daily values</summary><div className="analytics-table-wrap"><table><thead><tr><th>Date (UTC)</th><th>Views</th></tr></thead><tbody>{data.summary.daily.map((day) => <tr key={day.day}><td>{day.day}</td><td>{day.views}</td></tr>)}</tbody></table></div></details>
      </section>
      <div className="analytics-breakdowns">
        <Counts title="Popular pages" rows={data.summary.popularPages.map((r) => [r.title, r.views])} />
        <Counts title="Traffic sources" rows={data.summary.sources.map((r) => [r.source, r.views])} />
        <Counts title="Devices" rows={data.summary.devices.map((r) => [r.device, r.views])} />
      </div>
      <section className="card no-lift analytics-panel"><h2>Recent interactions</h2><p>Names and email addresses are supplied by the person submitting the form and are unverified. These records are not linked to anonymous visits.</p>
        {data.activity.items.length === 0 ? <p>No interactions in this period.</p> : <div className="analytics-table-wrap"><table><thead><tr><th>Interaction</th><th>Submitted identity</th><th>When</th></tr></thead><tbody>{data.activity.items.map((a) => <tr key={a.id}><td>{a.kind}{a.articleId && <> · Article {a.articleId}</>}</td><td>{a.name && <span>{a.name}<br /></span>}{a.email ?? (!a.name ? "Removed / unavailable" : "")}</td><td>{date(a.createdAt)}</td></tr>)}</tbody></table></div>}
        <Pager page={page} pages={data.activity.totalPages} setPage={setPage} label="Interactions" />
      </section>
      <section className="card no-lift analytics-panel"><h2>Active subscribers ({data.subscribers.total})</h2><p>Active subscriptions remain available beyond the analytics retention period.</p>
        {data.subscribers.items.length === 0 ? <p>No active subscribers.</p> : <div className="analytics-table-wrap"><table><thead><tr><th>Submitted email (unverified)</th><th>Subscribed</th></tr></thead><tbody>{data.subscribers.items.map((s) => <tr key={s.id}><td>{s.email}</td><td>{date(s.createdAt)}</td></tr>)}</tbody></table></div>}
        <Pager page={subPage} pages={data.subscribers.totalPages} setPage={setSubPage} label="Subscribers" />
      </section>
      <section className="card no-lift analytics-panel"><h2>Latest signup alerts</h2>{data.deliveryEnabled ? <p>“Sent” means accepted by the email service, not confirmed inbox delivery. Pending alerts retry automatically; failed alerts need investigation.</p> : <p role="status">Email delivery is currently disabled. Subscriptions are saved, and signup alerts stay pending for up to 90 days.</p>}
        {data.jobs.length === 0 ? <p>No signup alerts yet.</p> : <div className="analytics-table-wrap"><table><thead><tr><th>Subscriber email</th><th>Status</th><th>Attempts</th><th>Signup</th></tr></thead><tbody>{data.jobs.map((j) => <tr key={j.id}><td>{j.subscriberEmail}</td><td>{j.status}{j.lastError && <small> · {j.lastError}</small>}</td><td>{j.attempts}</td><td>{date(j.signupAt)}</td></tr>)}</tbody></table></div>}
      </section>
    </>}
  </div>;
}
function Counts({ title, rows }: { title: string; rows: [string, number][] }) {
  return <section className="card no-lift analytics-panel"><h2>{title}</h2>{rows.length === 0 ? <p>No traffic yet.</p> : <ul className="analytics-counts">{rows.map(([label, views]) => <li key={label}><span>{label}</span><strong>{views}</strong></li>)}</ul>}</section>;
}
function Pager({ page, pages, setPage, label }: { page: number; pages: number; setPage: (n: number) => void; label: string }) {
  return pages > 1 ? <nav aria-label={`${label} pagination`} className="analytics-toolbar"><button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="btn-ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></nav> : null;
}
