
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
  requestId?: string;
  [key: string]: unknown;
}

export class N8nIntegrationError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "N8nIntegrationError";
  }
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
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
  } catch {
    throw new N8nIntegrationError(
      503,
      "Unable to reach n8n webhook"
    );
  }

  if (!response.ok) {
    throw new N8nIntegrationError(
      response.status === 429 ? 503 : 502,
      `n8n returned HTTP ${response.status}`
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

  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    throw new N8nIntegrationError(
      502,
      "n8n returned an invalid response"
    );
  }

  const data = result as Record<string, unknown>;
  
  // TEMPORARY DEBUGGING — remove after resolving the issue
  const sanitize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => {
        if (
          /authorization|secret|token|cookie|password|api[-_]?key|email|phone|name|address|url|lead|assessment|body|headers|query|params/i.test(key)
        ) {
          return [key, "[REDACTED]"];
        }

        return [key, sanitize(val)];
      })
    );
  }

  return value;
};

console.info("DEBUG n8n raw result:", sanitize(result));
console.info("DEBUG n8n parsed data:", sanitize(data));

console.info("DEBUG n8n response inspection:", {
isArray: Array.isArray(result),
topLevelKeys: Object.keys(data),
success: data.success,
status: data.status,
bodyType: typeof data.body,
bodyIsArray: Array.isArray(data.body),
executionMode: data.executionMode,
});
  
  
  console.info("n8n webhook response structure", {
  keys: Object.keys(data),
  successType: typeof data.success,
  statusType: typeof data.status,
  hasBody: typeof data.body === "object" && data.body !== null,
});


  if (
    typeof data.success !== "boolean" ||
    typeof data.status !== "string"
  ) {
    throw new N8nIntegrationError(
      502,
      "n8n response is missing required fields"
    );
  }

  return {
    ...data,
    success: data.success,
    status: data.status,
    requestId:
      typeof data.requestId === "string"
        ? data.requestId
        : undefined,
  };
}
