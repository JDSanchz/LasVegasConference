import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

function getUtmFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const values = {};

  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) {
      values[key] = value;
    }
  });

  return values;
}

function getStoredUtm() {
  try {
    const raw = sessionStorage.getItem("lv_conf_utm");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredUtm(utm) {
  try {
    sessionStorage.setItem("lv_conf_utm", JSON.stringify(utm));
  } catch {
    // Ignore storage errors in private browsing modes.
  }
}

function saveLead(lead) {
  try {
    const raw = localStorage.getItem("lv_conf_leads");
    const leads = raw ? JSON.parse(raw) : [];
    leads.push(lead);
    localStorage.setItem("lv_conf_leads", JSON.stringify(leads));
    return true;
  } catch {
    return false;
  }
}

const initialFormState = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  jobTitle: "",
  phone: "",
  industry: "",
  companySize: "",
};

const valueCards = [
  {
    title: "Private Access to Decision-Makers",
    text: "Connect directly with founders, investors, and executives in curated networking sessions designed for serious conversations, not crowded conferences.",
  },
  {
    title: "Actionable Growth Strategies",
    text: "Learn proven frameworks, case studies, and tactics from operators actively scaling companies and driving measurable revenue growth.",
  },
  {
    title: "High-Value Deal Flow",
    text: "Discover partnership opportunities, new clients, and strategic collaborations with professionals actively looking to do business.",
  },
];

const attendees = [
  "CEOs & Founders",
  "VP Sales & Revenue Leaders",
  "Private Equity & Investors",
  "Enterprise Strategy Teams",
];

const keynotes = [
  {
    title: "Winning the Next Decade of Business Growth",
    speakers: "Jesus Del Barrio",
  },
  {
    title: "How Top Leaders Make Decisions That Drive Results",
    speakers: "Estefani Robertson and Leo Armani",
  },
];

export default function App() {
  const [formData, setFormData] = useState(initialFormState);
  const [utm, setUtm] = useState({});
  const [status, setStatus] = useState({ type: "idle", message: "" });

  useEffect(() => {
    const urlUtm = getUtmFromUrl();
    const stored = getStoredUtm();
    const merged = { ...stored, ...urlUtm };

    setUtm(merged);
    saveStoredUtm(merged);
  }, []);

  const campaignSource = useMemo(() => {
    return utm.utm_source || "Direct";
  }, [utm]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "loading", message: "Submitting..." });

    const payload = {
      ...formData,
      utm,
      submittedAt: new Date().toISOString(),
      landingPath: window.location.pathname,
      landingHost: window.location.host,
    };

    const localSaved = saveLead(payload);
    const endpoint = import.meta.env.VITE_LEAD_ENDPOINT;

    if (endpoint) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Lead endpoint request failed.");
        }
      } catch {
        setStatus({
          type: "warning",
          message:
            "Invite request received locally, but remote submission failed. Please verify the endpoint.",
        });
        return;
      }
    }

    setFormData(initialFormState);
    setStatus({
      type: "success",
      message: localSaved
        ? "You are on the priority list. We will contact you shortly."
        : "Submission received. We will contact you shortly.",
    });
  }

  return (
    <div className="page-shell">
      <header className="hero" id="top">
        <motion.div
          className="hero-grid"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div className="hero-content" variants={fadeUp}>
            <p className="eyebrow">Las Vegas Executive Conference 2026</p>
            <h1>
              The Invite-Only Room Where High-Value Deals Start.
            </h1>
            <p className="hero-subheadline">
              Join top operators, investors, and growth leaders for two days of
              strategic sessions and curated networking in Las Vegas.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#lead-form">
                Request My Invite
              </a>
              <a className="btn btn-ghost" href="#value">
                View Agenda Highlights
              </a>
            </div>
            <p className="campaign-pill">
              Traffic source detected: <strong>{campaignSource}</strong>
            </p>
          </motion.div>

          <motion.div className="hero-visual" variants={fadeUp}>
            <div className="hero-visual-panel">
              <div className="skyline" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <p className="panel-title">Featured Event Highlights</p>
              <ul>
                <li>Private executive networking sessions</li>
                <li>Actionable growth and GTM playbooks</li>
                <li>High-intent partner and investor introductions</li>
              </ul>
              <p className="panel-foot">Limited seating by application only</p>
            </div>
          </motion.div>
        </motion.div>
      </header>

      <main>
        <motion.section
          className="section"
          id="value"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 variants={fadeUp}>Why High-Value Prospects Attend</motion.h2>
          <motion.p className="section-intro" variants={fadeUp}>
            Designed for senior decision-makers who want real opportunities,
            strategic insight, and high-impact connections.
          </motion.p>
          <motion.div className="card-grid" variants={stagger}>
            {valueCards.map((card) => (
              <motion.article key={card.title} className="value-card" variants={fadeUp}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          className="section keynote-section"
          id="keynotes"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 variants={fadeUp}>Featured Keynotes</motion.h2>
          <motion.p className="section-intro" variants={fadeUp}>
            Strategic sessions designed for leaders focused on high-impact growth and execution.
          </motion.p>
          <motion.div className="keynote-grid" variants={stagger}>
            {keynotes.map((keynote) => (
              <motion.article
                key={keynote.title}
                className="keynote-card"
                variants={fadeUp}
              >
                <div className="keynote-photo-placeholder" aria-label="Speaker image placeholder">
                  Speaker Image Placeholder
                </div>
                <h3>{keynote.title}</h3>
                <p className="keynote-speaker">By {keynote.speakers}</p>
              </motion.article>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          className="section credibility"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 variants={fadeUp}>Built for Decision Makers</motion.h2>
          <motion.div className="credibility-grid" variants={stagger}>
            <motion.div className="stat" variants={fadeUp}>
              <p className="stat-number">500+</p>
              <p className="stat-label">Qualified attendees</p>
            </motion.div>
            <motion.div className="stat" variants={fadeUp}>
              <p className="stat-number">40+</p>
              <p className="stat-label">Industry speakers</p>
            </motion.div>
            <motion.div className="stat" variants={fadeUp}>
              <p className="stat-number">2 Days</p>
              <p className="stat-label">Of focused deal flow</p>
            </motion.div>
            <motion.div className="attendee-list" variants={fadeUp}>
              <p>Who you will meet</p>
              <ul>
                {attendees.map((attendee) => (
                  <li key={attendee}>{attendee}</li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </motion.section>

        <motion.section
          className="section form-section"
          id="lead-form"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div variants={fadeUp}>
            <h2>Request Your Invite</h2>
            <p className="section-intro">
              Complete this short form to be considered for priority access.
            </p>
          </motion.div>

          <motion.form className="lead-form" onSubmit={handleSubmit} variants={fadeUp}>
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />

            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="company">Company</label>
            <input
              id="company"
              name="company"
              type="text"
              autoComplete="organization"
              value={formData.company}
              onChange={handleChange}
              required
            />

            <label htmlFor="jobTitle">Job Title</label>
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              autoComplete="organization-title"
              value={formData.jobTitle}
              onChange={handleChange}
              required
            />

            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            <label htmlFor="industry">Industry (Optional)</label>
            <input
              id="industry"
              name="industry"
              type="text"
              autoComplete="off"
              value={formData.industry}
              onChange={handleChange}
            />

            <label htmlFor="companySize">Company Size (Optional)</label>
            <select
              id="companySize"
              name="companySize"
              value={formData.companySize}
              onChange={handleChange}
            >
              <option value="">Select company size</option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="201-500">201-500</option>
              <option value="501+">501+</option>
            </select>

            <button type="submit" className="btn btn-primary full-width">
              {status.type === "loading" ? "Submitting..." : "Reserve My Spot"}
            </button>

            {status.type !== "idle" ? (
              <p className={`status-message status-${status.type}`} role="status">
                {status.message}
              </p>
            ) : null}
          </motion.form>
        </motion.section>

        <motion.section
          className="section final-cta"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
        >
          <h2>Invitation Requests Closing Soon</h2>
          <p>
            A limited number of seats are available for this round. Submit your
            request now to be considered before invitations are finalized.
          </p>
          <a className="btn btn-primary" href="#lead-form">
            Request My Invite
          </a>
        </motion.section>
      </main>
    </div>
  );
}
