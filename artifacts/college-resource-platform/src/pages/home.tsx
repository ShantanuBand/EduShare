import { useState, useEffect } from "react";
import { useListResources, useListCategories, useListColleges } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resource-card";
import { Button, Select } from "@/components/ui-elements";
import { Search, SlidersHorizontal, X, ClipboardList, FileQuestion, Sparkles, Layers, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

const QUICK_SECTIONS = [
  {
    href: "/assignments",
    label: "Assignments",
    desc: "Solutions & submissions",
    icon: ClipboardList,
    bg: "from-orange-400 to-amber-500",
    light: "bg-orange-50 border-orange-100",
    text: "text-orange-600",
  },
  {
    href: "/pyq",
    label: "Previous Year Questions",
    desc: "Past exam papers",
    icon: FileQuestion,
    bg: "from-violet-500 to-indigo-600",
    light: "bg-violet-50 border-violet-100",
    text: "text-violet-600",
  },
  {
    href: "/important-topics",
    label: "Important Topics",
    desc: "High-weightage areas",
    icon: Sparkles,
    bg: "from-emerald-400 to-teal-500",
    light: "bg-emerald-50 border-emerald-100",
    text: "text-emerald-600",
  },
  {
    href: "/papers",
    label: "Semester Papers",
    desc: "Branch & semester wise",
    icon: Layers,
    bg: "from-sky-400 to-blue-600",
    light: "bg-sky-50 border-sky-100",
    text: "text-sky-600",
  },
];

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
    setFilters({ collegeId: "", categoryId: "", branch: "", semester: "", fileType: "", sortBy: "newest" });
    setSearch("");
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== "newest").length + (search ? 1 : 0);

  const FilterPanel = () => (
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
      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="w-full text-sm text-primary font-semibold hover:underline text-center pt-2">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-8 shadow-sm">
        <div className="absolute inset-0 bg-primary/5">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Abstract background"
            className="w-full h-full object-cover opacity-60 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40 backdrop-blur-[2px]" />
        </div>
        <div className="relative z-10 px-5 py-10 sm:px-8 sm:py-16 md:py-24 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-extrabold text-white mb-4 leading-[1.1]">
            Your ultimate college resource library.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-xl font-medium">
            Access notes, past papers, and study materials shared by students.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="search"
                placeholder="Search subjects, topics, or files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-4 rounded-xl border-none shadow-lg focus:ring-4 focus:ring-primary/30 text-base sm:text-lg bg-white placeholder:text-slate-400 outline-none"
              />
            </div>
            <Button
              size="lg"
              className="h-12 sm:h-14 px-5 sm:px-8 shadow-lg shrink-0 relative"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Access Section Cards */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-display font-bold text-lg sm:text-xl text-slate-900">Quick Access</h2>
          <Link href="/papers">
            <span className="text-xs sm:text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {QUICK_SECTIONS.map(section => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <div className={`group relative rounded-xl sm:rounded-2xl border p-4 sm:p-5 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${section.light}`}>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center text-white shadow-sm mb-3`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <p className={`font-display font-bold text-sm sm:text-base leading-tight mb-0.5 ${section.text}`}>{section.label}</p>
                  <p className="text-xs text-slate-500 leading-snug">{section.desc}</p>
                  <ArrowRight className={`absolute bottom-4 right-4 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${section.text}`} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-5 shadow-2xl lg:hidden max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  Filters
                </h3>
                <button onClick={() => setShowFilters(false)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterPanel />
              <div className="pt-4 pb-2">
                <Button className="w-full h-12" onClick={() => setShowFilters(false)}>
                  Show {resourcesData?.total || 0} results
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
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
            <FilterPanel />
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1 w-full min-w-0">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              {isLoading ? "Loading..." : `${resourcesData?.total || 0} resources`}
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <ResourceCardSkeleton key={i} />)}
            </div>
          ) : resourcesData?.resources.length === 0 ? (
            <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 sm:w-10 sm:h-10 text-primary/40" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">No resources found</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6 px-4 text-sm sm:text-base">
                Try adjusting your search or filters.
              </p>
              <Button onClick={clearFilters} variant="outline">Clear all filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
