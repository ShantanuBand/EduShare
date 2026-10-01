import { useListBookmarks } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resource-card";
import { Bookmark, Library } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui-elements";

export default function BookmarksPage() {
  const { data: bookmarks, isLoading } = useListBookmarks();

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Bookmark className="w-6 h-6" />
          </div>
          Your Bookmarks
        </h1>
        <p className="text-muted-foreground mt-2">
          Resources you've saved for quick access.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      ) : bookmarks?.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Library className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            No bookmarks yet
          </h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Save important notes, papers, and files here by clicking the
            bookmark icon on any resource.
          </p>
          <Link href="/">
            <Button size="lg">Explore Resources</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {bookmarks?.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </Layout>
  );
}
