"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  Search,
  Filter,
  Image as ImageIcon,
  X,
  Plus,
} from "lucide-react";

interface Asset {
  id: string;
  title: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  status: string;
  tags: { id: string; slug: string; label: string }[];
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<{ slug: string; label: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (selectedTags.length) params.set("tags", selectedTags.join(","));
    const res = await fetch(`/api/assets?${params}`, { credentials: "include" });
    const data = await res.json();
    setAssets(data.assets || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [query, selectedTags]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    fetch("/api/tags", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAllTags(d.tags || []))
      .catch(() => {});
  }, []);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^.]+$/, ""));
      await fetch("/api/assets", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
    }
    setUploading(false);
    setShowUpload(false);
    fetchAssets();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      handleUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Asset Library</h2>
          <p className="text-gray-500 mt-1">{total} assets</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Upload zone */}
      {showUpload && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center bg-gray-900/50"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
              <p className="text-gray-400">Uploading...</p>
            </div>
          ) : (
            <>
              <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">
                Drag & drop images here, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Browse files
              </button>
            </>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets by title..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            showFilters || selectedTags.length
              ? "bg-blue-600/20 border-blue-600 text-blue-400"
              : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {selectedTags.length > 0 && (
            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {selectedTags.length}
            </span>
          )}
        </button>
      </div>

      {/* Tag filter panel */}
      {showFilters && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-400">
              Filter by tags
            </span>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const active = selectedTags.includes(tag.slug);
              return (
                <button
                  key={tag.slug}
                  onClick={() =>
                    setSelectedTags((prev) =>
                      active
                        ? prev.filter((t) => t !== tag.slug)
                        : [...prev, tag.slug]
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {tag.label}
                  {active && <X className="w-3 h-3 inline ml-1" />}
                </button>
              );
            })}
            {allTags.length === 0 && (
              <p className="text-xs text-gray-600">No tags yet</p>
            )}
          </div>
        </div>
      )}

      {/* Asset Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16">
          <ImageIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No assets found</p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-3 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mx-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload your first asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.id}`}
              className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
            >
              <div className="aspect-square bg-gray-800 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-700 group-hover:text-gray-600 transition-colors" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-300 truncate">
                  {asset.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  {asset.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag.slug}
                      className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded"
                    >
                      {tag.slug}
                    </span>
                  ))}
                  {asset.tags.length > 2 && (
                    <span className="text-[10px] text-gray-600">
                      +{asset.tags.length - 2}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-600 mt-1.5">
                  Used {asset.usageCount}x
                  {asset.width && asset.height && (
                    <> &middot; {asset.width}&times;{asset.height}</>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
