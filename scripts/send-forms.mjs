#!/usr/bin/env node

import { insertLead, listLeads } from "../src/server/lead-storage.js";
import { validateLeadPayload } from "../src/server/lead-validation.js";

const DEFAULT_COUNT = 150;
const COMPANY_NAMES = [
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
  "Cisco",
  "Adobe",
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

function parseArgs(argv) {
  const options = {
    count: DEFAULT_COUNT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--count") {
      const value = Number.parseInt(argv[index + 1] || "", 10);
      if (Number.isInteger(value) && value > 0) {
        options.count = value;
      }
      index += 1;
      continue;
    }

  }

  return options;
}

function buildLead(index) {
  const number = index + 1;
  const roles = ["CEO", "COO", "VP Sales", "Head of Growth", "Founder"];
  const company = COMPANY_NAMES[index % COMPANY_NAMES.length];

  return {
    firstName: `Test${number}`,
    lastName: `Lead${number}`,
    email: `test.lead${number}@example.com`,
    jobTitle: roles[index % roles.length],
    socialHandle: `@testlead${number}`,
    company,
    utm: {
      utm_source: UTM_SOURCES[index % UTM_SOURCES.length],
      utm_medium: UTM_MEDIUMS[index % UTM_MEDIUMS.length],
      utm_campaign: UTM_CAMPAIGNS[index % UTM_CAMPAIGNS.length],
      utm_content: `entry-${number}`,
    },
    submittedAt: new Date().toISOString(),
    landingPath: "/",
    landingHost: "localhost:3000",
  };
}

async function run() {
  const { count } = parseArgs(process.argv.slice(2));

  let created = 0;
  let failed = 0;

  for (let index = 0; index < count; index += 1) {
    const payload = buildLead(index);
    const validationError = validateLeadPayload(payload);

    if (validationError) {
      failed += 1;
      console.error(`Failed form ${index + 1}: ${validationError}`);
      continue;
    }

    try {
      await insertLead(payload);
      created += 1;
    } catch (error) {
      failed += 1;
      console.error(`Failed form ${index + 1}: ${error?.message || "Unknown error"}`);
    }
  }

  const leads = await listLeads();

  console.log(`Sent: ${count}`);
  console.log(`Created: ${created}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total leads currently stored: ${leads.length}`);
  console.log("Storage: postgres");
}

run().catch((error) => {
  console.error("Bulk form sender failed.");
  console.error(error);
  process.exit(1);
});
