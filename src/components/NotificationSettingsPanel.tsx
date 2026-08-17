"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Smartphone, Check, AlertCircle } from "lucide-react";

export default function NotificationSettingsPanel() {
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        setInAppEnabled(data.inAppEnabled ?? true);
        setPushEnabled(data.pushEnabled ?? false);
        setEmailEnabled(data.emailEnabled ?? false);
        setEmail(data.email || "");
      }
    } catch (err) {
      console.error("Failed to load notification preferences", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableWebPush = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setMessage({ text: "Web Push is not supported on this browser.", type: "error" });
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage({ text: "Notification permission denied by user.", type: "error" });
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BG12345_PLACEHOLDER_VAPID_KEY";

      // Convert VAPID key to Uint8Array if needed or pass directly
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      if (res.ok) {
        setPushEnabled(true);
        setMessage({ text: "Web Push subscribed successfully!", type: "success" });
      }
    } catch (err: any) {
      console.error("Web Push registration error:", err);
      setMessage({ text: `Push setup error: ${err.message}`, type: "error" });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inAppEnabled,
          pushEnabled,
          emailEnabled,
          email,
        }),
      });

      if (res.ok) {
        setMessage({ text: "Notification preferences saved!", type: "success" });
      } else {
        setMessage({ text: "Failed to save preferences.", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-gray-400 p-4 text-center">Loading preferences...</div>;
  }

  return (
    <div className="bg-[#162736] border border-[#243b4d] rounded-2xl p-5 shadow-lg space-y-4 text-[#f2ece0]">
      <div className="flex items-center gap-2 border-b border-[#243b4d] pb-3">
        <Bell className="w-5 h-5 text-[#b8912f]" />
        <h3 className="font-serif font-bold text-base">Notification Preferences & Delivery Channels</h3>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-950/40 border border-green-800/40 text-green-300"
              : "bg-red-950/40 border border-red-800/40 text-red-300"
          }`}
        >
          {message.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* In-App Toggle */}
        <div className="flex items-center justify-between p-3 bg-[#10202b] rounded-xl border border-[#243b4d]">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-[#b8912f]" />
            <div>
              <p className="font-serif font-bold text-sm">In-App Notifications & Badges</p>
              <p className="text-gray-400">Display due reminders on dashboard and tab badge.</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={inAppEnabled}
            onChange={(e) => setInAppEnabled(e.target.checked)}
            className="accent-[#b8912f] w-4 h-4 rounded cursor-pointer"
          />
        </div>

        {/* Web Push Toggle */}
        <div className="flex items-center justify-between p-3 bg-[#10202b] rounded-xl border border-[#243b4d]">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <div>
              <p className="font-serif font-bold text-sm">Web Push (PWA Browser Alerts)</p>
              <p className="text-gray-400">Receive device notifications even when app is closed.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!pushEnabled && (
              <button
                type="button"
                onClick={handleEnableWebPush}
                className="px-2.5 py-1 rounded bg-blue-900/40 text-blue-300 border border-blue-700/50 text-[11px] font-semibold hover:bg-blue-800/50 transition"
              >
                Enable Push
              </button>
            )}
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => setPushEnabled(e.target.checked)}
              className="accent-[#b8912f] w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Email Toggle */}
        <div className="p-3 bg-[#10202b] rounded-xl border border-[#243b4d] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-serif font-bold text-sm">Email Reminders (Resend)</p>
                <p className="text-gray-400">Receive formatted email digest on due dates.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="accent-[#b8912f] w-4 h-4 rounded cursor-pointer"
            />
          </div>

          {emailEnabled && (
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Recipient Email Address</label>
              <input
                type="email"
                placeholder="e.g. user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#243b4d] bg-[#162736] text-white text-xs focus:border-[#b8912f] focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#b8912f] text-white font-serif font-bold text-xs hover:bg-[#c9a13b] transition disabled:opacity-50 shadow"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}
