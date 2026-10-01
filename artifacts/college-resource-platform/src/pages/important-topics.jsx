import { Sparkles } from "lucide-react";
import { SectionPage } from "./section-page.jsx";

export default function ImportantTopicsPage() {
  return (
    <SectionPage
      title="Important Topics"
      subtitle="Curated lists of high-weightage topics, must-read concepts, and frequently asked areas shared by toppers and faculty."
      icon={Sparkles}
      categoryId={6}
      accentClass="bg-emerald-100 text-emerald-700"
      bgClass="bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200"
    />
  );
}
