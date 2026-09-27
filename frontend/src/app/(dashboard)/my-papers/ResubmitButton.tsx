"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ResubmitButton({ paperId }: { paperId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleResubmit() {
    if (!confirm("Are you sure you want to resubmit this paper for editorial review?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/papers/${paperId}/resubmit`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to resubmit paper");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      alert("Network error while trying to resubmit.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span style={{ fontSize: "12px", color: "var(--color-success-700)", fontWeight: 600 }}>
        Resubmitted ✓
      </span>
    );
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={handleResubmit}
      disabled={loading}
      title="Resubmit this revised paper to the editorial review queue"
    >
      {loading ? (
        <>
          <Clock size={12} className="animate-spin" />
          Resubmitting...
        </>
      ) : (
        <>
          <RotateCcw size={12} />
          Resubmit for Review
        </>
      )}
    </Button>
  );
}
