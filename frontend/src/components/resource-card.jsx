import { Link } from "wouter";
import { Download, Star, Bookmark, FileText, User, ThumbsUp, CheckCircle2 } from "lucide-react";
import { Card, Badge } from "./ui-elements.jsx";
import { getFileIconColor } from "@/lib/utils";
import {
  useAddBookmark,
  useRemoveBookmark,
  getListResourcesQueryKey,
  getListBookmarksQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function ResourceCard({ resource }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: addBookmark } = useAddBookmark({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
        toast({
          title: "Bookmarked",
          description: "Resource added to your bookmarks.",
        });
      },
    },
  });

  const { mutate: removeBookmark } = useRemoveBookmark({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
        toast({
          title: "Removed",
          description: "Resource removed from your bookmarks.",
        });
      },
    },
  });

  const toggleBookmark = (e) => {
    e.preventDefault();
    if (!isAuthenticated)
      return toast({
        title: "Login required",
        description: "Please log in to bookmark resources.",
        variant: "destructive",
      });
    if (resource.isBookmarked) {
      removeBookmark({ resourceId: resource.id });
    } else {
      addBookmark({ resourceId: resource.id });
    }
  };

  return (
    <Link href={`/resource/${resource.id}`}>
      <Card className="group h-full flex flex-col hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white cursor-pointer relative">
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <Badge className={getFileIconColor(resource.fileType)}>
              <FileText className="w-3 h-3 mr-1" />
              {resource.fileType}
            </Badge>
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-full transition-colors ${resource.isBookmarked ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"}`}
            >
              <Bookmark
                className="w-4 h-4"
                fill={resource.isBookmarked ? "currentColor" : "none"}
              />
            </button>
          </div>

          <h3 className="font-display font-bold text-lg leading-tight mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {resource.title}
          </h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {resource.subject && (
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-600"
              >
                {resource.subject}
              </Badge>
            )}
            {resource.semester && (
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-600"
              >
                Sem {resource.semester}
              </Badge>
            )}
            {resource.branch && (
              <Badge
                variant="outline"
                className="border-slate-200 text-slate-500"
              >
                {resource.branch}
              </Badge>
            )}
            {resource.examType && (
              <Badge variant="outline" className="border-indigo-200 text-indigo-600 bg-indigo-50">
                {resource.examType}
              </Badge>
            )}
            {resource.academicYear && (
              <Badge variant="outline" className="border-slate-200 text-slate-500">
                {resource.academicYear}
              </Badge>
            )}
            {resource.status === 'approved' && (
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-200 ml-auto">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {resource.description || "No description provided."}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50 overflow-hidden">
            <div className="flex items-center gap-1 shrink-0">
              <User className="w-3.5 h-3.5" />
              <span className="truncate max-w-[80px]">
                {resource.uploaderName}
              </span>
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-300 mx-0.5 shrink-0"></span>
            <div className="flex items-center gap-1 shrink-0">
              <Star
                className="w-3.5 h-3.5 text-amber-400"
                fill="currentColor"
              />
              <span>
                {resource.averageRating
                  ? resource.averageRating.toFixed(1)
                  : "New"}
              </span>
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-300 mx-0.5 shrink-0"></span>
            <div className="flex items-center gap-1 shrink-0">
              <Download className="w-3.5 h-3.5" />
              <span>{resource.downloadCount}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-300 mx-0.5 shrink-0"></span>
            <div className="flex items-center gap-1 shrink-0">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{resource.likesCount || 0}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function ResourceCardSkeleton() {
  return (
    <Card className="h-[280px] p-5 flex flex-col animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
        <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
      </div>
      <div className="w-3/4 h-6 bg-slate-200 rounded mb-2"></div>
      <div className="w-1/2 h-6 bg-slate-200 rounded mb-4"></div>
      <div className="flex gap-2 mb-4">
        <div className="w-16 h-5 bg-slate-100 rounded"></div>
        <div className="w-16 h-5 bg-slate-100 rounded"></div>
      </div>
      <div className="w-full h-10 bg-slate-100 rounded mb-4 mt-auto"></div>
      <div className="w-full h-4 bg-slate-200 rounded mt-auto pt-4 border-t"></div>
    </Card>
  );
}
