import { useState, useEffect } from "react";
import { useListResources, useListCategories, useListColleges } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resource-card";
import { Input, Button, Select, Badge } from "@/components/ui-elements";
import { Search, Filter, SlidersHorizontal, BookOpen, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    collegeId: "",
    categoryId: "",
    branch: "",
    semester: "",
    fileType: "",
    sortBy: "newest" as const
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: resourcesData, isLoading } = useListResources({
    page: 1,
    limit: 20,
    search: debouncedSearch || undefined,
    collegeId: filters.collegeId ? Number(filters.collegeId) : undefined,
    categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
    branch: filters.branch || undefined,
    semester: filters.semester ? Number(filters.semester) : undefined,
    fileType: filters.fileType || undefined,
    sortBy: filters.sortBy
  });

  const { data: categories } = useListCategories();
  const { data: colleges } = useListColleges();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      collegeId: "",
      categoryId: "",
      branch: "",
      semester: "",
      fileType: "",
      sortBy: "newest"
    });
    setSearch("");
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== "newest").length + (search ? 1 : 0);

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-8 shadow-sm">
        <div className="absolute inset-0 bg-primary/5">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Abstract background" 
            className="w-full h-full object-cover opacity-60 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40 backdrop-blur-[2px]"></div>
        </div>
        <div className="relative z-10 px-8 py-16 md:py-24 max-w-3xl">
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md mb-6 py-1.5 px-4 text-sm hover:bg-white/30">
            📚 Discover & Share Knowledge
          </Badge>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-6 leading-[1.1]">
            Your ultimate college resource library.
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl font-medium">
            Access thousands of notes, past papers, and study materials shared by students across universities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search subjects, topics, or file names..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-xl border-none shadow-lg focus:ring-4 focus:ring-primary/30 text-lg bg-white placeholder:text-slate-400"
              />
            </div>
            <Button size="lg" className="h-14 px-8 shadow-lg shrink-0" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-5 h-5 mr-2" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Filters Sidebar */}
        <AnimatePresence>
          {(showFilters || window.innerWidth >= 1024) && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 overflow-hidden"
            >
              <div className="bg-white rounded-2xl border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                    Filters
                  </h3>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-primary font-semibold hover:underline">
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Sort By</label>
                    <Select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
                      <option value="newest">Newest First</option>
                      <option value="popular">Most Popular</option>
                      <option value="mostDownloaded">Most Downloaded</option>
                      <option value="topRated">Top Rated</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">College</label>
                    <Select value={filters.collegeId} onChange={(e) => handleFilterChange('collegeId', e.target.value)}>
                      <option value="">All Colleges</option>
                      {colleges?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Category</label>
                    <Select value={filters.categoryId} onChange={(e) => handleFilterChange('categoryId', e.target.value)}>
                      <option value="">All Categories</option>
                      {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Semester</label>
                      <Select value={filters.semester} onChange={(e) => handleFilterChange('semester', e.target.value)}>
                        <option value="">All</option>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">File Type</label>
                      <Select value={filters.fileType} onChange={(e) => handleFilterChange('fileType', e.target.value)}>
                        <option value="">All</option>
                        <option value="PDF">PDF</option>
                        <option value="PPT">PPT</option>
                        <option value="DOC">DOC</option>
                        <option value="IMAGE">Image</option>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="flex-1 w-full min-w-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              {isLoading ? "Loading resources..." : `Found ${resourcesData?.total || 0} resources`}
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <ResourceCardSkeleton key={i} />)}
            </div>
          ) : resourcesData?.resources.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No resources found</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">We couldn't find anything matching your current filters. Try tweaking them or searching for something else.</p>
              <Button onClick={clearFilters} variant="outline">Clear all filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {resourcesData?.resources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
