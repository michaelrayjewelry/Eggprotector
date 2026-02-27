"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  Image as ImageIcon,
  Tag,
  Clock,
  BarChart3,
  X,
} from "lucide-react";
import Link from "next/link";

interface AssetDetail {
  id: string;
  title: string;
  altText: string | null;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  sha256: string;
  status: string;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  tags: { id: string; slug: string; label: string }[];
  recentPosts: { id: string; text: string; status: string; postedAt: string | null }[];
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<{ slug: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<{ slug: string; label: string }[]>([]);

  useEffect(() => {
    fetch(`/api/assets/${params.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setAsset(data);
        setTitle(data.title);
        setAltText(data.altText || "");
        setCurrentTags(data.tags.map((t: { slug: string }) => t.slug));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/tags", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAllTags(d.tags || []))
      .catch(() => {});
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/assets/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, altText: altText || null }),
      credentials: "include",
    });
    await fetch(`/api/assets/${params.id}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: currentTags }),
      credentials: "include",
    });
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Archive this asset?")) return;
    await fetch(`/api/assets/${params.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    router.push("/assets");
  };

  const addTag = (slug: string) => {
    if (!currentTags.includes(slug)) {
      setCurrentTags([...currentTags, slug]);
    }
    setTagInput("");
    setSuggestions([]);
  };

  const removeTag = (slug: string) => {
    setCurrentTags(currentTags.filter((t) => t !== slug));
  };

  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    if (value.length > 0) {
      const filtered = allTags.filter(
        (t) =>
          t.slug.includes(value.toLowerCase()) &&
          !currentTags.includes(t.slug)
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const slug = tagInput
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
      addTag(slug);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  if (!asset) {
    return <p className="text-gray-500">Asset not found</p>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/assets"
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold text-white">{asset.title}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="aspect-square bg-gray-800 flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-gray-700" />
            </div>
            <div className="p-4 space-y-2 text-xs text-gray-500">
              <p>
                <span className="text-gray-600">File:</span>{" "}
                {asset.originalFilename}
              </p>
              <p>
                <span className="text-gray-600">Type:</span> {asset.mimeType}
              </p>
              <p>
                <span className="text-gray-600">Size:</span>{" "}
                {(asset.sizeBytes / 1024).toFixed(1)} KB
              </p>
              {asset.width && asset.height && (
                <p>
                  <span className="text-gray-600">Dimensions:</span>{" "}
                  {asset.width} &times; {asset.height}
                </p>
              )}
              <p>
                <span className="text-gray-600">Hash:</span>{" "}
                {asset.sha256.slice(0, 16)}...
              </p>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Alt Text
              </label>
              <textarea
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-600 resize-none"
                placeholder="Describe this image for accessibility..."
              />
            </div>

            {/* Tags editor */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {currentTags.map((slug) => (
                  <span
                    key={slug}
                    className="flex items-center gap-1 bg-blue-900/30 text-blue-400 border border-blue-800 px-2.5 py-1 rounded-full text-xs font-medium"
                  >
                    {slug}
                    <button
                      onClick={() => removeTag(slug)}
                      className="hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => handleTagInputChange(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tag... (type and press Enter)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-600"
                />
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                    {suggestions.map((s) => (
                      <button
                        key={s.slug}
                        onClick={() => addTag(s.slug)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {s.label}
                        <span className="text-gray-600 ml-2">({s.slug})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Archive
              </button>
            </div>
          </div>

          {/* Usage stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Usage Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Times Used</p>
                <p className="text-lg font-bold text-white">
                  {asset.usageCount}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Last Used</p>
                <p className="text-sm font-medium text-white">
                  {asset.lastUsedAt
                    ? new Date(asset.lastUsedAt).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>

          {/* Recent posts using this asset */}
          {asset.recentPosts.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-green-400" />
                Recent Posts Using This Asset
              </h3>
              <div className="space-y-2">
                {asset.recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-gray-800/50 rounded-lg p-3 text-sm text-gray-300"
                  >
                    <p className="truncate">{post.text}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {post.status} &middot;{" "}
                      {post.postedAt && new Date(post.postedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
