import { useState, useEffect } from "react";
import { useListResources, useListColleges } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resource-card";
import { Button, Select } from "@/components/ui-elements";
import { Search, X, SlidersHorizontal, Laptop, Monitor, Cpu, Settings, HardHat, FlaskConical, Zap, Database, Dna, Filter, GraduationCap, FileSearch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BRANCH_ICONS = {
  "Computer Science": Monitor,
  "Electronics": Cpu,
  "Mechanical": Settings,
  "Civil": HardHat,
  "Chemical": FlaskConical,
  "Electrical": Zap,
  "Information Technology": Database,
  "Biotechnology": Dna,
};

const BRANCHES = Object.keys(BRANCH_ICONS);

export function SectionPage({
  title,
  subtitle,
  icon: Icon,
  categoryId,
  accentClass, // e.g. "bg-emerald-100 text-emerald-700"
  bgClass, // e.g. "bg-gradient-to-br from-emerald-50 to-teal-50"
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const { data: colleges } = useListColleges();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useListResources({
    page: 1,
    limit: 30,
    categoryId,
    search: debouncedSearch || undefined,
    branch: branch || undefined,
    semester: semester ? Number(semester) : undefined,
    sortBy,
  });

  const activeBranches = BRANCHES;
  const activeFilterCount = [branch, semester, debouncedSearch].filter(
    Boolean,
  ).length;

  const clearFilters = () => {
    setBranch("");
    setSemester("");
    setSearch("");
  };

  const titleWords = title.split(" ");
  const lastWord = titleWords.pop();
  const firstPart = titleWords.join(" ");

  // Extract pure text color from accentClass (e.g. text-emerald-700) for the last word
  const textColorClass = accentClass.split(" ").find(c => c.startsWith("text-"));
  const bgColorClass = accentClass.split(" ").find(c => c.startsWith("bg-"));

  return (
    <Layout>
      {/* Hero Banner */}
      <div className={`relative rounded-3xl overflow-hidden mb-6 sm:mb-8 ${bgClass} border-none`}>
        {/* Background Decorative Icon (Replaces 3D asset) */}
        <Icon className={`absolute -right-8 -top-8 w-48 h-48 opacity-10 ${textColorClass} transform rotate-12`} />
        
        <div className="px-5 py-8 sm:px-10 sm:py-12 relative z-10">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 ${accentClass}`}>
            <Icon className="w-3.5 h-3.5" />
            {title}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-slate-900 mb-3 leading-tight">
            {firstPart} <span className={textColorClass}>{lastWord}</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mb-6 max-w-2xl font-medium">
            {subtitle}
          </p>

          {/* Search Bar */}
          <div className="relative w-full max-w-3xl mb-4">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${textColorClass}`} />
            <input
              type="search"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-full border-none bg-white/90 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium"
            />
          </div>

          {/* Desktop/Tablet Filter Bar (Inside Banner) */}
          <div className="flex gap-3 max-w-3xl">
            <div className="relative flex-1 sm:max-w-xs">
              <GraduationCap className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textColorClass}`} />
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full h-10 pl-9 pr-8 rounded-full border-none bg-white/90 backdrop-blur-sm shadow-sm text-sm font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Filter by Branch</option>
                {activeBranches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center justify-center gap-2 h-10 px-5 rounded-full border-none bg-white/90 backdrop-blur-sm shadow-sm text-sm font-semibold text-slate-700 hover:bg-white transition-colors"
            >
              <Filter className={`w-4 h-4 ${textColorClass}`} />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Branch Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setBranch("")}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            !branch ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white text-primary hover:bg-slate-50 border border-slate-100"
          }`}
        >
          <Laptop className="w-4 h-4" />
          All Branches
        </button>
        {activeBranches.map((b) => {
          const BranchIcon = BRANCH_ICONS[b] || Laptop;
          const isActive = branch === b;
          return (
            <button
              key={b}
              onClick={() => setBranch(isActive ? "" : b)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-100"
              }`}
            >
              <BranchIcon className={`w-4 h-4 ${isActive ? "text-white" : textColorClass}`} />
              {b}
            </button>
          );
        })}
      </div>

      {/* Semester Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setSemester("")}
          className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${
            !semester ? "bg-indigo-900 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
          }`}
        >
          All Sems
        </button>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
          const isActive = String(s) === semester;
          return (
            <button
              key={s}
              onClick={() => setSemester(isActive ? "" : String(s))}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                isActive ? "bg-indigo-900 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
              }`}
            >
              Sem {s}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.resources.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 mt-4 shadow-sm">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className={`absolute inset-0 ${bgColorClass} rounded-2xl rotate-3 opacity-50`}></div>
            <div className="relative bg-white w-full h-full rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm">
              <FileSearch className={`w-10 h-10 ${textColorClass}`} />
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">
            No {title} found
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm font-medium">
            Try changing the branch, semester or filters, or search for a different topic.
          </p>
          <Button onClick={clearFilters} className="rounded-xl px-8 py-6 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
            <Search className="w-4 h-4 mr-2" />
            Search Topics
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {data?.resources.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}

      {/* Mobile Filter Sheet Modal */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-xl">More Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-3">
                    Sort By
                  </label>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-xl h-12"
                  >
                    <option value="newest">Newest First</option>
                    <option value="topRated">Top Rated</option>
                    <option value="mostDownloaded">Most Downloaded</option>
                    <option value="popular">Most Popular</option>
                  </Select>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      clearFilters();
                      setShowFilters(false);
                    }}
                    className="w-full text-sm text-primary font-bold hover:underline text-center py-2"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
              <div className="pt-6">
                <Button
                  className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                  onClick={() => setShowFilters(false)}
                >
                  Show {data?.total || 0} results
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
}
