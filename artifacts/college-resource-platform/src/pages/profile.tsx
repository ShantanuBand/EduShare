import { useGetUserProfile, useGetUserResources } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resource-card";
import { Card, Badge } from "@/components/ui-elements";
import { User, Mail, GraduationCap, Building2, BookUp, Download, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  // using 0 as a fallback if undefined because hooks require a number, but we enable only when profile is loaded
  const { data: resources, isLoading: resourcesLoading } = useGetUserResources(profile?.id || 0, {
    query: { enabled: !!profile?.id }
  });

  if (profileLoading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div></Layout>;
  if (!profile) return <Layout><div className="text-center py-20">Profile not found.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Profile Header */}
        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden relative">
          <div className="h-32 bg-gradient-to-r from-primary to-accent"></div>
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12 mb-6">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg shrink-0">
                <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-4xl font-display font-bold text-primary">
                  {profile.name.charAt(0)}
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-display font-bold text-slate-900">{profile.name}</h1>
                <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Mail className="w-4 h-4" /> {profile.email}
                </p>
              </div>
              <Badge variant="outline" className="bg-white px-3 py-1 font-mono text-xs shadow-sm uppercase tracking-wider">
                {profile.role}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Building2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">College</p>
                  <p className="text-sm font-medium text-slate-900">{profile.collegeName || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <GraduationCap className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Branch/Sem</p>
                  <p className="text-sm font-medium text-slate-900">
                    {profile.branch || 'N/A'} {profile.semester ? `• Sem ${profile.semester}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <BookUp className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Uploads</p>
                  <p className="text-sm font-medium text-slate-900">{profile.uploadCount} Resources</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Joined</p>
                  <p className="text-sm font-medium text-slate-900">{format(new Date(profile.createdAt), 'MMM yyyy')}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* User's Uploads */}
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <BookUp className="w-6 h-6 text-primary" />
            Your Uploads
          </h2>
          
          {resourcesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1,2,3].map(i => <ResourceCardSkeleton key={i} />)}
            </div>
          ) : resources?.length === 0 ? (
             <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
               <p className="text-slate-500">You haven't uploaded any resources yet.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {resources?.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
