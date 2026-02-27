"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Shield,
  Clock,
  Hash,
  Link2,
  RotateCcw,
  Ban,
  Megaphone,
  Save,
  Power,
  CheckCircle2,
} from "lucide-react";

interface Policy {
  max_posts_per_day: number;
  min_hours_between_posts: number;
  no_duplicate_within_days: number;
  max_hashtags: number;
  max_links_per_day: number;
  image_reuse_cooldown_days: number;
  disallowed_phrases: string[];
  required_tone: string;
}

export default function SettingsPage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [killSwitch, setKillSwitch] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPhrase, setNewPhrase] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/policy", { credentials: "include" }).then((r) =>
        r.json()
      ),
      fetch("/api/settings/kill-switch", { credentials: "include" }).then(
        (r) => r.json()
      ),
      fetch("/api/settings", { credentials: "include" }).then((r) =>
        r.json()
      ),
    ])
      .then(([policyRes, ksRes, settingsRes]) => {
        setPolicy(policyRes.policy);
        setKillSwitch(ksRes.enabled);
        const approval = settingsRes.settings?.require_approval;
        setRequireApproval(
          approval ? (approval as { enabled: boolean }).enabled : true
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const savePolicy = async () => {
    if (!policy) return;
    setSaving(true);
    await fetch("/api/settings/policy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(policy),
      credentials: "include",
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleKillSwitch = async () => {
    const newValue = !killSwitch;
    await fetch("/api/settings/kill-switch", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: newValue }),
      credentials: "include",
    });
    setKillSwitch(newValue);
  };

  const toggleApproval = async () => {
    const newValue = !requireApproval;
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "require_approval",
        value: { enabled: newValue },
      }),
      credentials: "include",
    });
    setRequireApproval(newValue);
  };

  const addPhrase = () => {
    if (!newPhrase.trim() || !policy) return;
    setPolicy({
      ...policy,
      disallowed_phrases: [...policy.disallowed_phrases, newPhrase.trim()],
    });
    setNewPhrase("");
  };

  const removePhrase = (idx: number) => {
    if (!policy) return;
    setPolicy({
      ...policy,
      disallowed_phrases: policy.disallowed_phrases.filter((_, i) => i !== idx),
    });
  };

  if (loading || !policy) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" />
          Settings
        </h2>
        <p className="text-gray-500 mt-1">
          Configure posting policies, approval, and safety controls
        </p>
      </div>

      {/* Kill Switch */}
      <div
        className={`border rounded-xl p-5 ${
          killSwitch
            ? "bg-red-950/30 border-red-800"
            : "bg-gray-900 border-gray-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg ${killSwitch ? "bg-red-900/40" : "bg-gray-800"}`}
            >
              <Power
                className={`w-5 h-5 ${killSwitch ? "text-red-400" : "text-gray-500"}`}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Kill Switch</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Emergency stop — blocks all automated posting immediately
              </p>
            </div>
          </div>
          <button
            onClick={toggleKillSwitch}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              killSwitch ? "bg-red-600" : "bg-gray-700"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                killSwitch ? "left-6" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Manual Approval Toggle */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gray-800">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Require Manual Approval
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                When enabled, all posts must be approved before publishing
              </p>
            </div>
          </div>
          <button
            onClick={toggleApproval}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              requireApproval ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                requireApproval ? "left-6" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Policy Rules */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
        <h3 className="text-lg font-semibold text-white">Policy Rules</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PolicyField
            icon={<Megaphone className="w-4 h-4" />}
            label="Max Posts Per Day"
            value={policy.max_posts_per_day}
            onChange={(v) =>
              setPolicy({ ...policy, max_posts_per_day: Number(v) })
            }
            type="number"
          />
          <PolicyField
            icon={<Clock className="w-4 h-4" />}
            label="Min Hours Between Posts"
            value={policy.min_hours_between_posts}
            onChange={(v) =>
              setPolicy({ ...policy, min_hours_between_posts: Number(v) })
            }
            type="number"
          />
          <PolicyField
            icon={<RotateCcw className="w-4 h-4" />}
            label="No Duplicate Within (days)"
            value={policy.no_duplicate_within_days}
            onChange={(v) =>
              setPolicy({ ...policy, no_duplicate_within_days: Number(v) })
            }
            type="number"
          />
          <PolicyField
            icon={<Hash className="w-4 h-4" />}
            label="Max Hashtags"
            value={policy.max_hashtags}
            onChange={(v) =>
              setPolicy({ ...policy, max_hashtags: Number(v) })
            }
            type="number"
          />
          <PolicyField
            icon={<Link2 className="w-4 h-4" />}
            label="Max Links Per Day"
            value={policy.max_links_per_day}
            onChange={(v) =>
              setPolicy({ ...policy, max_links_per_day: Number(v) })
            }
            type="number"
          />
          <PolicyField
            icon={<RotateCcw className="w-4 h-4" />}
            label="Image Reuse Cooldown (days)"
            value={policy.image_reuse_cooldown_days}
            onChange={(v) =>
              setPolicy({ ...policy, image_reuse_cooldown_days: Number(v) })
            }
            type="number"
          />
        </div>

        <div>
          <PolicyField
            icon={<Megaphone className="w-4 h-4" />}
            label="Required Tone"
            value={policy.required_tone}
            onChange={(v) =>
              setPolicy({ ...policy, required_tone: String(v) })
            }
            type="text"
          />
        </div>

        {/* Disallowed Phrases */}
        <div>
          <label className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-2">
            <Ban className="w-4 h-4" />
            Disallowed Phrases
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {policy.disallowed_phrases.map((phrase, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 bg-red-900/20 text-red-400 border border-red-800 px-2.5 py-1 rounded-full text-xs"
              >
                {phrase}
                <button
                  onClick={() => removePhrase(idx)}
                  className="hover:text-red-200"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPhrase()}
              placeholder="Add disallowed phrase..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-600"
            />
            <button
              onClick={addPhrase}
              className="text-sm text-gray-400 hover:text-gray-200 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700"
            >
              Add
            </button>
          </div>
        </div>

        <button
          onClick={savePolicy}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Policy"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function PolicyField({
  icon,
  label,
  value,
  onChange,
  type,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  onChange: (v: string | number) => void;
  type: "number" | "text";
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1">
        {icon}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(type === "number" ? Number(e.target.value) : e.target.value)
        }
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-600"
      />
    </div>
  );
}
