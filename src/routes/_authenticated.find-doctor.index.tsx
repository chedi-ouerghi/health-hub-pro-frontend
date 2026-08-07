import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Filter, Heart, RotateCcw, Search, SlidersHorizontal, Stethoscope } from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import { DoctorCard } from "@/components/doctors/doctor-card";
import { useFavorites } from "@/hooks/use-favorites";
import { useDoctorsQuery, useSpecialtiesQuery } from "@/hooks/api/use-doctors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

export const Route = createFileRoute("/_authenticated/find-doctor/")({
  head: () => ({
    meta: [
      { title: "Find a Doctor — MediCare" },
      {
        name: "description",
        content:
          "Search specialists by rating, experience and availability, then book an in-clinic appointment instantly.",
      },
      { property: "og:title", content: "Find a Doctor — MediCare" },
      {
        property: "og:description",
        content: "Discover trusted specialists and book an in-clinic consultation.",
      },
    ],
  }),
  component: FindDoctorPage,
});

const JS_DAY_TO_PRISMA = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const PAGE_SIZE = 4;

function FindDoctorPage() {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [minExperience, setMinExperience] = useState([0]);
  const [minRating, setMinRating] = useState("0");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState("rating");
  const [page, setPage] = useState(1);
  const { favorites } = useFavorites();

  const specialtiesQuery = useSpecialtiesQuery();
  const doctorsQuery = useDoctorsQuery({ limit: 100 });
  const loading = doctorsQuery.isPending || specialtiesQuery.isPending;

  const today = JS_DAY_TO_PRISMA[new Date().getDay()];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (doctorsQuery.data?.data ?? []).filter((d) => {
      const name = `${d.firstName} ${d.lastName}`.toLowerCase();
      const spec = d.specialty?.name ?? "";
      const city = d.city ?? "";
      if (q && !`${name} ${spec} ${city}`.includes(q)) return false;
      if (specialty !== "All" && spec !== specialty) return false;
      if ((d.yearsOfExperience ?? 0) < (minExperience[0] ?? 0)) return false;
      if (Number(d.ratingAverage) < Number(minRating)) return false;
      if (availableOnly && !(d.availabilities ?? []).some((a) => a.dayOfWeek === today))
        return false;
      if (favoritesOnly && !favorites.includes(d.id)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "price") return Number(a.consultationPrice) - Number(b.consultationPrice);
      if (sort === "experience") return (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0);
      if (sort === "reviews") return b.reviewCount - a.reviewCount;
      return Number(b.ratingAverage) - Number(a.ratingAverage);
    });
  }, [
    doctorsQuery.data,
    query,
    specialty,
    minExperience,
    minRating,
    availableOnly,
    favoritesOnly,
    sort,
    favorites,
    today,
  ]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const reset = () => {
    setQuery("");
    setSpecialty("All");
    setMinExperience([0]);
    setMinRating("0");
    setAvailableOnly(false);
    setFavoritesOnly(false);
    setPage(1);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Find your doctor</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} specialists match your criteria · book in under a minute
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-11 w-52 rounded-2xl">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Top rated</SelectItem>
              <SelectItem value="reviews">Most reviewed</SelectItem>
              <SelectItem value="experience">Most experienced</SelectItem>
              <SelectItem value="price">Lowest price</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-11 rounded-2xl" onClick={reset}>
            <RotateCcw className="size-4" /> Reset
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        <motion.aside variants={fadeUp} className="col-span-3 space-y-5">
          <div className="surface-card p-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, specialty or city…"
                aria-label="Search doctors"
                className="h-11 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition-shadow focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <p className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Filter className="size-3.5" /> Specialty
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["All", ...(specialtiesQuery.data ?? []).map((s) => s.name)].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setSpecialty(item);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    specialty === item
                      ? "border-transparent gradient-teal text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Min. experience
                </Label>
                <span className="text-xs font-medium">{minExperience[0]} yrs</span>
              </div>
              <Slider
                value={minExperience}
                onValueChange={setMinExperience}
                max={25}
                step={1}
                className="mt-4"
              />
            </div>

            <div className="mt-6">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Minimum rating
              </Label>
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="mt-3 h-11 w-full rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any rating</SelectItem>
                  <SelectItem value="4.5">4.5 and above</SelectItem>
                  <SelectItem value="4.8">4.8 and above</SelectItem>
                  <SelectItem value="5">5.0 only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 space-y-4 border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <Label htmlFor="available" className="text-sm">
                  Available today
                </Label>
                <Switch id="available" checked={availableOnly} onCheckedChange={setAvailableOnly} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="favorites" className="flex items-center gap-2 text-sm">
                  <Heart className="size-3.5" /> Favorites only
                </Label>
                <Switch id="favorites" checked={favoritesOnly} onCheckedChange={setFavoritesOnly} />
              </div>
            </div>
          </div>
        </motion.aside>

        <div className="col-span-9 space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-3xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <motion.div
              variants={fadeUp}
              className="surface-card grid place-items-center px-6 py-24 text-center"
            >
              <span className="grid size-14 place-items-center rounded-3xl bg-primary-soft">
                <Stethoscope className="size-6 text-primary" />
              </span>
              <p className="mt-5 text-base font-semibold">No doctors match your filters</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try widening your search — remove the availability filter or lower the minimum
                experience.
              </p>
              <Button className="mt-6 rounded-2xl" onClick={reset}>
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <motion.div variants={stagger} className="grid grid-cols-2 gap-6">
              {visible.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </motion.div>
          )}

          {!loading && pageCount > 1 && (
            <Pagination>
              <PaginationContent>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(p);
                      }}
                      className="rounded-xl"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </motion.div>
  );
}
