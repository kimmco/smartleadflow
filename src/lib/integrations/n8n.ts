
import type { LeadInput } from "@/lib/validation/lead-schema";
import type { SolarAssessment } from "@/types/lead";

interface N8nLeadPayload {
  event: "lead.created";
  version: "1.0";
  requestId: string;
  timestamp: string;
  data: LeadInput & {
    assessment: SolarAssessment;
  };
}

export interface N8nLeadResult {
  success: boolean;
  status: string;
  requestId: string;
  errorCode?: string;
  retryable?: boolean;
  [key: string]: unknown;
}

export class N8nIntegrationError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errorCode?: string
  ) {
    super(message);
    this.name = "N8nIntegrationError";
  }
}

const WEBHOOK_TIMEOUT_MS = 20_000;

const VALIDATION_ERROR_CODES = new Set([
  "INVALID_EMAIL",
  "PAYLOAD_INVALID",
]);

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function parseN8nResponse(
  result: unknown,
  expectedRequestId: string
): N8nLeadResult {
  if (!isRecord(result)) {
    throw new N8nIntegrationError(
      502,
      "n8n returned an invalid response"
    );
  }

  if (
    typeof result.success !== "boolean" ||
    typeof result.status !== "string"
  ) {
    throw new N8nIntegrationError(
      502,
      "n8n response is missing required fields"
    );
  }

  if (result.requestId !== expectedRequestId) {
    throw new N8nIntegrationError(
      502,
      "n8n response requestId mismatch"
    );
  }

  return {
    ...result,
    success: result.success,
    status: result.status,
    requestId: expectedRequestId,
    errorCode:
      typeof result.errorCode === "string"
        ? result.errorCode
        : undefined,
    retryable:
      typeof result.retryable === "boolean"
        ? result.retryable
        : undefined,
  };
}

export async function sendLeadToN8n(
  requestId: string,
  lead: LeadInput,
  assessment: SolarAssessment
): Promise<N8nLeadResult> {
  const webhookUrl = process.env.N8N_LEAD_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    throw new N8nIntegrationError(
      503,
      "n8n integration is not configured"
    );
  }

  const payload: N8nLeadPayload = {
    event: "lead.created",
    version: "1.0",
    requestId,
    timestamp: new Date().toISOString(),
    data: {
      ...lead,
      assessment,
    },
  };

  let response: Response;

  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": webhookSecret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new N8nIntegrationError(
      503,
      "Unable to reach n8n webhook"
    );
  }

  let result: unknown;

  try {
    result = await response.json();
  } catch {
    throw new N8nIntegrationError(
      502,
      "n8n returned invalid JSON"
    );
  }

  // A controlled validation failure is the only
  // non-2xx response accepted as an application outcome.
  if (response.status === 422) {
    const data = parseN8nResponse(result, requestId);

    const isControlledValidationFailure =
      data.success === false &&
      data.status.toUpperCase() === "DEAD" &&
      data.retryable === false &&
      typeof data.errorCode === "string" &&
      VALIDATION_ERROR_CODES.has(data.errorCode);

    if (!isControlledValidationFailure) {
      throw new N8nIntegrationError(
        502,
        "n8n returned an unexpected HTTP 422 response"
      );
    }

    return data;
  }

  if (!response.ok) {
    throw new N8nIntegrationError(
      response.status === 429 ||
      response.status >= 500
        ? 503
        : 502,
      `n8n returned HTTP ${response.status}`
    );
  }

  return parseN8nResponse(result, requestId);
}
