import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui-elements";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <Compass className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">
          The page or resource you are looking for doesn't exist or has been
          moved.
        </p>
        <Link href="/">
          <Button size="lg">Return Home</Button>
        </Link>
      </div>
    </Layout>
  );
}
