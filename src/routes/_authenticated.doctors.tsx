import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { MapPin, Search, ShieldAlert, ShieldCheck, Star, Stethoscope, Users } from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import { useDoctorsQuery, useSpecialtiesQuery } from "@/hooks/api/use-doctors";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/doctors")({
  head: () => ({
    meta: [
      { title: "Doctors — MediCare" },
      {
        name: "description",
        content: "Review every doctor on the platform, their verification status and activity.",
      },
    ],
  }),
  component: DoctorsAdminPage,
});

function DoctorsAdminPage() {
  const userQuery = useCurrentUserQuery();
  const role = userQuery.data?.role;

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={fadeUp} className="surface-card flex items-center gap-4 p-6 text-sm">
          <ShieldAlert className="size-5 text-warning" />
          <p className="text-muted-foreground">
            This directory is only available to administrators.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return <DoctorsDirectory />;
}

function DoctorsDirectory() {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("All");

  const doctorsQuery = useDoctorsQuery({ limit: 100 });
  const specialtiesQuery = useSpecialtiesQuery();
  const loading = doctorsQuery.isPending || specialtiesQuery.isPending;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (doctorsQuery.data?.data ?? []).filter((d) => {
      const name = `${d.firstName} ${d.lastName}`.toLowerCase();
      const spec = d.specialty?.name ?? "";
      const city = d.city ?? "";
      if (q && !`${name} ${spec} ${city}`.includes(q)) return false;
      if (specialty !== "All" && spec !== specialty) return false;
      return true;
    });
  }, [doctorsQuery.data, query, specialty]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Doctors directory</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} doctor{filtered.length === 1 ? "" : "s"} on the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, city…"
              aria-label="Search doctors"
              className="h-11 w-64 rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger className="h-11 w-44 rounded-2xl">
              <Stethoscope className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All specialties</SelectItem>
              {(specialtiesQuery.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="surface-card grid place-items-center px-6 py-24 text-center"
        >
          <span className="grid size-14 place-items-center rounded-3xl bg-primary-soft">
            <Users className="size-6 text-primary" />
          </span>
          <p className="mt-5 text-base font-semibold">No doctors match your search</p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="grid grid-cols-2 gap-6">
          {filtered.map((doctor) => {
            const name = `${doctor.firstName} ${doctor.lastName}`;
            return (
              <motion.div
                key={doctor.id}
                variants={fadeUp}
                className="surface-card flex items-start gap-4 p-6"
              >
                {doctor.photoUrl ? (
                  <img
                    src={doctor.photoUrl}
                    alt={name}
                    loading="lazy"
                    className="size-14 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-sm font-semibold text-primary">
                    {doctor.firstName[0]}
                    {doctor.lastName[0]}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">Dr. {name}</p>
                    {doctor.isLicenseVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-semibold text-success">
                        <ShieldCheck className="size-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">
                        <ShieldAlert className="size-3" /> Pending
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {doctor.specialty?.name ?? "General practice"}
                    {doctor.yearsOfExperience ? ` · ${doctor.yearsOfExperience} yrs` : ""}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {doctor.city}, {doctor.country}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-warning text-warning" />
                      <span className="font-medium">{Number(doctor.ratingAverage).toFixed(1)}</span>
                      <span className="text-muted-foreground">({doctor.reviewCount})</span>
                    </span>
                    <span className="text-muted-foreground">{doctor.patientCount} patients</span>
                    <span className="font-semibold">
                      {doctor.currency === "EUR" ? "€" : "$"}
                      {Number(doctor.consultationPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button asChild variant="outline" className="h-9 shrink-0 rounded-2xl">
                  <Link to="/find-doctor/$doctorId" params={{ doctorId: doctor.id }}>
                    View
                  </Link>
                </Button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
