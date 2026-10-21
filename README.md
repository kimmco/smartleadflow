# SmartLeadFlow

**An automated solar lead management and sales follow-up system.**

[Live Demo](https://smartleadflow.vercel.app/assessment)

## Overview

SmartLeadFlow demonstrates an end-to-end lead management workflow for a solar installation business. It connects a Next.js assessment form to n8n Cloud and systeme.io to capture, validate, qualify, route, and track incoming leads.

The project focuses on reliable integrations, idempotent processing, structured error handling, and automated sales follow-up.

## Technology Stack

- **Frontend:** Next.js, React, TypeScript
- **Validation:** Zod
- **Workflow automation:** n8n Cloud
- **CRM:** systeme.io
- **Notifications:** WhatsApp integration
- **Hosting:** Vercel
- **Version control:** Git and GitHub

## Key Features

- Solar assessment and lead intake form
- Server-side request validation
- Lead qualification and priority classification
- Location-based sales routing
- systeme.io contact creation and tagging
- Idempotency and checkpoint-based recovery
- Retryable and permanent error classification
- WhatsApp notification processing and retry workflow
- Sales follow-up SLA tracking and escalation
- Structured API responses and diagnostic logging

## Architecture

```text
Next.js Assessment Form
          |
          v
Next.js API /api/leads
          |
          v
n8n Production Webhook
          |
          v
Validation, Qualification & Routing
          |
          v
Idempotency / Data Table
          |
          v
systeme.io Contact & Tag Integration
          |
          +----> Notification Workflow
          |
          +----> SLA Follow-up Workflow
          |
          v
Structured Webhook Response
          |
          v
Next.js API / Browser
```

## Local Development

```bash
git clone https://github.com/kimmco/smartleadflow.git
cd smartleadflow
npm install
```

Copy `.env.example` to `.env.local` and configure the required n8n production webhook URL and shared secret.

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `N8N_LEAD_WEBHOOK_URL` | n8n production webhook endpoint |
| `N8N_WEBHOOK_SECRET` | Shared secret for authenticated webhook requests |

Never commit `.env.local`, API tokens, webhook secrets, or customer data.

## Lead Processing Outcomes

| Status | Meaning |
|---|---|
| `PROCESSING` | Request is being processed |
| `COMPLETED` | Core CRM processing succeeded |
| `FAILED` | Recoverable integration failure |
| `DEAD` | Permanent failure requiring correction |

Notification and SLA statuses are tracked separately from CRM completion.

## Testing

The project has been tested across Next.js, n8n Cloud, and systeme.io, including successful contact creation, tag assignment, persistence, and response validation.

Additional release checks cover duplicate protection, provider validation failures, notification outcomes, and SLA state consistency.

## Limitations

- The demonstration depends on configured external services and credentials.
- Notification delivery depends on the availability and configuration of the messaging provider.
- CRM completion does not guarantee successful notification delivery.
- The public demo is intended to demonstrate the lead intake and automation architecture.

## Project Purpose

SmartLeadFlow is a portfolio project demonstrating full-stack development, API integration, workflow orchestration, reliability engineering, and deployment practices.
