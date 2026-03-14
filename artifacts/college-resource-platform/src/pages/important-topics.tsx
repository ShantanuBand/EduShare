import { Sparkles } from "lucide-react";
import { SectionPage } from "./section-page";

export default function ImportantTopicsPage() {
  return (
    <SectionPage
      title="Important Topics"
      subtitle="Curated lists of high-weightage topics, must-read concepts, and frequently asked areas shared by toppers and faculty."
      icon={Sparkles}
      categoryId={6}
      accentClass="bg-emerald-100 text-emerald-700"
      bgClass="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100"
    />
  );
}
