
import { NextResponse } from "next/server";

import { leadSchema } from "@/lib/validation/lead-schema";
import { calculateSolarAssessment } from "@/lib/solar/calculator";
import {
  sendLeadToN8n,
  N8nIntegrationError,
} from "@/lib/integrations/n8n";

export async function POST(request: Request) {
  let requestId: string | undefined;

  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid lead data",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const lead = result.data;
    const assessment = calculateSolarAssessment(lead);

    requestId = crypto.randomUUID();

    const workflowResult = await sendLeadToN8n(
      requestId,
      lead,
      assessment
    );

    const status = workflowResult.status.toUpperCase();

    if (
      workflowResult.requestId &&
      workflowResult.requestId !== requestId
    ) {
      throw new N8nIntegrationError(
        502,
        "n8n response requestId mismatch"
      );
    }

    if (
      status === "COMPLETED" &&
      workflowResult.success === true
    ) {
      console.info("Lead processed", {
        requestId,
        status,
      });

      return NextResponse.json({
        success: true,
        requestId,
        status,
        assessment,
      });
    }

    if (status === "PROCESSING") {
      return NextResponse.json(
        {
          success: false,
          requestId,
          status: "PROCESSING",
          message: "Lead processing is in progress",
        },
        { status: 202 }
      );
    }

    console.error("Lead processing incomplete", {
      requestId,
      status,
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        status,
        error: "Lead processing was not completed",
      },
      { status: 502 }
    );
  } catch (error) {
    const statusCode =
      error instanceof N8nIntegrationError
        ? error.statusCode
        : 500;

    console.error("Lead submission failed", {
      requestId,
      statusCode,
      errorType:
        error instanceof Error
          ? error.name
          : "Unknown",
	  reason:
        error instanceof N8nIntegrationError
        ? error.message
        : "Unexpected application error"
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: "Unable to process lead",
      },
      { status: statusCode }
    );
  }
}
