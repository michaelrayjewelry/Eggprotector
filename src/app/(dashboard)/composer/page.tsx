"use client";

import { useEffect, useState } from "react";
import {
  PenSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Play,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";

interface Post {
  id: string;
  text: string;
  status: string;
  slot: string | null;
  scheduledFor: string | null;
  postedAt: string | null;
  xTweetId: string | null;
  failureReason: string | null;
  createdAt: string;
  assets: { id: string; title: string; tags: string[] }[];
}

export default function ComposerPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [draftText, setDraftText] = useState("");
  const [creating, setCreating] = useState(false);
  const [runningSlot, setRunningSlot] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    const params = filter !== "all" ? `?status=${filter}` : "";
    const res = await fetch(`/api/posts${params}`, { credentials: "include" });
    const data = await res.json();
    setPosts(data.posts || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const createDraft = async () => {
    if (!draftText.trim()) return;
    setCreating(true);
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: draftText.trim() }),
      credentials: "include",
    });
    setDraftText("");
    setCreating(false);
    fetchPosts();
  };

  const approvePost = async (id: string) => {
    await fetch(`/api/posts/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ execute: true }),
      credentials: "include",
    });
    fetchPosts();
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this draft?")) return;
    await fetch(`/api/posts/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchPosts();
  };

  const runAgent = async (slot: string) => {
    setRunningSlot(slot);
    await fetch(`/api/agent/run?slot=${slot}`, {
      method: "POST",
      credentials: "include",
    });
    setRunningSlot(null);
    fetchPosts();
  };

  const statusIcons: Record<string, typeof CheckCircle2> = {
    DRAFTED: Clock,
    APPROVED: Play,
    POSTED: CheckCircle2,
    FAILED: AlertTriangle,
    BLOCKED: XCircle,
  };

  const statusColors: Record<string, string> = {
    DRAFTED: "text-yellow-400 bg-yellow-900/20 border-yellow-800",
    APPROVED: "text-blue-400 bg-blue-900/20 border-blue-800",
    POSTED: "text-green-400 bg-green-900/20 border-green-800",
    FAILED: "text-red-400 bg-red-900/20 border-red-800",
    BLOCKED: "text-gray-400 bg-gray-800 border-gray-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <PenSquare className="w-6 h-6 text-blue-400" />
            Composer
          </h2>
          <p className="text-gray-500 mt-1">
            Create, review, and manage post drafts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["morning", "midday", "evening"] as const).map((slot) => (
            <button
              key={slot}
              onClick={() => runAgent(slot)}
              disabled={runningSlot !== null}
              className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              {runningSlot === slot ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Compose new draft */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder="Write a post draft..."
          rows={3}
          className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none resize-none"
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
          <span
            className={`text-xs ${draftText.length > 280 ? "text-red-400" : "text-gray-600"}`}
          >
            {draftText.length}/280
          </span>
          <button
            onClick={createDraft}
            disabled={creating || !draftText.trim() || draftText.length > 280}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Save Draft
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {["all", "DRAFTED", "APPROVED", "POSTED", "FAILED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-blue-600/20 text-blue-400 border border-blue-600"
                : "bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-700"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <PenSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No posts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const StatusIcon = statusIcons[post.status] || Clock;
            return (
              <div
                key={post.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${statusColors[post.status]}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {post.status}
                      </span>
                      {post.slot && (
                        <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
                          {post.slot}
                        </span>
                      )}
                      {post.xTweetId && (
                        <span className="text-xs text-gray-600">
                          Tweet: {post.xTweetId.slice(0, 12)}...
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{post.text}</p>
                    {post.failureReason && (
                      <p className="text-xs text-red-400 mt-1.5">
                        {post.failureReason}
                      </p>
                    )}
                    {post.assets.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <ImageIcon className="w-3.5 h-3.5 text-gray-600" />
                        {post.assets.map((a) => (
                          <span
                            key={a.id}
                            className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded"
                          >
                            {a.title}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-gray-600 mt-2">
                      Created {new Date(post.createdAt).toLocaleString()}
                      {post.scheduledFor && (
                        <>
                          {" "}
                          &middot; Scheduled{" "}
                          {new Date(post.scheduledFor).toLocaleString()}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.status === "DRAFTED" && (
                      <>
                        <button
                          onClick={() => approvePost(post.id)}
                          className="flex items-center gap-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Approve & Post
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
