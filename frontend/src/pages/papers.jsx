import { useState } from "react";
import { useListResources } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ResourceCard, ResourceCardSkeleton } from "@/components/resource-card";
import { Button } from "@/components/ui-elements";
import {
  Layers,
  BookOpen,
  ChevronDown,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

const BRANCHES = [
  {
    name: "Computer Science",
    short: "CS",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    name: "Electronics",
    short: "ECE",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    name: "Mechanical",
    short: "ME",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    name: "Civil",
    short: "CE",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    name: "Electrical",
    short: "EE",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  {
    name: "Information Technology",
    short: "IT",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  {
    name: "Chemical",
    short: "CHE",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  {
    name: "Biotechnology",
    short: "BT",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

function SemesterSection({ branch, semester }) {
  const [open, setOpen] = useState(semester <= 2);
  const { data, isLoading } = useListResources({
    page: 1,
    limit: 10,
    branch,
    semester,
    sortBy: "newest",
  });

  const count = data?.total ?? 0;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
            {semester}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">
              Semester {semester}
            </p>
            <p className="text-xs text-slate-500">
              {isLoading ? "..." : `${count} resource${count !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <ResourceCardSkeleton key={i} />
                  ))}
                </div>
              ) : count === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    No resources yet for Semester {semester}
                  </p>
                  <Link href="/upload">
                    <button className="mt-2 text-xs text-primary hover:underline font-medium">
                      Upload the first one
                    </button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data?.resources.slice(0, 4).map((r) => (
                      <ResourceCard key={r.id} resource={r} />
                    ))}
                  </div>
                  {count > 4 && (
                    <div className="mt-3 text-center">
                      <Link
                        href={`/?branch=${encodeURIComponent(branch)}&semester=${semester}`}
                      >
                        <Button variant="outline" size="sm">
                          View all {count} resources
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BranchPanel({ branch }) {
  const [open, setOpen] = useState(false);

  const { data } = useListResources({
    page: 1,
    limit: 1,
    branch: branch.name,
    sortBy: "newest",
  });
  const total = data?.total ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-slate-50 transition-colors text-left"
      >
        <div
          className={`shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-sm ${branch.color}`}
        >
          {branch.short}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-slate-900">{branch.name}</p>
          <p className="text-sm text-slate-500">
            {total} resources across 8 semesters
          </p>
        </div>
        <div
          className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${open ? "bg-primary border-primary text-white" : "border-slate-200 text-slate-400"}`}
        >
          {open ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3 border-t border-slate-100 pt-4">
              {SEMESTERS.map((sem) => (
                <SemesterSection
                  key={sem}
                  branch={branch.name}
                  semester={sem}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PapersPage() {
  return (
    <Layout>
      {/* Hero */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-8 bg-gradient-to-br from-sky-100 to-blue-100 border border-sky-200">
        <div className="px-5 py-8 sm:px-10 sm:py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 bg-sky-100 text-sky-700">
            <Layers className="w-4 h-4" />
            Semester Papers
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-slate-900 mb-2 leading-tight">
            Semester-wise Paper Library
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
            Browse all study materials organized by branch and semester. Click
            any branch to expand and explore resources semester by semester.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: "Branches", value: BRANCHES.length, icon: GraduationCap },
          { label: "Semesters", value: 8, icon: BookOpen },
          { label: "Categories", value: "7+", icon: Layers },
          { label: "Growing daily", value: "📈", icon: null },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 text-center shadow-sm"
          >
            <p className="text-xl sm:text-2xl font-display font-extrabold text-primary">
              {stat.value}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Branch Accordion List */}
      <div className="space-y-3 sm:space-y-4">
        {BRANCHES.map((branch) => (
          <BranchPanel key={branch.name} branch={branch} />
        ))}
      </div>

      {/* Upload CTA */}
      <div className="mt-8 sm:mt-10 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-5 sm:p-8 text-center border border-primary/10">
        <GraduationCap className="w-10 h-10 text-primary mx-auto mb-3" />
        <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 mb-2">
          Don't see your resources?
        </h3>
        <p className="text-slate-600 text-sm mb-4 max-w-md mx-auto">
          Help your classmates by uploading notes, papers, and assignments for
          your branch and semester.
        </p>
        <Link href="/upload">
          <Button size="lg" className="h-11 px-6">
            Upload a Resource
          </Button>
        </Link>
      </div>
    </Layout>
  );
}
