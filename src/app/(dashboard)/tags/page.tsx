"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tags, Save, X } from "lucide-react";

interface TagItem {
  id: string;
  slug: string;
  label: string;
  assetCount: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTags = async () => {
    setLoading(true);
    const res = await fetch("/api/tags", { credentials: "include" });
    const data = await res.json();
    setTags(data.tags || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const createTag = async () => {
    if (!newTagLabel.trim()) return;
    setCreating(true);
    await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newTagLabel.trim() }),
      credentials: "include",
    });
    setNewTagLabel("");
    setCreating(false);
    fetchTags();
  };

  const renameTag = async (id: string) => {
    if (!editLabel.trim()) return;
    await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editLabel.trim() }),
      credentials: "include",
    });
    setEditingId(null);
    fetchTags();
  };

  const deleteTag = async (id: string) => {
    if (!confirm("Delete this tag? It will be removed from all assets.")) return;
    await fetch(`/api/tags/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchTags();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Tags className="w-6 h-6 text-blue-400" />
          Tag Registry
        </h2>
        <p className="text-gray-500 mt-1">
          Manage your tag vocabulary. Slugs are auto-normalized to lowercase,
          dash-separated.
        </p>
      </div>

      {/* Create new tag */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={newTagLabel}
          onChange={(e) => setNewTagLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createTag()}
          placeholder="New tag label (e.g., Product Shot)"
          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600"
        />
        <button
          onClick={createTag}
          disabled={creating || !newTagLabel.trim()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create
        </button>
      </div>

      {/* Tags list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-12">
          <Tags className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No tags yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
            >
              {editingId === tag.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && renameTag(tag.id)
                    }
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-600"
                    autoFocus
                  />
                  <button
                    onClick={() => renameTag(tag.id)}
                    className="text-green-400 hover:text-green-300"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-sm font-medium text-gray-300">
                      {tag.label}
                    </span>
                    <span className="text-xs text-gray-600 ml-2">
                      ({tag.slug})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                      {tag.assetCount} assets
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(tag.id);
                        setEditLabel(tag.label);
                      }}
                      className="text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTag(tag.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
