"use client";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Item = { href: string; label: string };

const ITEMS: Item[] = [
  { href: "/", label: "🏠 ড্যাশবোর্ড" },
  { href: "/jobs", label: "📋 কাজ / শিডিউল" },
  { href: "/jobs/new", label: "+ নতুন কাজ" },
  { href: "/jobs/new?type=edit", label: "✂️ এডিটের কাজ" },
  { href: "/clients", label: "👥 ক্লায়েন্ট" },
  { href: "/packages", label: "📦 প্যাকেজ" },
  { href: "/board", label: "🗂️ কাজের বোর্ড" },
  { href: "/payments", label: "💰 টাকা জমা" },
  { href: "/collectors", label: "👤 টাকা গ্রহণকারী" },
];

const IDLE_BG = "rgba(255, 255, 255, .08)";
const HOVER_BG = "rgba(255, 255, 255, .20)";

function NavLink({ href, label }: Item) {
  const pathname = usePathname();
  const search = useSearchParams();

  const [hPath, hQuery] = href.split("?");
  const hType = hQuery ? new URLSearchParams(hQuery).get("type") : null;
  const curType = search.get("type");

  let active = false;
  if (hPath === "/") {
    active = pathname === "/";
  } else if (hPath === "/jobs") {
    // /jobs এবং /jobs/123 সক্রিয়, কিন্তু /jobs/new নয়
    active = pathname === "/jobs" || (pathname.startsWith("/jobs/") && pathname !== "/jobs/new");
  } else if (hPath === "/jobs/new") {
    // "নতুন কাজ" আর "এডিটের কাজ" আলাদা করে চেনা
    active = pathname === "/jobs/new" && (hType ? curType === hType : curType !== "edit");
  } else {
    active = pathname === hPath || pathname.startsWith(hPath + "/");
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 16px",
        borderRadius: 999,
        fontSize: 14,
        whiteSpace: "nowrap",
        textDecoration: "none",
        transition: "all .15s ease",
        ...(active
          ? {
              background: "#fff",
              color: "#1e1b4b",
              fontWeight: 700,
              boxShadow: "0 0 0 3px rgba(165, 180, 252, .55), 0 4px 14px rgba(0, 0, 0, .35)",
            }
          : {
              background: IDLE_BG,
              color: "#e0e7ff",
              fontWeight: 500,
            }),
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = HOVER_BG;
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = IDLE_BG;
      }}
    >
      {label}
    </Link>
  );
}

function Nav() {
  return (
    <div className="nav" style={{ gap: 8 }}>
      <b style={{ marginRight: 8 }}>আমিও উদ্যোক্তা</b>
      {ITEMS.map(i => (
        <NavLink key={i.href} {...i} />
      ))}
      <a
        href="#"
        style={{
          marginLeft: "auto",
          padding: "8px 16px",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          color: "#fecaca",
          background: "rgba(220, 38, 38, .25)",
          textDecoration: "none",
        }}
        onClick={async e => {
          e.preventDefault();
          await fetch("/api/auth/logout", { method: "POST" });
          location.href = "/login";
        }}
      >
        🚪 লগআউট
      </a>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="nav"><b>আমিও উদ্যোক্তা</b></div>}>
        <Nav />
      </Suspense>
      <div className="wrap">{children}</div>
    </>
  );
}