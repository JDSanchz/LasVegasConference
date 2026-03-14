import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

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
  socialHandle: "",
};

const valueCards = [
  {
    title: "Curated Executive Network",
    text: "Meet proven operators and investors ready for focused, high-value conversations.",
  },
  {
    title: "Proven Growth Playbooks",
    text: "Leave with strategies top teams use to accelerate pipeline and revenue.",
  },
  {
    title: "Qualified Deal Opportunities",
    text: "Find partners, clients, and capital sources actively seeking new business relationships.",
  },
];

const keynotes = [
  {
    title: "Winning the Next Decade of Business Growth",
    speakers: "Jesus Del Barrio",
    role: "Gemma Learn CEO",
    image: "/jesus.png",
    imageAlt: "Jesus Del Barrio keynote speaker",
    imagePosition: "54% 22%",
  },
  {
    title: "How Top Leaders Make Decisions That Drive Results",
    speakers: "Estefani Robertson and Leo Armani",
    role: "Golden Minds CEO and VP",
    image: "/armani.png",
    imageAlt: "Leo Armani keynote speaker",
    imagePosition: "56% 20%",
  },
];

const spotlightExecutives = [
  {
    name: "Elon Musk",
    title: "CEO",
    company: "SpaceX and Tesla",
    image: "/lv1.png",
    imageAlt: "Elon Musk executive attendee",
  },
  {
    name: "Elias Ayub",
    title: "Investor",
    company: "",
    image: "/lv2.png",
    imageAlt: "Elias Ayub executive attendee",
  },
  {
    name: "Barack Obama",
    title: "Former POTUS and Investor",
    company: "",
    image: "/lv3.png",
    imageAlt: "Barack Obama executive attendee",
  },
];

const credibilityStats = [
  { key: "attendees", target: 500, suffix: "+", label: "Qualified attendees" },
  { key: "speakers", target: 40, suffix: "+", label: "Industry speakers" },
];

const credibilityClosingStat = { key: "days", target: 2, suffix: " Days", label: "Of focused deal flow" };

