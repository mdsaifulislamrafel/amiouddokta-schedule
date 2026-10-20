"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import JobTable from "@/components/JobTable";

// পাবলিক ড্যাশবোর্ড — লগইন ছাড়াই সবাই দেখতে পারবে (শুধু দেখা, এডিট নয়)
export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [admin, setAdmin] = useState(false);
  const load = () => fetch("/api/dashboard", { cache: "no-store" }).then(r => r.json()).then(setD);
  useEffect(() => {
    load();
    fetch("/api/auth/me").then(r => r.json()).then(x => setAdmin(x.admin));
    const t = setInterval(load, 60000); // প্রতি ১ মিনিটে নিজে রিফ্রেশ
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <div className="nav">
        <b>আমিও উদ্যোক্তা — শিডিউল</b>
        {admin ? (
          <>
            <Link href="/jobs">কাজ / শিডিউল</Link><Link href="/jobs/new">+ নতুন কাজ</Link><Link href="/clients">ক্লায়েন্ট</Link>
            <a href="#" style={{ marginLeft: "auto" }} onClick={async e => { e.preventDefault(); await fetch("/api/auth/logout", { method: "POST" }); location.reload(); }}>লগআউট</a>
          </>
        ) : (
          <Link href="/login" style={{ marginLeft: "auto" }}>অ্যাডমিন লগইন</Link>
        )}
      </div>
      <div className="wrap">
        {!d ? <p>লোড হচ্ছে...</p> : (
          <>
            <div className="grid">
              <div className="card"><div className="stat">{d.todayCount}</div>আজকের কাজ ({d.today})</div>
              <div className="card"><div className="stat">{d.pending.length}</div>Approval বাকি</div>
              <div className="card"><div className="stat">{d.toDeliver.length}</div>ডেলিভারি বাকি</div>
            </div>
            <div className="card"><h3>আসন্ন শিডিউল (আজ ও ভবিষ্যৎ)</h3><JobTable jobs={d.upcoming} readOnly /></div>
            {d.overdue.length > 0 && <div className="card"><h3>তারিখ পেরিয়ে গেছে কিন্তু শুট শেষ হয়নি</h3><JobTable jobs={d.overdue} readOnly /></div>}
            <div className="card"><h3>Approval এর অপেক্ষায়</h3><JobTable jobs={d.pending} readOnly /></div>
            <div className="card"><h3>ডেলিভারির অপেক্ষায়</h3><JobTable jobs={d.toDeliver} readOnly /></div>
          </>
        )}
      </div>
    </>
  );
}
