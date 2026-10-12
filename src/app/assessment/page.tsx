import { LeadForm } from "@/components/assessment/LeadForm";

export default function AssessmentPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-4 text-3xl font-bold">
        Get Your Solar Assessment
      </h1>

      <p className="mb-8 text-gray-600">
        Tell us about your property and electricity usage.
      </p>

      <LeadForm />
    </main>
  );
}