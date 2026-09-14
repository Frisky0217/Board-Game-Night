"use client";

import { useActionState } from "react";

import { createGame, type State } from "./actions";

// Lives here rather than in actions.ts: a "use server" module may only export
// async functions, so it cannot export a plain constant.
const initialState: State = { status: "idle", message: "", formKey: "initial" };

export function IndexForm() {
  const [state, formAction, pending] = useActionState(createGame, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-2">
        {/* Keying the input on formKey remounts it, so a saved title clears the
            field while a rejected one is left for the writer to correct. */}
        <input
          key={state.formKey}
          type="text"
          name="name"
          placeholder="Add a title"
          aria-label="Title of the game"
          maxLength={120}
          disabled={pending}
          className="edge-soft on-page h-12 w-full px-4 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="edge-soft-b on-page h-12 shrink-0 px-5 text-base font-medium disabled:opacity-50"
        >
          {pending ? "Writing…" : "Write it in"}
        </button>
      </div>

      {/* Outside the keyed node, so the confirmation survives the remount. */}
      <p
        role={state.status === "error" ? "alert" : "status"}
        aria-live="polite"
        className={
          state.status === "error"
            ? "text-sm text-rust"
            : "text-sm text-accent"
        }
      >
        {state.message}
      </p>
    </form>
  );
}
