import { useState } from "react";
import { useGetAdminStats, useAdminListUsers, useAdminListResources, useUpdateResourceStatus, useUpdateUserStatus, getAdminListResourcesQueryKey, getGetAdminStatsQueryKey, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, Badge, Button } from "@/components/ui-elements";
import { Users, FileText, Download, Building, CheckCircle, XCircle, ShieldAlert, Ban, Unlock } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'stats' | 'resources' | 'users'>('stats');

  const { data: stats } = useGetAdminStats({ query: { enabled: isAdmin } });
  const { data: resourcesResponse } = useAdminListResources({ status: 'pending' }, { query: { enabled: isAdmin && activeTab === 'resources' } });
  const { data: usersResponse } = useAdminListUsers({}, { query: { enabled: isAdmin && activeTab === 'users' } });

  const { mutate: updateResourceStatus } = useUpdateResourceStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListResourcesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        toast({ title: "Status updated" });
      }
    }
  });

  const { mutate: updateUserStatus } = useUpdateUserStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        toast({ title: "User status updated" });
      }
    }
  });

  if (!isAdmin) return <Redirect to="/" />;

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Manage platform resources and users.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <Button variant={activeTab === 'stats' ? 'default' : 'outline'} onClick={() => setActiveTab('stats')}>Overview</Button>
        <Button variant={activeTab === 'resources' ? 'default' : 'outline'} onClick={() => setActiveTab('resources')}>
          Pending Approvals 
          {stats?.pendingResources ? <Badge variant="secondary" className="ml-2 bg-white/20 text-current">{stats.pendingResources}</Badge> : null}
        </Button>
        <Button variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')}>Users</Button>
      </div>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Users" value={stats?.totalUsers} icon={<Users className="w-6 h-6 text-blue-500" />} />
          <StatCard title="Total Resources" value={stats?.totalResources} icon={<FileText className="w-6 h-6 text-indigo-500" />} />
          <StatCard title="Downloads" value={stats?.totalDownloads} icon={<Download className="w-6 h-6 text-emerald-500" />} />
          <StatCard title="Colleges" value={stats?.totalColleges} icon={<Building className="w-6 h-6 text-purple-500" />} />
          <StatCard title="Pending Approvals" value={stats?.pendingResources} icon={<ShieldAlert className="w-6 h-6 text-red-500" />} highlight />
        </div>
      )}

      {activeTab === 'resources' && (
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="p-6 border-b bg-slate-50/50">
            <h2 className="font-display font-bold text-lg">Resources Awaiting Approval</h2>
          </div>
          <div className="divide-y">
            {resourcesResponse?.resources.map(resource => (
              <div key={resource.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{resource.title}</h3>
                    <Badge variant="secondary">{resource.fileType}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-1 mb-2">{resource.description}</p>
                  <div className="text-xs text-slate-500 flex gap-4">
                    <span>Uploaded by: {resource.uploaderName}</span>
                    <span>Date: {format(new Date(resource.createdAt), 'MMM d, yyyy')}</span>
                    <a href={resource.fileUrl} target="_blank" className="text-primary hover:underline">View File</a>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50" onClick={() => updateResourceStatus({ id: resource.id, data: { status: 'approved' } })}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => updateResourceStatus({ id: resource.id, data: { status: 'rejected', reason: 'Violation of guidelines' } })}>
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              </div>
            ))}
            {resourcesResponse?.resources.length === 0 && (
              <div className="p-12 text-center text-slate-500">No resources pending approval. All caught up!</div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="uppercase tracking-wider border-b bg-slate-50/50 text-slate-500 font-semibold text-xs">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">College</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {usersResponse?.users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4"><Badge variant="outline">{user.role}</Badge></td>
                    <td className="px-6 py-4 text-slate-600">{user.collegeName || '-'}</td>
                    <td className="px-6 py-4">
                      {user.isBlocked ? <Badge variant="destructive">Blocked</Badge> : <Badge variant="success">Active</Badge>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'admin' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={user.isBlocked ? "text-green-600" : "text-red-600"}
                          onClick={() => updateUserStatus({ id: user.id, data: { isBlocked: !user.isBlocked } })}
                        >
                          {user.isBlocked ? <Unlock className="w-4 h-4 mr-2"/> : <Ban className="w-4 h-4 mr-2"/>}
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Layout>
  );
}

function StatCard({ title, value = 0, icon, highlight }: { title: string, value?: number, icon: React.ReactNode, highlight?: boolean }) {
  return (
    <Card className={`p-6 border-none shadow-md flex items-center gap-4 ${highlight ? 'bg-red-50/50 border border-red-100' : ''}`}>
      <div className={`p-4 rounded-2xl ${highlight ? 'bg-red-100' : 'bg-slate-100'}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-display font-bold text-slate-900">{value}</p>
      </div>
    </Card>
  );
}
