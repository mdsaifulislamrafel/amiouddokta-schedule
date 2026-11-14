"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import JobTable from "@/components/JobTable";
import { tk, waLink } from "@/lib/utils";

// পাবলিক ড্যাশবোর্ড — লগইন ছাড়াই সবাই দেখতে পারবে (শুধু দেখা, এডিট নয়)
export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [admin, setAdmin] = useState(false);
  const [sum, setSum] = useState<any>(null);
  const load = () => fetch("/api/dashboard", { cache: "no-store" }).then(r => r.json()).then(setD);
  useEffect(() => {
    load();
    fetch("/api/auth/me").then(r => r.json()).then(x => { setAdmin(x.admin); if (x.admin) fetch("/api/summary").then(r => r.json()).then(setSum); });
    const t = setInterval(load, 60000); // প্রতি ১ মিনিটে নিজে রিফ্রেশ
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <div className="nav">
        <b>আমিও উদ্যোক্তা — শিডিউল</b>
        {admin ? (
          <>
            <Link href="/jobs">কাজ / শিডিউল</Link><Link href="/jobs/new">+ নতুন কাজ</Link><Link href="/jobs/new?type=edit">+ এডিটের কাজ</Link><Link href="/clients">ক্লায়েন্ট</Link><Link href="/packages">প্যাকেজ</Link><Link href="/board">কাজের বোর্ড</Link><Link href="/payments">💰 টাকা জমা</Link>
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
            {admin && sum && (
              <>
                <div className="stats" style={{ marginTop: 12 }}>
                  <Link href="/payments" className="stat-card green"><small>আজকের কালেকশন</small><div className="stat">{tk(sum.todayTotal)}</div></Link>
                  <Link href="/payments" className="stat-card"><small>এই মাসের কালেকশন</small><div className="stat">{tk(sum.monthTotal)}</div></Link>
                  <Link href="/payments?tab=dues" className="stat-card red"><small>মোট বকেয়া</small><div className="stat">{tk(sum.totalDue)}</div></Link>
                  <div className="stat-card amber"><small>প্যাকেজের মেয়াদ শেষ / ৭ দিনের মধ্যে</small><div className="stat">{sum.expiring.length}</div></div>
                </div>
                {sum.expiring.length > 0 && (
                  <div className="card" style={{ background: "#fffbeb" }}><h3>⏰ প্যাকেজের মেয়াদ</h3>
                    {sum.expiring.map((c: any) => (
                      <div key={c._id} className="row" style={{ padding: "4px 0" }}>
                        <Link href={`/clients/${c._id}`}><b>{c.name}</b></Link> — {c.pkg} — {c.expired ? <span style={{ color: "#dc2626" }}>মেয়াদ শেষ ({c.endDate})</span> : <span>শেষ হবে {c.endDate}</span>}
                        <a className="btn wa" style={{ padding: "3px 10px", marginLeft: "auto" }} target="_blank" rel="noreferrer" href={waLink(c.phone, `আসসালামু আলাইকুম ${c.name}, আপনার "${c.pkg}" প্যাকেজের মেয়াদ ${c.expired ? "শেষ হয়েছে" : "শেষ হবে"} ${c.endDate} তারিখে। নবায়ন করতে আমাদের সাথে যোগাযোগ করুন। — আমিও উদ্যোক্তা`)}>WhatsApp রিমাইন্ডার</a>
                      </div>))}
                  </div>
                )}
              </>
            )}
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
