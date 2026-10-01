import { ClipboardList } from "lucide-react";
import { SectionPage } from "./section-page.jsx";

export default function AssignmentsPage() {
  return (
    <SectionPage
      title="Assignments"
      subtitle="Browse assignment solutions, question papers and submissions shared by students across all branches and semesters."
      icon={ClipboardList}
      categoryId={3}
      accentClass="bg-orange-100 text-orange-700"
      bgClass="bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-200"
    />
  );
}
