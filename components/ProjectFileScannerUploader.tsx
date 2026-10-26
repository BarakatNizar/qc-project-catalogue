"use client";

import { useState } from "react";
import { extractProjectFromFileAction } from "@/Interfaces/actions/ai.actions"; 
import { ExtractedProject } from "@/modules/project/types";
import { ExtractProjectFromFileActionPayload } from "@/shared/validation/ai-action";

interface FileScannerUploaderProps {
  onExtracted: (projectData: ExtractedProject) => void;
}

export default function FileScannerUploader({ onExtracted }: FileScannerUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      const payload: ExtractProjectFromFileActionPayload = {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        data: arrayBuffer,
      };
      console.log(payload)

      const result = await extractProjectFromFileAction(payload);

      setLoading(false);
      console.log(result);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      if (result.data) {
        onExtracted(result.data);
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to read the file. Please try again.");
      console.error(err);
    }
  }
  return (
    <div className="p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900">
      <div className="flex flex-col items-center justify-center space-y-2">
        <label className="cursor-pointer text-center">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {loading ? "Scanning document & extracting project fields..." : "Upload Project Document (PDF, Word, TXT)"}
          </span>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
        </label>
        <p className="text-xs text-zinc-500">Auto-fills your project inputs using AI analysis</p>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    </div>
  );
}