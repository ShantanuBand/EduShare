import { FileQuestion } from "lucide-react";
import { SectionPage } from "./section-page.jsx";

export default function PYQPage() {
  return (
    <SectionPage
      title="Previous Year Questions"
      subtitle="Access previous year exam question papers for all branches and semesters. Perfect for exam preparation and understanding question patterns."
      icon={FileQuestion}
      categoryId={2}
      accentClass="bg-violet-100 text-violet-700"
      bgClass="bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-200"
    />
  );
}
