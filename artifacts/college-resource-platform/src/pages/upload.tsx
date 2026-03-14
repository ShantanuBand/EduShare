import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateResource, useListCategories, useListColleges, getListResourcesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, Input, Button, Label, Select } from "@/components/ui-elements";
import { Upload as UploadIcon, FileUp, Link as LinkIcon, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const uploadSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  fileType: z.string().min(1, "File type is required"),
  fileUrl: z.string().url("Must be a valid URL"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.coerce.number().min(1, "File size is required"),
  subject: z.string().optional(),
  branch: z.string().optional(),
  semester: z.coerce.number().optional(),
  categoryId: z.coerce.number().optional(),
  collegeId: z.coerce.number().optional(),
  tags: z.string().optional(),
});

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  
  const { data: categories } = useListCategories();
  const { data: colleges } = useListColleges();

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      fileSize: 1024 * 1024 * 2.5, // Fake default 2.5MB
      fileType: "PDF"
    }
  });

  const { mutate: createResource, isPending } = useCreateResource({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
        toast({ title: "Resource uploaded successfully!" });
        setLocation(`/resource/${data.id}`);
      },
      onError: (err) => {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      }
    }
  });

  const onSubmit = (data: z.infer<typeof uploadSchema>) => {
    createResource({
      data: {
        ...data,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
      }
    });
  };

  if (!isAuthenticated) {
    return <Layout><div className="text-center py-20">Please log in to upload resources.</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <UploadIcon className="w-6 h-6" />
            </div>
            Upload Resource
          </h1>
          <p className="text-muted-foreground mt-2">Share your knowledge and help your peers succeed.</p>
        </div>

        <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* File Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">1. File Details</h3>
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">For this demo platform, provide a direct URL to a file instead of a physical upload. The file size is mocked automatically.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-full">
                  <Label>File URL</Label>
                  <Input icon={<LinkIcon className="w-4 h-4" />} placeholder="https://example.com/file.pdf" {...form.register("fileUrl")} />
                  {form.formState.errors.fileUrl && <p className="text-sm text-destructive">{form.formState.errors.fileUrl.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Display File Name</Label>
                  <Input icon={<FileUp className="w-4 h-4" />} placeholder="machine_learning_notes.pdf" {...form.register("fileName")} />
                  {form.formState.errors.fileName && <p className="text-sm text-destructive">{form.formState.errors.fileName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>File Type</Label>
                  <Select {...form.register("fileType")}>
                    <option value="PDF">PDF Document</option>
                    <option value="PPT">PowerPoint</option>
                    <option value="DOC">Word Document</option>
                    <option value="IMAGE">Image / Scan</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">2. Resource Information</h3>
              
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="E.g., Complete OS Notes Semester 4" {...form.register("title")} />
                {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <textarea 
                  className="flex w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all min-h-[100px]"
                  placeholder="Describe what's in this resource..."
                  {...form.register("description")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input placeholder="E.g., Operating Systems" {...form.register("subject")} />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma separated)</Label>
                  <Input placeholder="notes, exams, important" {...form.register("tags")} />
                </div>
              </div>
            </div>

            {/* Academic Classification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">3. Classification</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>College</Label>
                  <Select {...form.register("collegeId")}>
                    <option value="">Any College</option>
                    {colleges?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select {...form.register("categoryId")}>
                    <option value="">Select Category</option>
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input placeholder="Computer Science" {...form.register("branch")} />
                </div>

                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select {...form.register("semester")}>
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </Select>
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full text-lg h-14" isLoading={isPending}>
              Submit Resource
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
