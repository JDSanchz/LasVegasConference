import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  colorSchemeDarkBlue,
  themeQuartz,
} from "ag-grid-community";
import { createLead, listLeadRequests } from "../api/client";

ModuleRegistry.registerModules([AllCommunityModule]);
const dashboardGridTheme = themeQuartz.withPart(colorSchemeDarkBlue);

const GENERATED_LEAD_COUNT = 10;
const DASHBOARD_ACCESS_STORAGE_KEY = "lv_conf_dashboard_access_granted";
const DASHBOARD_ACCESS_TTL_MS = 26 * 60 * 60 * 1000;
const DASHBOARD_REQUIRED_PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || "";
const SOURCE_COLORS = ["#f1c85b", "#7dc8ff", "#8df4cb", "#ff9e7d", "#d6a9ff", "#ffe48f"];
const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Casey",
  "Avery",
  "Riley",
  "Cameron",
  "Parker",
  "Drew",
];
const LAST_NAMES = [
  "Johnson",
  "Martinez",
  "Brown",
  "Davis",
  "Wilson",
  "Taylor",
  "Anderson",
  "Thomas",
  "Moore",
  "Jackson",
];
const JOB_TITLES = ["CEO", "COO", "VP Sales", "Head of Growth", "Founder", "Director of Marketing"];
const COMPANIES = [
  "Tesla",
  "Ford",
  "Dell Technologies",
  "Microsoft",
  "Google",
  "Amazon",
  "Apple",
  "NVIDIA",
  "Salesforce",
  "Oracle",
];
const UTM_SOURCES = ["linkedin", "google", "newsletter", "x", "youtube", "partner"];
const UTM_MEDIUMS = ["paid_social", "cpc", "email", "organic_social", "video", "referral"];
const UTM_CAMPAIGNS = [
  "executive-roundtable-2026",
  "spring-growth-summit",
  "pipeline-acceleration",
  "ai-leadership-series",
  "partner-invite-program",
  "vip-networking-drive",
];
const DEFAULT_CAMPAIGN_LINK_VALUES = {
  source: "newsletter",
  medium: "email",
  campaign: "executive-roundtable-2026",
  term: "",
  content: "",
};

function getDefaultCampaignBaseUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}/`;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildRandomLeadPayload() {
  const firstName = pickRandom(FIRST_NAMES);
  const lastName = pickRandom(LAST_NAMES);
  const company = pickRandom(COMPANIES);
  const handleSuffix = randomInt(1000, 9999);
  const now = Date.now();
  const randomOffsetMinutes = randomInt(0, 14 * 24 * 60);
  const submittedAt = new Date(now - randomOffsetMinutes * 60 * 1000).toISOString();

  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${handleSuffix}@example.com`,
    jobTitle: pickRandom(JOB_TITLES),
    socialHandle: `@${firstName.toLowerCase()}${lastName.toLowerCase()}${handleSuffix}`,
    company,
    utm: {
      utm_source: pickRandom(UTM_SOURCES),
      utm_medium: pickRandom(UTM_MEDIUMS),
      utm_campaign: pickRandom(UTM_CAMPAIGNS),
      utm_content: `entry-${handleSuffix}`,
    },
    submittedAt,
    landingPath: "/",
    landingHost: window.location.host,
  };
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  let date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map((part) => Number(part));
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function formatCompanyTick(value) {
  if (!value) {
    return "";
  }

  const normalized = String(value);
  if (normalized.length <= 12) {
    return normalized;
  }

  return `${normalized.slice(0, 12)}...`;
}

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardUnlocked, setDashboardUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [campaignLinkForm, setCampaignLinkForm] = useState({
    baseUrl: "",
    ...DEFAULT_CAMPAIGN_LINK_VALUES,
  });
  const [campaignLinkStatus, setCampaignLinkStatus] = useState({ type: "idle", message: "" });

  const clearDashboardAccess = useCallback(() => {
    try {
      localStorage.removeItem(DASHBOARD_ACCESS_STORAGE_KEY);
    } catch {
      // Ignore local storage errors in restricted browsers.
    }
  }, []);

  const hasValidDashboardAccess = useCallback(() => {
    try {
      const unlockedAtRaw = localStorage.getItem(DASHBOARD_ACCESS_STORAGE_KEY);
      if (!unlockedAtRaw) {
        return false;
      }

      const unlockedAtMs = Number(unlockedAtRaw);
      if (!Number.isFinite(unlockedAtMs)) {
        clearDashboardAccess();
        return false;
      }

      if (Date.now() - unlockedAtMs > DASHBOARD_ACCESS_TTL_MS) {
        clearDashboardAccess();
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, [clearDashboardAccess]);

  useEffect(() => {
    setDashboardUnlocked(hasValidDashboardAccess());
    setLoading(false);
  }, [hasValidDashboardAccess]);

  useEffect(() => {
    setCampaignLinkForm((current) => {
      if (current.baseUrl) {
        return current;
      }

      return {
        ...current,
        baseUrl: getDefaultCampaignBaseUrl(),
      };
    });
  }, []);

  useEffect(() => {
    if (!dashboardUnlocked) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (!hasValidDashboardAccess()) {
        setDashboardUnlocked(false);
        setPasswordInput("");
        setShowPassword(false);
        setPasswordError("Dashboard session expired. Enter password again.");
      }
    }, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [dashboardUnlocked, hasValidDashboardAccess]);

  async function loadLeads() {
    if (!dashboardUnlocked || !hasValidDashboardAccess()) {
      if (dashboardUnlocked) {
        setDashboardUnlocked(false);
        setPasswordError("Dashboard session expired. Enter password again.");
      }
      return;
    }

    setLoading(true);
    setError("");

    const payloads = Array.from({ length: GENERATED_LEAD_COUNT }, () => buildRandomLeadPayload());
    const creationResults = await Promise.all(payloads.map((payload) => createLead(payload)));
    const failedCreates = creationResults.filter((result) => !result.ok).length;

    const response = await listLeadRequests();
    if (!response.ok) {
      setLeads([]);
      setError(response.data?.error || "Failed to load dashboard data.");
      setLoading(false);
      return;
    }

    setLeads(Array.isArray(response.data?.leads) ? response.data.leads : []);
    if (failedCreates > 0) {
      setError(`${failedCreates} generated entries could not be saved.`);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (dashboardUnlocked) {
      loadLeads();
    }
  }, [dashboardUnlocked]);

  function handleDashboardUnlock(event) {
    event.preventDefault();
    setPasswordError("");

    if (!DASHBOARD_REQUIRED_PASSWORD) {
      setPasswordError("Dashboard password is not configured.");
      return;
    }

    if (passwordInput !== DASHBOARD_REQUIRED_PASSWORD) {
      clearDashboardAccess();
      setDashboardUnlocked(false);
      setPasswordError("Incorrect password.");
      return;
    }

    try {
      localStorage.setItem(DASHBOARD_ACCESS_STORAGE_KEY, String(Date.now()));
    } catch {
      // Ignore local storage errors in restricted browsers.
    }
    setDashboardUnlocked(true);
    setPasswordInput("");
  }

  function handleCampaignLinkFieldChange(event) {
    const { name, value } = event.target;
    setCampaignLinkForm((current) => ({
      ...current,
      [name]: value,
    }));
    if (campaignLinkStatus.type !== "idle") {
      setCampaignLinkStatus({ type: "idle", message: "" });
    }
  }

  function resetCampaignLinkForm() {
    setCampaignLinkForm({
      baseUrl: getDefaultCampaignBaseUrl(),
      ...DEFAULT_CAMPAIGN_LINK_VALUES,
    });
    setCampaignLinkStatus({ type: "idle", message: "" });
  }

  const campaignLinkBaseUrlError = useMemo(() => {
    const baseUrl = campaignLinkForm.baseUrl.trim();
    if (!baseUrl) {
      return "Enter a landing page URL to generate a campaign link.";
    }

    try {
      new URL(baseUrl);
      return "";
    } catch {
      return "Landing page URL must include protocol, for example: https://yourdomain.com.";
    }
  }, [campaignLinkForm.baseUrl]);

  const generatedCampaignLink = useMemo(() => {
    if (campaignLinkBaseUrlError) {
      return "";
    }

    const url = new URL(campaignLinkForm.baseUrl.trim());
    const params = [
      ["utm_source", campaignLinkForm.source],
      ["utm_medium", campaignLinkForm.medium],
      ["utm_campaign", campaignLinkForm.campaign],
      ["utm_term", campaignLinkForm.term],
      ["utm_content", campaignLinkForm.content],
    ];

    params.forEach(([key, value]) => {
      const normalizedValue = value.trim();
      if (normalizedValue) {
        url.searchParams.set(key, normalizedValue);
      } else {
        url.searchParams.delete(key);
      }
    });

    return url.toString();
  }, [campaignLinkBaseUrlError, campaignLinkForm]);

  async function copyGeneratedCampaignLink() {
    if (!generatedCampaignLink) {
      setCampaignLinkStatus({
        type: "warning",
        message: campaignLinkBaseUrlError || "Enter source, medium, and campaign values first.",
      });
      return;
    }

    if (!navigator?.clipboard?.writeText) {
      setCampaignLinkStatus({
        type: "warning",
        message: "Clipboard access is unavailable. Copy the generated URL manually.",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedCampaignLink);
      setCampaignLinkStatus({
        type: "success",
        message: "Campaign link copied to clipboard.",
      });
    } catch {
      setCampaignLinkStatus({
        type: "warning",
        message: "Unable to copy automatically. Copy the generated URL manually.",
      });
    }
  }

  const leadsSorted = useMemo(() => {
    return [...leads].sort((left, right) => {
      const leftDate = new Date(left.submittedAt || left.createdAt || 0).getTime();
      const rightDate = new Date(right.submittedAt || right.createdAt || 0).getTime();
      return rightDate - leftDate;
    });
  }, [leads]);

  const submissionsByDay = useMemo(() => {
    const buckets = new Map();

    leadsSorted.forEach((lead) => {
      const rawDate = lead.submittedAt || lead.createdAt;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      const dayKey = date.toISOString().slice(0, 10);
      buckets.set(dayKey, (buckets.get(dayKey) || 0) + 1);
    });

    return [...buckets.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, submissions]) => ({
        date,
        label: formatDate(date),
        submissions,
      }));
  }, [leadsSorted]);

  const sourceDistribution = useMemo(() => {
    const buckets = new Map();

    leadsSorted.forEach((lead) => {
      const source = lead.utm?.utm_source?.trim() || "Direct";
      buckets.set(source, (buckets.get(source) || 0) + 1);
    });

    return [...buckets.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([source, value]) => ({ source, value }));
  }, [leadsSorted]);

  const companyDistribution = useMemo(() => {
    const buckets = new Map();

    leadsSorted.forEach((lead) => {
      const company = lead.company?.trim() || "Unknown";
      buckets.set(company, (buckets.get(company) || 0) + 1);
    });

    return [...buckets.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([company, leadsCount]) => ({ company, leadsCount }));
  }, [leadsSorted]);

  const uniqueCompanies = useMemo(() => {
    return new Set(leadsSorted.map((lead) => lead.company?.trim()).filter(Boolean)).size;
  }, [leadsSorted]);

  const tableRows = useMemo(() => {
    return leadsSorted.map((lead) => ({
      id: lead.id || "",
      submittedAt: formatDateTime(lead.submittedAt || lead.createdAt),
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      email: lead.email || "",
      jobTitle: lead.jobTitle || "",
      company: lead.company || "",
      socialHandle: lead.socialHandle || "",
      source: lead.utm?.utm_source || "Direct",
      medium: lead.utm?.utm_medium || "",
      campaign: lead.utm?.utm_campaign || "",
      landingHost: lead.landingHost || "",
      landingPath: lead.landingPath || "",
    }));
  }, [leadsSorted]);

  const columnDefs = useMemo(
    () => [
      { field: "submittedAt", headerName: "Submitted", minWidth: 190, pinned: "left" },
      { field: "firstName", headerName: "First Name", minWidth: 130 },
      { field: "lastName", headerName: "Last Name", minWidth: 130 },
      { field: "email", headerName: "Email", minWidth: 230 },
      { field: "jobTitle", headerName: "Job Title", minWidth: 180 },
      { field: "company", headerName: "Company", minWidth: 170 },
      { field: "socialHandle", headerName: "Social Handle", minWidth: 150 },
      { field: "source", headerName: "UTM Source", minWidth: 130 },
      { field: "medium", headerName: "UTM Medium", minWidth: 130 },
      { field: "campaign", headerName: "UTM Campaign", minWidth: 170 },
      { field: "landingHost", headerName: "Landing Host", minWidth: 170 },
      { field: "landingPath", headerName: "Landing Path", minWidth: 140 },
      { field: "id", headerName: "Lead ID", minWidth: 240 },
    ],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: false,
      suppressHeaderMenuButton: true,
    }),
    [],
  );

  return (
    <div className="page-shell dashboard-page">
      {!dashboardUnlocked ? (
        <div
          className="dashboard-access-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-access-title"
        >
          <form className="dashboard-access-modal surface-card" onSubmit={handleDashboardUnlock}>
            <p className="eyebrow">Restricted Access</p>
            <h2 id="dashboard-access-title">Enter Dashboard Password</h2>
            <p className="section-intro">
              Access is locked. Enter the password to continue and load dashboard data.
            </p>
            <label htmlFor="dashboard-password" className="dashboard-access-label">
              Password
            </label>
            <div className="dashboard-access-input-row">
              <input
                id="dashboard-password"
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                className="dashboard-access-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="dashboard-access-visibility-btn"
                onClick={() => setShowPassword((current) => !current)}
                aria-controls="dashboard-password"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {passwordError ? (
              <p className="status-message status-warning dashboard-access-error">{passwordError}</p>
            ) : null}
            <button type="submit" className="btn btn-primary dashboard-access-btn">
              Unlock Dashboard
            </button>
          </form>
        </div>
      ) : null}

      <div className={dashboardUnlocked ? "" : "dashboard-content-locked"} aria-hidden={!dashboardUnlocked}>
      <header className="dashboard-header surface-card">
        <div>
          <p className="eyebrow">Invite Analytics</p>
          <h1>Lead Dashboard</h1>
          <p className="section-intro">
            Live view of all request data currently stored in your database.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button type="button" className="btn btn-primary" onClick={loadLeads} disabled={!dashboardUnlocked}>
            Refresh Data
          </button>
          <Link href="/" className="btn btn-ghost">
            Back To Landing
          </Link>
        </div>
      </header>

      <section className="dashboard-kpi-grid">
        <article className="dashboard-kpi surface-card">
          <p>Total Leads</p>
          <strong>{leadsSorted.length}</strong>
        </article>
        <article className="dashboard-kpi surface-card">
          <p>Unique Companies</p>
          <strong>{uniqueCompanies}</strong>
        </article>
        <article className="dashboard-kpi surface-card">
          <p>Top Source</p>
          <strong>{sourceDistribution[0]?.source || "N/A"}</strong>
        </article>
      </section>

      {error ? (
        <p className="status-message status-warning">{error}</p>
      ) : null}

      <section className="dashboard-tools-grid">
        <article className="dashboard-link-generator surface-card">
          <h2>Marketing Campaign Link Generator</h2>
          <p>Build tracked links by adjusting source, medium, and campaign.</p>

          <div className="dashboard-link-generator-form">
            <div className="dashboard-link-field dashboard-link-field-wide">
              <label htmlFor="campaign-base-url">Landing Page URL</label>
              <input
                id="campaign-base-url"
                name="baseUrl"
                type="url"
                value={campaignLinkForm.baseUrl}
                onChange={handleCampaignLinkFieldChange}
                placeholder="https://yourdomain.com"
              />
            </div>

            <div className="dashboard-link-field">
              <label htmlFor="campaign-source">UTM Source</label>
              <input
                id="campaign-source"
                name="source"
                type="text"
                value={campaignLinkForm.source}
                onChange={handleCampaignLinkFieldChange}
                list="utm-source-options"
                placeholder="newsletter"
              />
            </div>

            <div className="dashboard-link-field">
              <label htmlFor="campaign-medium">UTM Medium</label>
              <select
                id="campaign-medium"
                name="medium"
                value={campaignLinkForm.medium}
                onChange={handleCampaignLinkFieldChange}
              >
                {UTM_MEDIUMS.map((medium) => (
                  <option key={medium} value={medium}>
                    {medium}
                  </option>
                ))}
                <option value="sms">sms</option>
                <option value="direct_mail">direct_mail</option>
              </select>
            </div>

            <div className="dashboard-link-field">
              <label htmlFor="campaign-name">UTM Campaign</label>
              <input
                id="campaign-name"
                name="campaign"
                type="text"
                value={campaignLinkForm.campaign}
                onChange={handleCampaignLinkFieldChange}
                list="utm-campaign-options"
                placeholder="spring-growth-summit"
              />
            </div>

            <div className="dashboard-link-field">
              <label htmlFor="campaign-term">UTM Term (Optional)</label>
              <input
                id="campaign-term"
                name="term"
                type="text"
                value={campaignLinkForm.term}
                onChange={handleCampaignLinkFieldChange}
                placeholder="executive-list-a"
              />
            </div>

            <div className="dashboard-link-field">
              <label htmlFor="campaign-content">UTM Content (Optional)</label>
              <input
                id="campaign-content"
                name="content"
                type="text"
                value={campaignLinkForm.content}
                onChange={handleCampaignLinkFieldChange}
                placeholder="cta-button-v1"
              />
            </div>

            <datalist id="utm-source-options">
              {UTM_SOURCES.map((source) => (
                <option key={source} value={source} />
              ))}
              <option value="email" />
              <option value="sms" />
              <option value="direct_mail" />
            </datalist>

            <datalist id="utm-campaign-options">
              {UTM_CAMPAIGNS.map((campaign) => (
                <option key={campaign} value={campaign} />
              ))}
            </datalist>
          </div>

          <div className="dashboard-link-output">
            <label htmlFor="generated-campaign-link">Generated Campaign URL</label>
            <input
              id="generated-campaign-link"
              type="text"
              value={generatedCampaignLink}
              readOnly
              placeholder="Your tracked URL will appear here."
            />
            {campaignLinkBaseUrlError ? (
              <p className="status-message status-warning">{campaignLinkBaseUrlError}</p>
            ) : null}
            {campaignLinkStatus.type !== "idle" ? (
              <p className={`status-message status-${campaignLinkStatus.type}`}>
                {campaignLinkStatus.message}
              </p>
            ) : null}
            <div className="dashboard-link-actions">
              <button type="button" className="btn btn-primary" onClick={copyGeneratedCampaignLink}>
                Copy Link
              </button>
              <button type="button" className="btn btn-ghost" onClick={resetCampaignLinkForm}>
                Reset
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-chart-grid">
        <article className="dashboard-chart-card surface-card">
          <h2>Submission Velocity</h2>
          <p>How request volume changes day by day.</p>
          <div className="dashboard-chart-shell">
            {submissionsByDay.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={submissionsByDay} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f1c85b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f1c85b" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.16)" />
                  <XAxis dataKey="label" stroke="#d2c8b0" tickLine={false} axisLine={false} />
                  <YAxis stroke="#d2c8b0" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(20,18,25,0.95)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: "10px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    stroke="#f1c85b"
                    strokeWidth={3}
                    fill="url(#velocityGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="dashboard-empty">No lead submissions yet.</p>
            )}
          </div>
        </article>

        <article className="dashboard-chart-card surface-card">
          <h2>Traffic Sources</h2>
          <p>Where your invite requests are coming from.</p>
          <div className="dashboard-chart-shell">
            {sourceDistribution.length ? (
              <ResponsiveContainer width="100%" height={290}>
                <PieChart>
                  <Pie
                    data={sourceDistribution}
                    dataKey="value"
                    nameKey="source"
                    cx="50%"
                    cy="44%"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={3}
                    label={false}
                    labelLine={false}
                  >
                    {sourceDistribution.map((entry, index) => (
                      <Cell
                        key={entry.source}
                        fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                        stroke="rgba(0,0,0,0.4)"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(20,18,25,0.95)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: "10px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", color: "#d2c8b0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="dashboard-empty">No source data available.</p>
            )}
          </div>
        </article>

        <article className="dashboard-chart-card surface-card">
          <h2>Top Companies</h2>
          <p>Most represented companies in your pipeline.</p>
          <div className="dashboard-chart-shell">
            {companyDistribution.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={companyDistribution} margin={{ top: 10, right: 12, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.16)" />
                  <XAxis
                    dataKey="company"
                    stroke="#d2c8b0"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tickMargin={8}
                    tickFormatter={formatCompanyTick}
                    height={44}
                  />
                  <YAxis stroke="#d2c8b0" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(20,18,25,0.95)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: "10px",
                    }}
                  />
                  <Bar dataKey="leadsCount" radius={[8, 8, 0, 0]} fill="#7dc8ff" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="dashboard-empty">No company data available.</p>
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-table-card surface-card">
        <div className="dashboard-table-headline">
          <h2>All Invite Requests</h2>
          <p>{loading ? "Loading..." : `${tableRows.length} records`}</p>
        </div>
        <div className="dashboard-grid">
          <AgGridReact
            theme={dashboardGridTheme}
            rowData={tableRows}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows
            suppressMovableColumns
            rowSelection={{ mode: "singleRow" }}
          />
        </div>
      </section>
      </div>
    </div>
  );
}
