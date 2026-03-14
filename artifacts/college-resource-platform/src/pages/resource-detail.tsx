import { useParams, Link } from "wouter";
import { useState } from "react";
import { useGetResource, useIncrementDownload, useAddBookmark, useRemoveBookmark, useCreateComment, useDeleteComment, useRateResource, getGetResourceQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Button, Badge, Input } from "@/components/ui-elements";
import { formatBytes, getFileIconColor } from "@/lib/utils";
import { Download, Bookmark, Star, ArrowLeft, FileText, User, Calendar, Eye, MessageSquare, Trash2, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function ResourceDetail() {
  const { id } = useParams();
  const resourceId = Number(id);
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [ratingHover, setRatingHover] = useState(0);

  const { data: resource, isLoading } = useGetResource(resourceId, { query: { enabled: !!resourceId } });

  const { mutate: addBookmark } = useAddBookmark({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetResourceQueryKey(resourceId) }) }
  });
  const { mutate: removeBookmark } = useRemoveBookmark({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetResourceQueryKey(resourceId) }) }
  });
  const { mutate: incrementDownload } = useIncrementDownload({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetResourceQueryKey(resourceId) }) }
  });
  const { mutate: createComment, isPending: isCommenting } = useCreateComment({
    mutation: {
      onSuccess: () => {
        setCommentText("");
        queryClient.invalidateQueries({ queryKey: getGetResourceQueryKey(resourceId) });
        toast({ title: "Comment added" });
      }
    }
  });
  const { mutate: deleteComment } = useDeleteComment({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetResourceQueryKey(resourceId) }) }
  });
  const { mutate: rateResource } = useRateResource({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetResourceQueryKey(resourceId) });
        toast({ title: "Rating submitted" });
      }
    }
  });

  if (isLoading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div></Layout>;
  if (!resource) return <Layout><div className="text-center py-20">Resource not found</div></Layout>;

  const handleDownload = () => {
    incrementDownload({ id: resourceId });
    window.open(resource.fileUrl, '_blank');
  };

  const handleBookmark = () => {
    if (!isAuthenticated) return toast({ title: "Login required", variant: "destructive" });
    if (resource.isBookmarked) removeBookmark({ resourceId });
    else addBookmark({ resourceId });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return toast({ title: "Login required", variant: "destructive" });
    if (!commentText.trim()) return;
    createComment({ id: resourceId, data: { content: commentText } });
  };

  const handleRate = (stars: number) => {
    if (!isAuthenticated) return toast({ title: "Login required", variant: "destructive" });
    rateResource({ id: resourceId, data: { rating: stars } });
  };

  return (
    <Layout>
      <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Browse
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 border-none shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-[100px] -z-10"></div>
            
            <div className="flex items-start justify-between mb-6">
              <Badge className={`px-3 py-1 ${getFileIconColor(resource.fileType)} text-sm`}>
                <FileText className="w-4 h-4 mr-2" />
                {resource.fileType} • {formatBytes(resource.fileSize)}
              </Badge>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="rounded-full" onClick={handleBookmark}>
                  <Bookmark className="w-5 h-5" fill={resource.isBookmarked ? "currentColor" : "none"} />
                </Button>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900 mb-4 leading-tight">
              {resource.title}
            </h1>
            
            <p className="text-lg text-slate-600 mb-8 whitespace-pre-wrap leading-relaxed">
              {resource.description}
            </p>

            <div className="flex flex-wrap gap-6 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl mb-8 border border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="font-semibold text-slate-900">{resource.uploaderName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{format(new Date(resource.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span>{resource.viewCount} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                <span>{resource.downloadCount} downloads</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {resource.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                  #{tag}
                </Badge>
              ))}
            </div>

            <Button size="lg" className="w-full md:w-auto h-14 px-8 text-lg" onClick={handleDownload}>
              <Download className="w-5 h-5 mr-2" />
              Download Resource
            </Button>
          </Card>

          {/* Comments Section */}
          <Card className="p-8 border-none shadow-md shadow-slate-200/40">
            <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Comments ({resource.comments?.length || 0})
            </h3>
            
            {isAuthenticated ? (
              <form onSubmit={handleComment} className="flex gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 mt-1">
                  {user?.name?.charAt(0)}
                </div>
                <div className="flex-1 flex gap-2">
                  <Input 
                    placeholder="Add a comment..." 
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!commentText.trim()} isLoading={isCommenting}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl mb-8 text-center border border-slate-100 text-slate-500">
                Please <Link href="/login" className="text-primary hover:underline font-semibold">log in</Link> to join the discussion.
              </div>
            )}

            <div className="space-y-6">
              {resource.comments?.map(comment => (
                <div key={comment.id} className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold shrink-0">
                    {comment.userName.charAt(0)}
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-slate-900">{comment.userName}</span>
                      <span className="text-xs text-slate-400">{format(new Date(comment.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <p className="text-slate-600">{comment.content}</p>
                    
                    {user?.id === comment.userId && (
                      <button 
                        onClick={() => deleteComment({ id: comment.id })}
                        className="text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex items-center gap-1 hover:underline"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {resource.comments?.length === 0 && (
                <p className="text-center text-slate-400 py-4">No comments yet. Be the first to share your thoughts!</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          {/* Rating Card */}
          <Card className="p-6 border-none shadow-md bg-gradient-to-br from-primary to-accent text-white">
            <h3 className="font-display font-bold text-xl mb-4 text-center">Rate this resource</h3>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setRatingHover(star)}
                  onMouseLeave={() => setRatingHover(0)}
                  onClick={() => handleRate(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className="w-8 h-8 transition-colors" 
                    fill={(ratingHover || resource.userRating || 0) >= star ? "#fbbf24" : "rgba(255,255,255,0.2)"} 
                    color={(ratingHover || resource.userRating || 0) >= star ? "#fbbf24" : "rgba(255,255,255,0.4)"}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-white/80 text-sm mt-4">
              {resource.averageRating ? `Average: ${resource.averageRating.toFixed(1)}/5 (${resource.ratingCount} ratings)` : "No ratings yet"}
            </p>
          </Card>

          {/* Details Card */}
          <Card className="p-6 border-none shadow-md">
            <h3 className="font-display font-bold text-lg mb-4 border-b pb-2">Details</h3>
            <dl className="space-y-4 text-sm">
              {resource.subject && (
                <div className="grid grid-cols-3">
                  <dt className="text-slate-500 font-medium">Subject</dt>
                  <dd className="col-span-2 font-semibold text-slate-900">{resource.subject}</dd>
                </div>
              )}
              {resource.branch && (
                <div className="grid grid-cols-3">
                  <dt className="text-slate-500 font-medium">Branch</dt>
                  <dd className="col-span-2 font-semibold text-slate-900">{resource.branch}</dd>
                </div>
              )}
              {resource.semester && (
                <div className="grid grid-cols-3">
                  <dt className="text-slate-500 font-medium">Semester</dt>
                  <dd className="col-span-2 font-semibold text-slate-900">Sem {resource.semester}</dd>
                </div>
              )}
              {resource.collegeName && (
                <div className="grid grid-cols-3">
                  <dt className="text-slate-500 font-medium">College</dt>
                  <dd className="col-span-2 font-semibold text-slate-900">{resource.collegeName}</dd>
                </div>
              )}
              {resource.categoryName && (
                <div className="grid grid-cols-3">
                  <dt className="text-slate-500 font-medium">Category</dt>
                  <dd className="col-span-2 font-semibold text-slate-900">{resource.categoryName}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
