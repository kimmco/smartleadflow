"use client";

import { FormEvent, useState } from "react";

export function LeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setResult(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      location: formData.get("location"),
      propertyType: formData.get("propertyType"),
      monthlyElectricityBill: Number(
        formData.get("monthlyElectricityBill")
      ),
      backupRequired: formData.get("backupRequired") === "true",
      preferredInstallationDate:
        formData.get("preferredInstallationDate") || undefined,
      source: "website",
      consent: formData.get("consent") === "on",
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult(data.error ?? "Something went wrong.");
        return;
      }

      setResult(
        `Success! Lead score: ${data.assessment.leadScore}, Priority: ${data.assessment.priority}`
      );

      form.reset();
    } catch {
      setResult("Unable to submit the form.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          required
          className="w-full rounded border p-2"
        />
      </div>

      <div>
        <label htmlFor="lastName">Last Name</label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          className="w-full rounded border p-2"
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded border p-2"
        />
      </div>

      <div>
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          className="w-full rounded border p-2"
        />
      </div>

      <div>
        <label htmlFor="location">Location</label>
        <input
          id="location"
          name="location"
          type="text"
          required
          className="w-full rounded border p-2"
        />
      </div>

      <div>
        <label htmlFor="propertyType">Property Type</label>
        <select
          id="propertyType"
          name="propertyType"
          required
          className="w-full rounded border p-2"
          defaultValue=""
        >
          <option value="" disabled>
            Select property type
          </option>
          <option value="RESIDENTIAL">Residential</option>
          <option value="COMMERCIAL">Commercial</option>
        </select>
      </div>

      <div>
        <label htmlFor="monthlyElectricityBill">
          Monthly Electricity Bill (KES)
        </label>

        <input
          id="monthlyElectricityBill"
          name="monthlyElectricityBill"
          type="number"
          min="1"
          required
          className="w-full rounded border p-2"
        />
      </div>

      <div>
        <p>Do you need backup power?</p>

        <label className="mr-4">
          <input
            type="radio"
            name="backupRequired"
            value="true"
            required
          />{" "}
          Yes
        </label>

        <label>
          <input
            type="radio"
            name="backupRequired"
            value="false"
          />{" "}
          No
        </label>
      </div>

      <div>
        <label htmlFor="preferredInstallationDate">
          Preferred Installation Date
        </label>

        <input
          id="preferredInstallationDate"
          name="preferredInstallationDate"
          type="date"
          className="w-full rounded border p-2"
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            name="consent"
            required
          />{" "}
          I agree to be contacted about my solar assessment.
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Get My Solar Assessment"}
      </button>

      {result && (
        <div className="rounded border p-4">
          {result}
        </div>
      )}
    </form>
  );
}