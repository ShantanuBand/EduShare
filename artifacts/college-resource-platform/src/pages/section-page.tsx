import { useState, useEffect } from "react";
import { useListResources, useListColleges } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resource-card";
import { Button, Select } from "@/components/ui-elements";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";

const BRANCHES = ["Computer Science", "Electronics", "Mechanical", "Civil", "Chemical", "Electrical", "Information Technology", "Biotechnology"];

interface SectionPageProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  categoryId: number;
  accentClass: string;
  bgClass: string;
}

export function SectionPage({ title, subtitle, icon: Icon, categoryId, accentClass, bgClass }: SectionPageProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "topRated" | "mostDownloaded">("newest");
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
  const activeFilterCount = [branch, semester, debouncedSearch].filter(Boolean).length;

  const clearFilters = () => { setBranch(""); setSemester(""); setSearch(""); };

  return (
    <Layout>
      {/* Hero */}
      <div className={`relative rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-8 ${bgClass}`}>
        <div className="px-5 py-8 sm:px-10 sm:py-12">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 ${accentClass}`}>
            <Icon className="w-4 h-4" />
            {title}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-slate-900 mb-2 leading-tight">
            {title}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mb-6 max-w-2xl">{subtitle}</p>

          {/* Search + Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-slate-200 bg-white shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors relative"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-5 shadow-2xl lg:hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Branch</label>
                  <Select value={branch} onChange={e => setBranch(e.target.value)}>
                    <option value="">All Branches</option>
                    {activeBranches.map(b => <option key={b} value={b}>{b}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Semester</label>
                  <Select value={semester} onChange={e => setSemester(e.target.value)}>
                    <option value="">All Semesters</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Sort By</label>
                  <Select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
                    <option value="newest">Newest First</option>
                    <option value="topRated">Top Rated</option>
                    <option value="mostDownloaded">Most Downloaded</option>
                    <option value="popular">Most Popular</option>
                  </Select>
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="w-full text-sm text-primary font-semibold hover:underline text-center py-2">
                    Clear all filters
                  </button>
                )}
              </div>
              <div className="pt-4">
                <Button className="w-full h-11" onClick={() => setShowFilters(false)}>
                  Show {data?.total || 0} results
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Branch Quick-Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 sm:mb-6 scrollbar-hide -mx-3 px-3">
        <button
          onClick={() => setBranch("")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors ${!branch ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:border-primary/40'}`}
        >
          All Branches
        </button>
        {activeBranches.map(b => (
          <button
            key={b}
            onClick={() => setBranch(b === branch ? "" : b)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors ${branch === b ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:border-primary/40'}`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Semester Quick-Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 sm:mb-8 scrollbar-hide -mx-3 px-3">
        <button
          onClick={() => setSemester("")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors ${!semester ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
        >
          All Sems
        </button>
        {[1,2,3,4,5,6,7,8].map(s => (
          <button
            key={s}
            onClick={() => setSemester(String(s) === semester ? "" : String(s))}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors ${String(s) === semester ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
          >
            Sem {s}
          </button>
        ))}
      </div>

      {/* Sort + count row */}
      <div className="hidden lg:flex items-center justify-between mb-5">
        <p className="text-slate-600 text-sm">
          {isLoading ? "Loading..." : <><span className="font-bold text-slate-900">{data?.total || 0}</span> resources found</>}
          {activeFilterCount > 0 && <button onClick={clearFilters} className="ml-3 text-primary text-xs font-semibold hover:underline">Clear filters</button>}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Sort:</span>
          <Select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="!h-8 !text-xs !py-0 !w-auto">
            <option value="newest">Newest</option>
            <option value="topRated">Top Rated</option>
            <option value="mostDownloaded">Most Downloaded</option>
            <option value="popular">Popular</option>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[1,2,3,4,5,6].map(i => <ResourceCardSkeleton key={i} />)}
        </div>
      ) : data?.resources.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No {title} found</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-5 text-sm">
            Try changing your branch or semester filter, or check back later as more are uploaded.
          </p>
          <Button onClick={clearFilters} variant="outline" size="sm">Clear filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {data?.resources.map(r => <ResourceCard key={r.id} resource={r} />)}
        </div>
      )}
    </Layout>
  );
}
