import { useState } from "react";
import { toast } from "sonner";
import { FolderCog, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  useReferentialsQuery,
  useCreateSpecialtyMutation,
  useUpdateSpecialtyMutation,
  useDeleteSpecialtyMutation,
  useCreateLanguageMutation,
  useUpdateLanguageMutation,
  useDeleteLanguageMutation,
  useCreateFocusAreaMutation,
  useUpdateFocusAreaMutation,
  useDeleteFocusAreaMutation,
} from "@/hooks/api/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Specialty, FocusArea, DoctorLanguage } from "@/types/doctor.types";

type Row =
  | { kind: "specialty"; item: Specialty }
  | { kind: "language"; item: DoctorLanguage }
  | { kind: "focusArea"; item: FocusArea };

function errorMessage(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : "";
  if (/linked|in use|associated/i.test(msg)) {
    return "This item is still used by doctors and cannot be deleted.";
  }
  return msg || fallback;
}

function ListCard({ title, rows, keyOf }: { title: string; rows: Row[]; keyOf: (r: Row) => string }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const updateSpecialty = useUpdateSpecialtyMutation();
  const updateLanguage = useUpdateLanguageMutation();
  const updateFocusArea = useUpdateFocusAreaMutation();
  const deleteSpecialty = useDeleteSpecialtyMutation();
  const deleteLanguage = useDeleteLanguageMutation();
  const deleteFocusArea = useDeleteFocusAreaMutation();

  const startEdit = (row: Row) => {
    setEditing(keyOf(row));
    setDraft(row.item.name);
  };

  const saveEdit = (row: Row) => {
    const name = draft.trim();
    if (!name) return;
    const onSuccess = () => {
      toast.success("Referential updated");
      setEditing(null);
    };
    const onError = (err: unknown) => toast.error("Update failed", { description: errorMessage(err, "Please try again.") });
    if (row.kind === "specialty")
      updateSpecialty.mutate(
        { id: row.item.id, payload: { name } },
        { onSuccess, onError },
      );
    else if (row.kind === "language")
      updateLanguage.mutate(
        { id: row.item.id, payload: { name, code: (row.item as DoctorLanguage).code } },
        { onSuccess, onError },
      );
    else
      updateFocusArea.mutate(
        { id: row.item.id, payload: { name } },
        { onSuccess, onError },
      );
  };

  const remove = (row: Row) => {
    const onSuccess = () => toast.success("Referential deleted");
    const onError = (err: unknown) =>
      toast.error("Deletion failed", {
        description: errorMessage(err, "Please try again."),
      });
    if (row.kind === "specialty")
      deleteSpecialty.mutate(row.item.id, { onSuccess, onError });
    else if (row.kind === "language")
      deleteLanguage.mutate(row.item.id, { onSuccess, onError });
    else deleteFocusArea.mutate(row.item.id, { onSuccess, onError });
  };

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No entries yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => {
        const id = keyOf(row);
        const isEditing = editing === id;
        return (
          <li key={id} className="flex items-center gap-3 py-3">
            {isEditing ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="h-9 rounded-xl"
                />
                <Button type="button" className="h-9 rounded-xl" size="sm" onClick={() => saveEdit(row)}>
                  Save
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-9" onClick={() => setEditing(null)}>
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.item.name}</span>
                <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => startEdit(row)}>
                  <Pencil className="size-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {row.item.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This entry will be removed from the referential. Items still assigned to
                        doctors cannot be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction className="rounded-2xl" onClick={() => remove(row)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ReferentialsManager() {
  const referentials = useReferentialsQuery();
  const createSpecialty = useCreateSpecialtyMutation();
  const createLanguage = useCreateLanguageMutation();
  const createFocusArea = useCreateFocusAreaMutation();

  const [name, setName] = useState("");
  const [languageCode, setLanguageCode] = useState("");
  const [busyTab, setBusyTab] = useState<"specialty" | "language" | "focusArea">("specialty");

  const submit = (tab: typeof busyTab) => {
    const trimmed = name.trim();
    if (!trimmed || (tab === "language" && !languageCode.trim())) {
      toast.error("Please fill in the required fields");
      return;
    }
    const onSuccess = () => {
      setName("");
      setLanguageCode("");
      toast.success("Referential created");
    };
    const onError = (err: unknown) =>
      toast.error("Creation failed", {
        description: errorMessage(err, "Please try again."),
      });
    setBusyTab(tab);
    if (tab === "specialty")
      createSpecialty.mutate({ name: trimmed }, { onSuccess, onError });
    else if (tab === "language")
      createLanguage.mutate(
        { name: trimmed, code: languageCode.trim() },
        { onSuccess, onError },
      );
    else createFocusArea.mutate({ name: trimmed }, { onSuccess, onError });
  };

  const isPending =
    createSpecialty.isPending || createLanguage.isPending || createFocusArea.isPending;

  return (
    <section className="surface-card p-7">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <FolderCog className="size-4 text-primary" /> Referentials
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Manage specialties, languages and focus areas used across doctor profiles.
      </p>

      <div className="mt-5">
        <Tabs defaultValue="specialty" onValueChange={(v) => setBusyTab(v as typeof busyTab)}>
          <TabsList className="rounded-2xl">
            <TabsTrigger value="specialty" className="rounded-xl">Specialties</TabsTrigger>
            <TabsTrigger value="language" className="rounded-xl">Languages</TabsTrigger>
            <TabsTrigger value="focusArea" className="rounded-xl">Focus areas</TabsTrigger>
          </TabsList>

          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border p-4">
            <div className="min-w-56 flex-1">
              <Label htmlFor="ref-name" className="text-xs font-medium text-muted-foreground">
                Name
              </Label>
              <Input
                id="ref-name"
                className="mt-1.5 h-10 rounded-xl"
                value={name}
                placeholder="e.g. Cardiology"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit(busyTab);
                  }
                }}
              />
            </div>
            <div className="min-w-40">
              <Label htmlFor="ref-code" className="text-xs font-medium text-muted-foreground">
                ISO code (languages)
              </Label>
              <Input
                id="ref-code"
                className="mt-1.5 h-10 rounded-xl"
                value={languageCode}
                placeholder="e.g. fr"
                onChange={(e) => setLanguageCode(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="h-10 rounded-xl"
              disabled={isPending}
              onClick={() => submit(busyTab)}
            >
              <Plus className="size-4" />
              {isPending ? "Adding…" : "Add"}
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Tip: press Enter to add quickly. The ISO code field only applies to languages.
          </p>

          <TabsContent value="specialty">
            <ListCard
              title="Specialties"
              rows={(referentials.data?.specialties ?? []).map((item) => ({ kind: "specialty" as const, item }))}
              keyOf={(r) => r.item.id}
            />
          </TabsContent>
          <TabsContent value="language">
            <ListCard
              title="Languages"
              rows={(referentials.data?.languages ?? []).map((item) => ({ kind: "language" as const, item }))}
              keyOf={(r) => r.item.id}
            />
          </TabsContent>
          <TabsContent value="focusArea">
            <ListCard
              title="Focus areas"
              rows={(referentials.data?.focusAreas ?? []).map((item) => ({ kind: "focusArea" as const, item }))}
              keyOf={(r) => r.item.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}