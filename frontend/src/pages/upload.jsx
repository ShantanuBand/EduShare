import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { MAHARASHTRA_CITIES } from "../lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateResource,
  useListCategories,
  useListColleges,
  getListResourcesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, Input, Button, Label, Select } from "@/components/ui-elements";
import {
  Upload as UploadIcon,
  FileUp,
  Link as LinkIcon,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const uploadSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  fileType: z.string().min(1, "File type is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.coerce.number().min(1, "File size is required"),
  subject: z.string().optional(),
  branch: z.string().optional(),
  semester: z.coerce.number().optional(),
  categoryId: z.coerce.number().optional(),
  collegeId: z.coerce.number().optional(),
  tags: z.string().optional(),
  topic: z.string().optional(),
  academicYear: z.coerce.number().optional(),
  examType: z.string().optional(),
});

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { data: categories } = useListCategories();
  const { data: colleges } = useListColleges();

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");

  const cities = MAHARASHTRA_CITIES;
  const universities = [...new Set(colleges?.filter((c) => c.state?.toLowerCase() === 'maharashtra' && c.city === selectedCity).map((c) => c.university).filter(Boolean))].sort();
  const filteredColleges = colleges?.filter((c) => 
    c.state?.toLowerCase() === 'maharashtra' &&
    (!selectedCity || c.city === selectedCity) && 
    (!selectedUniversity || c.university === selectedUniversity)
  ) || [];

  const form = useForm({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      fileSize: 1024 * 1024 * 2.5, // Fake default 2.5MB
      fileType: "PDF",
    },
  });

  const { mutate: createResource, isPending } = useCreateResource({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
        toast({ title: "Resource uploaded successfully!" });
        setLocation(`/resource/${data.id}`);
      },
      onError: (err) => {
        toast({
          title: "Upload failed",
          description: err.message,
          variant: "destructive",
        });
      },
    },
  });

  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "File size must be under 5MB", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploadingFile(true);
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
        // Using credentials to ensure auth token is sent if needed
        credentials: "include"
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      form.setValue("fileUrl", data.url);
      form.setValue("fileName", data.fileName);
      form.setValue("fileSize", data.fileSize);
      
      // Auto-detect file type
      const mime = data.fileType.toLowerCase();
      if (mime.includes("pdf")) form.setValue("fileType", "PDF");
      else if (mime.includes("powerpoint") || mime.includes("presentation")) form.setValue("fileType", "PPT");
      else if (mime.includes("word") || mime.includes("document")) form.setValue("fileType", "DOC");
      else if (mime.includes("image")) form.setValue("fileType", "IMAGE");
      
      toast({ title: "File attached successfully!" });
    } catch (err) {
      toast({ title: "Failed to upload file", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const onSubmit = (data) => {
    createResource({
      data: {
        ...data,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="text-center py-20">
          Please log in to upload resources.
        </div>
      </Layout>
    );
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
          <p className="text-muted-foreground mt-2">
            Share your knowledge and help your peers succeed.
          </p>
        </div>

        <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* File Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                1. File Details
              </h3>
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">
                  For this demo platform, provide a direct URL to a file instead
                  of a physical upload. The file size is mocked automatically.
                </p>
              </div>

              <div className="space-y-4 bg-primary/5 p-6 rounded-2xl border-2 border-dashed border-primary/20 text-center col-span-full">
                <Label className="text-base font-semibold block mb-2">Upload File Directly</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  For smaller files like IMP questions and semester papers, you can upload directly to the app (Max 5MB).
                </p>
                <div className="flex justify-center">
                  <label className={`cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 ${isUploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isUploadingFile ? 'Uploading...' : 'Select File'}
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploadingFile} />
                  </label>
                </div>
              </div>

              <div className="relative col-span-full my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500 font-semibold">Or provide a link</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-full">
                  <Label>External File URL</Label>
                  <Input
                    icon={<LinkIcon className="w-4 h-4" />}
                    placeholder="https://example.com/file.pdf"
                    {...form.register("fileUrl")}
                  />
                  {form.formState.errors.fileUrl && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.fileUrl.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Display File Name</Label>
                  <Input
                    icon={<FileUp className="w-4 h-4" />}
                    placeholder="machine_learning_notes.pdf"
                    {...form.register("fileName")}
                  />
                  {form.formState.errors.fileName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.fileName.message}
                    </p>
                  )}
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
              <h3 className="text-lg font-semibold border-b pb-2">
                2. Resource Information
              </h3>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="E.g., Complete OS Notes Semester 4"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
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
                  <Input
                    placeholder="E.g., Operating Systems"
                    {...form.register("subject")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma separated)</Label>
                  <Input
                    placeholder="notes, exams, important"
                    {...form.register("tags")}
                  />
                </div>
              </div>
            </div>

            {/* Academic Classification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                3. Classification
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Select 
                    value={selectedCity} 
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setSelectedUniversity("");
                      form.setValue("collegeId", "");
                    }}
                  >
                    <option value="">Select City</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>University</Label>
                  <Select 
                    value={selectedUniversity} 
                    onChange={(e) => {
                      setSelectedUniversity(e.target.value);
                      form.setValue("collegeId", "");
                    }}
                    disabled={!selectedCity}
                  >
                    <option value="">Select University</option>
                    {universities.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>College</Label>
                  <Select {...form.register("collegeId")}>
                    <option value="">Any College</option>
                    {filteredColleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select {...form.register("categoryId")}>
                    <option value="">Select Category</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input
                    placeholder="Computer Science"
                    {...form.register("branch")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select {...form.register("semester")}>
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input
                    placeholder="e.g. Thermodynamics, Data Structures"
                    {...form.register("topic")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Exam Type</Label>
                  <Select {...form.register("examType")}>
                    <option value="">Select Exam Type</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Final">Final</option>
                    <option value="Unit Test">Unit Test</option>
                    <option value="Gate/Competitive">Gate/Competitive</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select {...form.register("academicYear")}>
                    <option value="">Select Year</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg h-14"
              isLoading={isPending}
            >
              Submit Resource
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
