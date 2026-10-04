import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { externalReferrer, recordPageView } from "../lib/analytics";

export default function AnalyticsTracker() {
  const location = useLocation();
  const { email, loading } = useAuth();
  const lastKey = useRef<string | null>(null);
  const landing = useRef(true);
  useEffect(() => {
    if (loading || lastKey.current === location.key) return;
    lastKey.current = location.key;
    if (email || !/^\/(?:about|articles(?:\/[a-z0-9-]+)?|gateway|privacy)?$/.test(location.pathname)) return;
    const source = landing.current ? externalReferrer() : null;
    landing.current = false;
    void recordPageView(location.pathname, source);
  }, [email, loading, location.key, location.pathname]);
  return null;
}
