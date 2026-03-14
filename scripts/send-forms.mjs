#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createLead, listLeadRequests } from "../src/api/client.js";

const DEFAULT_COUNT = 150;
const DEFAULT_STORAGE_FILE = path.resolve(process.cwd(), "local-data/localStorage.json");
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
    file: DEFAULT_STORAGE_FILE,
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

    if (arg === "--file") {
      const value = argv[index + 1];
      if (value) {
        options.file = path.resolve(process.cwd(), value);
      }
      index += 1;
    }
  }

  return options;
}

function readStore(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function createFileBackedLocalStorage(filePath) {
  let store = readStore(filePath);

  function persist() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf8");
  }

  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? String(store[key]) : null;
    },
    setItem(key, value) {
      store[key] = String(value);
      persist();
    },
    removeItem(key) {
      delete store[key];
      persist();
    },
    clear() {
      store = {};
      persist();
    },
  };
}

function ensureCryptoRandomUuid() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return;
  }

  globalThis.crypto = {
    ...(globalThis.crypto || {}),
    randomUUID,
  };
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
    landingHost: "localhost:5173",
  };
}

async function run() {
  const { count, file } = parseArgs(process.argv.slice(2));

  ensureCryptoRandomUuid();
  globalThis.localStorage = createFileBackedLocalStorage(file);

  let created = 0;
  let failed = 0;

  for (let index = 0; index < count; index += 1) {
    const response = await createLead(buildLead(index));
    if (response.ok) {
      created += 1;
    } else {
      failed += 1;
      const message = response.data?.error || "Unknown error";
      console.error(`Failed form ${index + 1}: ${message}`);
    }
  }

  const listResponse = await listLeadRequests();
  const totalStored = listResponse.ok ? listResponse.data?.leads?.length ?? 0 : "unknown";

  console.log(`Sent: ${count}`);
  console.log(`Created: ${created}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total leads currently stored: ${totalStored}`);
  console.log(`Storage file: ${file}`);
}

run().catch((error) => {
  console.error("Bulk form sender failed.");
  console.error(error);
  process.exit(1);
});
