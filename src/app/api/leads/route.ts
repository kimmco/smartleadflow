
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

    const validation = leadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid lead data",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const lead = validation.data;
    const assessment = calculateSolarAssessment(lead);

    requestId = crypto.randomUUID();

    const workflowResult = await sendLeadToN8n(
      requestId,
      lead,
      assessment
    );

    const status = workflowResult.status.toUpperCase();

    // Defense in depth: ensure the response belongs
    // to this exact lead submission.
    if (workflowResult.requestId !== requestId) {
      throw new N8nIntegrationError(
        502,
        "n8n response requestId mismatch"
      );
    }

    // 1. Successful CRM processing
    if (
      status === "COMPLETED" &&
      workflowResult.success === true
    ) {
      console.info("Lead processed", {
        requestId,
        status,
      });

      return NextResponse.json(
        {
          success: true,
          requestId,
          status: "COMPLETED",
          assessment,
        },
        { status: 200 }
      );
    }

    // 2. Lead is still being processed
    if (
      status === "PROCESSING" &&
      workflowResult.success === false
    ) {
      console.info("Lead processing", {
        requestId,
        status,
      });

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

    // 3. Permanent provider validation failure
    const isValidationFailure =
      status === "DEAD" &&
      workflowResult.success === false &&
      workflowResult.retryable === false &&
      (
        workflowResult.errorCode === "INVALID_EMAIL" ||
        workflowResult.errorCode === "PAYLOAD_INVALID"
      );

    if (isValidationFailure) {
      const errorCode = workflowResult.errorCode;

      console.warn("Lead validation rejected", {
        requestId,
        status,
        errorCode,
      });

      const message =
        errorCode === "INVALID_EMAIL"
          ? "The email address could not be accepted. Please use another valid email address."
          : "The submitted lead information could not be accepted. Please review your details.";

      return NextResponse.json(
        {
          success: false,
          requestId,
          status: "DEAD",
          errorCode,
          retryable: false,
          error: message,
        },
        { status: 422 }
      );
    }

    // 4. Other unsuccessful workflow outcomes
    console.error("Lead processing incomplete", {
      requestId,
      status,
      errorCode: workflowResult.errorCode ?? null,
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
          : "Unexpected application error",
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
