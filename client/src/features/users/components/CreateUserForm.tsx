import React, { useState } from "react";
import type { CreateUserRequest } from "../types";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { extractErrorMessage } from "../lib/api-errors";

type Props = {
  onCreate: (payload: CreateUserRequest) => void;
  isSubmitting?: boolean;
  error?: unknown; // API error from mutation
};

export function CreateUserForm({ onCreate, isSubmitting, error }: Props) {
  const [name, setName] = useState("");
  const [zipCode, setZipCode] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name: name.trim(), zipCode: zipCode.trim() });
  };

  const clearForm = () => {
    setName("");
    setZipCode("");
  };

  // Clear form on successful submission (when error clears and not submitting)
  React.useEffect(() => {
    if (!error && !isSubmitting && name && zipCode) {
      clearForm();
    }
  }, [error, isSubmitting]);

  const errorMessage = error ? extractErrorMessage(error) : "";

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="John Doe"
          required
        />
        <Input
          label="Zip Code"
          value={zipCode}
          onChange={(e) => setZipCode(e.currentTarget.value)}
          placeholder="10001"
          required
        />
        <Button
          type="submit"
          disabled={isSubmitting || !name.trim() || !zipCode.trim()}
        >
          {isSubmitting ? "Creating..." : "Create"}
        </Button>
      </form>

      {errorMessage && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
