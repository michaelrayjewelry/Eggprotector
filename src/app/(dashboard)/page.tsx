"use client";

import { useEffect, useState } from "react";
import {
  Image,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
} from "lucide-react";

interface Stats {
  totalAssets: number;
  totalPosts: number;
  postsToday: number;
  draftsAwaitingApproval: number;
  failedPosts: number;
  topTags: { slug: string; count: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPosts, setRecentPosts] = useState<
    { id: string; text: string; status: string; postedAt: string | null; createdAt: string }[]
  >([]);

  useEffect(() => {
    // Fetch stats from various endpoints
    Promise.all([
      fetch("/api/assets?limit=1", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/posts?limit=5", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/posts?status=DRAFTED&limit=1", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/posts?status=FAILED&limit=1", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/tags", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([assetsRes, postsRes, draftsRes, failedRes, tagsRes]) => {
        setStats({
          totalAssets: assetsRes.total || 0,
          totalPosts: postsRes.total || 0,
          postsToday: 0,
          draftsAwaitingApproval: draftsRes.total || 0,
          failedPosts: failedRes.total || 0,
          topTags: (tagsRes.tags || [])
            .sort((a: { assetCount: number }, b: { assetCount: number }) => b.assetCount - a.assetCount)
            .slice(0, 5)
            .map((t: { slug: string; assetCount: number }) => ({ slug: t.slug, count: t.assetCount })),
        });
        setRecentPosts(postsRes.posts || []);
      })
      .catch(() => {
        setStats({
          totalAssets: 0,
          totalPosts: 0,
          postsToday: 0,
          draftsAwaitingApproval: 0,
          failedPosts: 0,
          topTags: [],
        });
      });
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Assets",
      value: stats.totalAssets,
      icon: Image,
      color: "text-blue-400",
      bg: "bg-blue-900/20",
    },
    {
      label: "Total Posts",
      value: stats.totalPosts,
      icon: FileText,
      color: "text-green-400",
      bg: "bg-green-900/20",
    },
    {
      label: "Pending Approval",
      value: stats.draftsAwaitingApproval,
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-900/20",
    },
    {
      label: "Failed Posts",
      value: stats.failedPosts,
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-900/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of your X content agent</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`${card.bg} p-3 rounded-lg`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-4.5 h-4.5 text-blue-400" />
            Recent Posts
          </h3>
          {recentPosts.length === 0 ? (
            <p className="text-gray-600 text-sm">No posts yet</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg"
                >
                  <StatusBadge status={post.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">
                      {post.text}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {post.postedAt
                        ? new Date(post.postedAt).toLocaleString()
                        : new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Tags */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4.5 h-4.5 text-green-400" />
            Top Tags
          </h3>
          {stats.topTags.length === 0 ? (
            <p className="text-gray-600 text-sm">No tags yet</p>
          ) : (
            <div className="space-y-2">
              {stats.topTags.map((tag) => (
                <div
                  key={tag.slug}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <span className="text-sm text-gray-300 font-medium">
                    {tag.slug}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                    {tag.count} assets
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFTED: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    APPROVED: "bg-blue-900/30 text-blue-400 border-blue-800",
    POSTED: "bg-green-900/30 text-green-400 border-green-800",
    FAILED: "bg-red-900/30 text-red-400 border-red-800",
    BLOCKED: "bg-gray-800 text-gray-400 border-gray-700",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded border font-medium ${colors[status] || colors.DRAFTED}`}
    >
      {status}
    </span>
  );
}
