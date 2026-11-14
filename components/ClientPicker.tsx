"use client";
import { useEffect, useRef, useState } from "react";

// টাইপ করে সার্চ করা যায় এমন ক্লায়েন্ট সিলেক্টর
export default function ClientPicker({ clients, value, onChange }: { clients: any[]; value: string; onChange: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const selected = clients.find(c => c._id === value);
  const label = (c: any) => `${c.name} (${c.phone})${c.isMember ? " ★ Member" : ""}`;

  // বাইরে ক্লিক করলে লিস্ট বন্ধ
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const term = q.trim().toLowerCase();
  const list = (term
    ? clients.filter(c => (c.name || "").toLowerCase().includes(term) || (c.phone || "").includes(term))
    : clients
  ).slice(0, 50);

  const pick = (c: any) => { onChange(c._id); setQ(""); setOpen(false); };

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi(h => Math.min(h + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { if (open && list[hi]) { e.preventDefault(); pick(list[hi]); } }
    else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        className="input"
        placeholder="-- নাম বা ফোন নাম্বার টাইপ করুন --"
        value={open ? q : (selected ? label(selected) : "")}
        onFocus={() => { setOpen(true); setQ(""); setHi(0); }}
        onChange={e => { setQ(e.target.value); setOpen(true); setHi(0); }}
        onKeyDown={onKey}
      />
      {value && (
        <button type="button" onClick={() => { onChange(""); setQ(""); }} title="মুছুন"
          style={{ position: "absolute", right: 8, top: 6, border: 0, background: "transparent", cursor: "pointer", fontSize: 16 }}>✕</button>
      )}
      {open && (
        <div style={{ position: "absolute", zIndex: 50, left: 0, right: 0, maxHeight: 260, overflowY: "auto", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,.12)", marginTop: 2 }}>
          {list.map((c, i) => (
            <div key={c._id} onMouseDown={e => { e.preventDefault(); pick(c); }} onMouseEnter={() => setHi(i)}
              style={{ padding: "8px 10px", cursor: "pointer", background: i === hi ? "#eef2ff" : "#fff", fontWeight: c._id === value ? 700 : 400 }}>
              {label(c)}
            </div>
          ))}
          {!list.length && <div style={{ padding: "8px 10px", color: "#6b7280" }}>কোনো ক্লায়েন্ট পাওয়া যায়নি</div>}
        </div>
      )}
    </div>
  );
}
