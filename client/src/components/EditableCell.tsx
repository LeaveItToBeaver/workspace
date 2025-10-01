import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/Input";

type Props = {
  value: string;
  onSave: (value: string) => Promise<void>; // Now async to handle API calls
  onCancel: () => void;
  onFieldSwitch?: () => void;
  placeholder?: string;
  type?: "text" | "number";
  className?: string;
};

export function EditableCell({
  value,
  onSave,
  onCancel,
  onFieldSwitch,
  placeholder,
  type = "text",
  className,
}: Props) {
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isBlurFromFieldSwitch = useRef(false);

  useEffect(() => {
    setEditValue(value);
    setError("");
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSave = async () => {
    if (editValue === value) {
      onCancel();
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await onSave(editValue);
      // Success - component will unmount or value will update
    } catch (err) {
      // Show API error and keep editing
      const errorMsg =
        typeof err === "object" && err !== null && "response" in err
          ? (err as any).response?.data?.message || "Update failed"
          : err instanceof Error
          ? err.message
          : "Update failed";

      setError(errorMsg);
      inputRef.current?.focus();
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlur = () => {
    if (isBlurFromFieldSwitch.current) {
      isBlurFromFieldSwitch.current = false;
      onFieldSwitch?.();
      return;
    }

    if (!isSaving && !error) {
      setTimeout(() => {
        if (!isBlurFromFieldSwitch.current) {
          handleSave();
        }
      }, 100);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    if (error) setError(""); // Clear error when user types
  };

  useEffect(() => {
    const handleDocumentClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(".editable-field-button") &&
        target.closest(".editable-field-button") !==
          inputRef.current?.closest("td")
      ) {
        isBlurFromFieldSwitch.current = true;
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  return (
    <div className={className}>
      <Input
        ref={inputRef}
        value={editValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        type={type}
        className={`${error ? "border-red-500" : ""} text-sm`}
        disabled={isSaving}
        autoFocus
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
