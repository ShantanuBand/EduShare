import { useState, useEffect } from "react";
import {
  useListResources,
  useListCategories,
  useListColleges,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resource-card";
import { Button, Select } from "@/components/ui-elements";
import {
  Search,
  SlidersHorizontal,
  X,
  ClipboardList,
  FileQuestion,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MAHARASHTRA_CITIES } from "../lib/constants";
import { Link } from "wouter";

const QUICK_SECTIONS = [
  {
    href: "/assignments",
    label: "Assignments",
    desc: "Solutions & submissions",
    icon: ClipboardList,
    bg: "from-orange-400 to-amber-500",
    light: "bg-orange-100 border-orange-200",
    text: "text-orange-700",
  },
  {
    href: "/pyq",
    label: "Previous Year Questions",
    desc: "Past exam papers",
    icon: FileQuestion,
    bg: "from-violet-500 to-indigo-600",
    light: "bg-violet-100 border-violet-200",
    text: "text-violet-700",
  },
  {
    href: "/important-topics",
    label: "Important Topics",
    desc: "High-weightage areas",
    icon: Sparkles,
    bg: "from-emerald-400 to-teal-500",
    light: "bg-emerald-100 border-emerald-200",
    text: "text-emerald-700",
  },
  {
    href: "/papers",
    label: "Semester Papers",
    desc: "Branch & semester wise",
    icon: Layers,
    bg: "from-sky-400 to-blue-600",
    light: "bg-sky-100 border-sky-200",
    text: "text-sky-700",
  },
];

export default function Home() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [hasSetDefaults, setHasSetDefaults] = useState(false);
  
  const [filters, setFilters] = useState({
    collegeId: "",
    categoryId: "",
    branch: "",
    semester: "",
    fileType: "",
    sortBy: "newest",
  });

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");

  const { data: categories } = useListCategories();
  const { data: colleges } = useListColleges();

  useEffect(() => {
    if (user?.collegeId && colleges?.length > 0 && !hasSetDefaults) {
      const userCollege = colleges.find(c => c.id === user.collegeId);
      if (userCollege) {
        setSelectedCity(userCollege.city || "");
        setSelectedUniversity(userCollege.university || "");
        setFilters((prev) => ({ ...prev, collegeId: String(userCollege.id) }));
        setHasSetDefaults(true);
      }
    }
  }, [user, colleges, hasSetDefaults]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const shouldLoadResources = Boolean((selectedCity && selectedUniversity && filters.collegeId) || debouncedSearch);

  const { data: resourcesData, isLoading } = useListResources({
    page: 1,
    limit: 20,
    search: debouncedSearch || undefined,
    collegeId: filters.collegeId ? Number(filters.collegeId) : undefined,
    categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
    branch: filters.branch || undefined,
    semester: filters.semester ? Number(filters.semester) : undefined,
    fileType: filters.fileType || undefined,
    sortBy: filters.sortBy,
  }, {
    query: {
      enabled: shouldLoadResources
    }
  });

  const cities = MAHARASHTRA_CITIES;
  const universities = [...new Set((colleges || [])?.filter((c) => c.state?.toLowerCase() === 'maharashtra' && c.city === selectedCity).map((c) => c.university).filter(Boolean))].sort();
  const filteredColleges = (colleges || [])?.filter((c) => 
    c.state?.toLowerCase() === 'maharashtra' &&
    (!selectedCity || c.city === selectedCity) && 
    (!selectedUniversity || c.university === selectedUniversity)
  ) || [];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      collegeId: "",
      categoryId: "",
      branch: "",
      semester: "",
      fileType: "",
      sortBy: "newest",
    });
    setSearch("");
    setSelectedCity("");
    setSelectedUniversity("");
  };

  const activeFilterCount =
    Object.values(filters).filter((v) => v && v !== "newest").length +
    (search ? 1 : 0);

  const FilterPanel = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Sort By</label>
        <Select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="popular">Most Popular</option>
          <option value="mostDownloaded">Most Downloaded</option>
          <option value="topRated">Top Rated</option>
        </Select>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700">Location & College</label>
        
        <Select 
          value={selectedCity} 
          onChange={(e) => {
            setSelectedCity(e.target.value);
            setSelectedUniversity("");
            handleFilterChange("collegeId", "");
          }}
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        <Select 
          value={selectedUniversity} 
          onChange={(e) => {
            setSelectedUniversity(e.target.value);
            handleFilterChange("collegeId", "");
          }}
          disabled={!selectedCity}
        >
          <option value="">All Universities</option>
          {universities.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </Select>

        <Select
          value={filters.collegeId}
          onChange={(e) => handleFilterChange("collegeId", e.target.value)}
        >
          <option value="">All Colleges</option>
          {filteredColleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Category</label>
        <Select
          value={filters.categoryId}
          onChange={(e) => handleFilterChange("categoryId", e.target.value)}
        >
          <option value="">All Categories</option>
          {Array.isArray(categories) && categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Semester
          </label>
          <Select
            value={filters.semester}
            onChange={(e) => handleFilterChange("semester", e.target.value)}
          >
            <option value="">All</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Sem {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            File Type
          </label>
          <Select
            value={filters.fileType}
            onChange={(e) => handleFilterChange("fileType", e.target.value)}
          >
            <option value="">All</option>
            <option value="PDF">PDF</option>
            <option value="PPT">PPT</option>
            <option value="DOC">DOC</option>
            <option value="IMAGE">Image</option>
          </Select>
        </div>
      </div>
      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full text-sm text-primary font-semibold hover:underline text-center pt-2"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-8 sm:mb-12 shadow-2xl shadow-slate-200/80 border border-slate-200 min-h-[400px] sm:min-h-[480px] md:min-h-[520px] flex items-center bg-white">
        <div className="absolute inset-0">
          <img
            src={`${import.meta.env.BASE_URL}images/home-hero.jpg`}
            alt="College Resources Desk"
            className="w-full h-full object-cover object-right"
          />
          {/* Subtle gradient to ensure text readability on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent w-full md:w-3/4 lg:w-2/3" />
        </div>
        
        <div className="relative z-10 px-6 py-12 sm:px-10 md:px-16 lg:px-20 max-w-2xl lg:max-w-3xl">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold mb-6 bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
            A Community for Curious Minds
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] font-display font-extrabold text-slate-900 mb-6 leading-[1.05] tracking-tight">
            College Resources <br/>
            <span className="text-emerald-600">Made Simple.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 mb-10 max-w-xl font-medium leading-relaxed">
            Access notes, previous year papers, assignments and study materials shared by students. Learn, share and grow together.
          </p>

          <div className="flex flex-col gap-4">
            <div className="relative flex items-center bg-white p-2 rounded-full shadow-xl shadow-slate-200/50 max-w-2xl border border-slate-100">
              <Search className="absolute left-6 w-5 h-5 text-slate-400" />
              <input
                type="search"
                placeholder="Search subjects, topics, or files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-14 pr-4 border-none bg-transparent focus:ring-0 text-base font-medium placeholder:text-slate-400 outline-none"
              />
              <button 
                onClick={() => {}} 
                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition-colors shrink-0 hidden sm:block"
              >
                Search
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-sm font-bold text-slate-800 mr-1">Popular:</span>
              {["Notes", "Previous Year Papers", "Assignments", "Lab Manuals", "Study Material"].map((tag) => (
                <span key={tag} className="px-3 py-1.5 bg-white rounded-full text-xs font-semibold text-slate-600 border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-300 hover:text-emerald-600 transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Section Cards */}
      <div className="mb-8 sm:mb-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              Quick Access
            </h2>
          </div>
          <Link href="/papers">
            <span className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
              View all <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
        <p className="text-slate-500 font-medium mb-5">Explore popular resources</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {QUICK_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <div
                  className={`group relative rounded-xl sm:rounded-2xl border p-4 sm:p-5 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${section.light}`}
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center text-white shadow-sm mb-3`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <p
                    className={`font-display font-bold text-sm sm:text-base leading-tight mb-0.5 ${section.text}`}
                  >
                    {section.label}
                  </p>
                  <div className="flex items-end justify-between mt-1">
                    <p className="text-xs text-slate-500 leading-snug max-w-[85%]">
                      {section.desc}
                    </p>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-black/5 shrink-0 transition-transform group-hover:scale-110`}>
                      <ArrowRight className={`w-3.5 h-3.5 ${section.text}`} />
                    </div>
                  </div>
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
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterPanel />
              <div className="pt-4 pb-2">
                <Button
                  className="w-full h-12"
                  onClick={() => setShowFilters(false)}
                >
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
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary font-semibold hover:underline"
                >
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
              {isLoading
                ? "Loading..."
                : !shouldLoadResources 
                ? "Start by selecting filters" 
                : `${resourcesData?.total || 0} resources`}
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ResourceCardSkeleton key={i} />
              ))}
            </div>
          ) : !shouldLoadResources ? (
            <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 sm:w-10 sm:h-10 text-primary/40" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
                No resources found
              </h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6 px-4 text-sm sm:text-base font-medium">
                Choose city -&gt; university -&gt; clg to get the resources
              </p>
            </div>
          ) : (!resourcesData?.resources || resourcesData?.resources.length === 0) ? (
            <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 sm:w-10 sm:h-10 text-primary/40" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
                No resources found
              </h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6 px-4 text-sm sm:text-base font-medium">
                Choose city -&gt; university -&gt; clg to get the resources
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {resourcesData?.resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
