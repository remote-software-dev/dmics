"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, FileCheck } from "lucide-react";

export default function UploadDataPage() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setSuccess(null);
    setError(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0] ?? null;
    setFile(dropped);
    setSuccess(null);
    setError(null);
  }

  async function handleUpload() {
    if (!file || !token) return;
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE}/api/v1/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Upload failed");
      }

      setSuccess(`File "${file.name}" uploaded successfully.`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Upload Data</h1>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
        Supported formats: .xlsx, .xls, .csv. Max file size: 10MB.
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200/60 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            {success}
          </div>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-300 hover:border-indigo-300 hover:bg-slate-50"
          }`}
        >
          <Upload className="mx-auto w-10 h-10 text-slate-400 mb-3" />
          <p className="text-sm text-slate-600">
            Drag &amp; drop a file here, or{" "}
            <span className="text-indigo-600 font-medium">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            .xlsx, .xls, .csv up to 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {file && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-md px-4 py-3">
            <FileCheck className="w-5 h-5 text-indigo-500" />
            <span className="text-sm text-slate-700 flex-1 truncate">
              {file.name}
            </span>
            <span className="text-xs text-slate-400">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>
    </div>
  );
}
