"use client";

import { useState } from "react";

import { ACCEPTED_IMAGE_TYPES } from "@/lib/photo";
import { uploadPhoto } from "@/lib/photo-upload";

type Status =
  | { state: "empty" }
  | { state: "uploading"; name: string }
  | { state: "done"; name: string; path: string }
  | { state: "failed"; message: string };

/**
 * Attaching a photograph. The file goes straight to Storage — it is far larger
 * than a Server Action accepts — and only the resulting path travels with the
 * form.
 *
 * `onBusyChange` lets the form disable its submit while an upload is in
 * flight: an entry saved mid-upload would reference a path that does not exist
 * yet.
 */
export function PhotoField({
  disabled,
  onBusyChange,
}: {
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [status, setStatus] = useState<Status>({ state: "empty" });

  async function choose(file: File | undefined) {
    if (!file) return;

    setStatus({ state: "uploading", name: file.name });
    onBusyChange(true);
    try {
      const path = await uploadPhoto(file);
      setStatus({ state: "done", name: file.name, path });
    } catch (error) {
      setStatus({
        state: "failed",
        message:
          error instanceof Error
            ? error.message
            : "The photograph could not be added.",
      });
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">A photograph</span>

      {status.state === "done" ? (
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-sm text-foreground/70">
            {status.name}
          </p>
          <button
            type="button"
            onClick={() => setStatus({ state: "empty" })}
            disabled={disabled}
            className="edge-pill h-10 shrink-0 px-4 text-sm font-medium text-foreground/60 hover:text-rust"
          >
            Remove
          </button>
          {/* The only part that reaches the action. */}
          <input type="hidden" name="photo_url" value={status.path} />
        </div>
      ) : (
        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          disabled={disabled || status.state === "uploading"}
          onChange={(event) => void choose(event.target.files?.[0])}
          className="block w-full text-sm text-foreground/70 file:mr-3 file:h-10 file:cursor-pointer file:border-0 file:bg-transparent file:px-4 file:text-sm file:font-medium file:text-accent"
        />
      )}

      {status.state === "uploading" && (
        <p role="status" className="text-sm text-foreground/60">
          Adding {status.name}…
        </p>
      )}
      {status.state === "failed" && (
        <p role="alert" className="text-sm text-rust">
          {status.message}
        </p>
      )}
    </div>
  );
}
