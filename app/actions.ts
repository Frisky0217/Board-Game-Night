"use server";

import { revalidatePath } from "next/cache";

import { clean } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

export type State = {
  status: "idle" | "error" | "success";
  message: string;
  /** Changes only on success, so the field clears on a save but keeps its text
   *  when a submission is rejected. */
  formKey: string;
};

/** Names in the database may carry stray whitespace, so compare loosely. */
function fingerprint(name: string) {
  return clean(name).toLowerCase();
}

/**
 * Adding a title to the contents. Server Actions are reachable by direct POST,
 * so every rule the UI enforces is re-checked here against untrusted FormData.
 */
export async function createGame(
  prev: State,
  formData: FormData,
): Promise<State> {
  const fail = (message: string): State => ({
    status: "error",
    message,
    formKey: prev.formKey,
  });

  const name = clean(String(formData.get("name") ?? ""));
  if (!name) return fail("Write a title first.");
  if (name.length > 120) return fail("That title is too long to set down.");

  // Compared in JS over a full fetch rather than with .ilike(), which would
  // treat a % or _ in a typed title as a wildcard.
  const { data, error } = await supabase.from("games").select("name");
  if (error) return fail(`Could not read the contents: ${error.message}`);

  const taken = new Set((data ?? []).map((row) => fingerprint(row.name)));
  if (taken.has(fingerprint(name))) {
    return fail(`"${name}" is already in the contents.`);
  }

  const { error: insertError } = await supabase
    .from("games")
    .insert({ name })
    .select("id")
    .single();

  if (insertError) {
    return fail(`Could not set down that title: ${insertError.message}`);
  }

  // The contents gains a line; the record form's list of games gains an option.
  revalidatePath("/");
  revalidatePath("/sessions/new");

  return {
    status: "success",
    message: `"${name}" added to the contents.`,
    formKey: crypto.randomUUID(),
  };
}