function ParallaxSection({
  children,
  className = "",
  direction = 1,
  intensity = 26,
  style,
  ...props
}) {
  const sectionRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [intensity * direction, -intensity * direction],
  );

  return (
    <motion.section
      ref={sectionRef}
      className={`parallax-section ${className}`.trim()}
      style={style ? { ...style, y } : { y }}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export default function App() {
  const [formData, setFormData] = useState(initialFormState);
  const [utm, setUtm] = useState({});
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [credibilityAnimated, setCredibilityAnimated] = useState(false);
  const [statValues, setStatValues] = useState({
    attendees: 0,
    speakers: 0,
    networking: 0,
    days: 0,
  });
  const [spotlightHintDismissed, setSpotlightHintDismissed] = useState(false);
  const spotlightTrackRef = useRef(null);

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

  useEffect(() => {
    if (!credibilityAnimated) {
      return;
    }

    const targets = { attendees: 500, speakers: 40, networking: 30, days: 2 };
    const durationMs = 1300;
    const startTime = performance.now();
    let frameId = 0;

    const step = (now) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setStatValues({
        attendees: Math.round(targets.attendees * eased),
        speakers: Math.round(targets.speakers * eased),
        networking: Math.round(targets.networking * eased),
        days: Math.round(targets.days * eased),
      });

      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      }
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [credibilityAnimated]);

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

  function handleAnimatedNav(event, targetId) {
    event.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function scrollSpotlight(direction) {
    const track = spotlightTrackRef.current;
    if (!track || track.children.length === 0) {
      return;
    }

    const firstCard = track.children[0];
    const cardWidth = firstCard.getBoundingClientRect().width;
    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const step = cardWidth + gap;

    track.scrollBy({
      left: direction === "next" ? step : -step,
      behavior: "smooth",
    });
  }

  function handleSpotlightScroll(event) {
    if (spotlightHintDismissed) {
      return;
    }

    if (event.currentTarget.scrollLeft > 24) {
      setSpotlightHintDismissed(true);
    }
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
          <motion.div className="hero-content surface-card" variants={fadeUp}>
            <p className="eyebrow">Las Vegas Executive Conference 2026</p>
            <h1>
              The Invite-Only Room Where High-Value Deals Start.
            </h1>
            <p className="hero-subheadline">
              Join top operators, investors, and growth leaders for two days of
              strategic sessions and curated networking in Las Vegas.
            </p>
            <div className="hero-actions">
              <a
                className="btn btn-primary"
                href="#lead-form"
                onClick={(event) => handleAnimatedNav(event, "lead-form")}
              >
                Request My Invite
              </a>
              <a
                className="btn btn-ghost"
                href="#value"
                onClick={(event) => handleAnimatedNav(event, "value")}
              >
                View Agenda Highlights
              </a>
            </div>
            <p className="campaign-pill">
              Traffic source detected: <strong>{campaignSource}</strong>
            </p>
          </motion.div>
        </motion.div>
      </header>

      <main>
        <ParallaxSection
          className="section"
          id="value"
          direction={1}
          intensity={28}
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
              <motion.article key={card.title} className="value-card surface-card" variants={fadeUp}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </ParallaxSection>

        <ParallaxSection
          className="section spotlight-section"
          id="executive-spotlight"
          direction={-1}
          intensity={22}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div className="spotlight-header" variants={fadeUp}>
            <div>
              <h2>Executive Spotlight</h2>
              <p className="section-intro">
                Meet a select group of executives attending this year&apos;s event.
                Their presence reflects the caliber of leadership and deal activity
                inside the room.
              </p>
            </div>
            <div className="spotlight-controls" aria-label="Executive carousel controls">
              <button
                type="button"
                className="spotlight-control-btn"
                onClick={() => scrollSpotlight("prev")}
                aria-label="Previous executives"
              >
                Previous
              </button>
              <button
                type="button"
                className="spotlight-control-btn"
                onClick={() => scrollSpotlight("next")}
                aria-label="Next executives"
              >
                Next
              </button>
            </div>
          </motion.div>

          <div className="spotlight-carousel-shell">
            <motion.div
              className="spotlight-track"
              variants={fadeUp}
              ref={spotlightTrackRef}
              onScroll={handleSpotlightScroll}
            >
              {spotlightExecutives.map((executive) => (
                <article className="spotlight-card surface-card" key={executive.name}>
                  <img
                    className="spotlight-photo"
                    src={executive.image}
                    alt={executive.imageAlt}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="spotlight-card-content">
                    <h3>{executive.name}</h3>
                    <p className="spotlight-title">{executive.title}</p>
                    {executive.company ? (
                      <p className="spotlight-company">{executive.company}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </motion.div>
            {!spotlightHintDismissed ? <div className="spotlight-edge-cue" aria-hidden="true" /> : null}
            {!spotlightHintDismissed ? (
              <div className="spotlight-image-arrow" aria-hidden="true">
                →
              </div>
            ) : null}
          </div>
        </ParallaxSection>

        <ParallaxSection
          className="section keynote-section"
          id="keynotes"
          direction={1}
          intensity={24}
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
                className="keynote-card surface-card"
                variants={fadeUp}
              >
                <div className="keynote-media">
                  <img
                    className="keynote-photo"
                    src={keynote.image}
                    alt={keynote.imageAlt}
                    style={{ objectPosition: keynote.imagePosition }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="keynote-content">
                  <h3>{keynote.title}</h3>
                  <p className="keynote-speaker">By {keynote.speakers}</p>
                  <p className="keynote-role">{keynote.role}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </ParallaxSection>

        <ParallaxSection
          className="section credibility"
          direction={-1}
          intensity={20}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          onViewportEnter={() => setCredibilityAnimated(true)}
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 variants={fadeUp}>Built for Decision Makers</motion.h2>
          <motion.div className="credibility-grid" variants={stagger}>
            {credibilityStats.map((stat) => (
              <motion.div className="stat surface-card" variants={fadeUp} key={stat.key}>
                <p
                  className={`stat-number${credibilityAnimated ? " stat-number-animated" : ""}`}
                >
                  {statValues[stat.key]}
                  {stat.suffix}
                </p>
                <p className="stat-label">{stat.label}</p>
              </motion.div>
            ))}
            <motion.div className="attendee-list surface-card" variants={fadeUp}>
              <p
                className={`stat-number${credibilityAnimated ? " stat-number-animated" : ""}`}
              >
                {statValues.networking}+
              </p>
              <p className="stat-label">Networking Sessions</p>
            </motion.div>
            <motion.div className="stat surface-card" variants={fadeUp}>
              <p
                className={`stat-number${credibilityAnimated ? " stat-number-animated" : ""}`}
              >
                {statValues[credibilityClosingStat.key]}
                {credibilityClosingStat.suffix}
              </p>
              <p className="stat-label">{credibilityClosingStat.label}</p>
            </motion.div>
          </motion.div>
        </ParallaxSection>

        <ParallaxSection
          className="section form-section surface-card"
          id="lead-form"
          direction={1}
          intensity={16}
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
            <div className="form-field">
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
            </div>

            <div className="form-field">
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
            </div>

            <div className="form-field">
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
            </div>

            <div className="form-field">
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
            </div>

            <div className="form-field">
              <label htmlFor="socialHandle">Social Handle</label>
              <input
                id="socialHandle"
                name="socialHandle"
                type="text"
                autoComplete="off"
                value={formData.socialHandle}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
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
            </div>

            <button type="submit" className="btn btn-primary full-width">
              {status.type === "loading" ? "Submitting..." : "Request My Invite"}
            </button>

            {status.type !== "idle" ? (
              <p className={`status-message status-${status.type}`} role="status">
                {status.message}
              </p>
            ) : null}
          </motion.form>
        </ParallaxSection>

      </main>
    </div>
  );
}
