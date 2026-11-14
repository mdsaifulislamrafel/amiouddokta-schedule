"use client";
import Link from "next/link";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="nav">
        <b>আমিও উদ্যোক্তা</b>
        <Link href="/">ড্যাশবোর্ড</Link><Link href="/jobs">কাজ / শিডিউল</Link>
        <Link href="/jobs/new">+ নতুন কাজ</Link><Link href="/jobs/new?type=edit">+ এডিটের কাজ</Link><Link href="/clients">ক্লায়েন্ট</Link><Link href="/packages">প্যাকেজ</Link><Link href="/board">কাজের বোর্ড</Link><Link href="/payments">💰 টাকা জমা</Link>
        <a href="#" style={{ marginLeft: "auto" }} onClick={async e => { e.preventDefault(); await fetch("/api/auth/logout", { method: "POST" }); location.href = "/login"; }}>লগআউট</a>
      </div>
      <div className="wrap">{children}</div>
    </>
  );
}
