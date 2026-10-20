import Link from "next/link";
import { fmt12, fmtDur, STATUS_LABEL } from "@/lib/utils";
export default function JobTable({ jobs, onDelete, readOnly }: { jobs: any[]; onDelete?: (id: string) => void; readOnly?: boolean }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead><tr><th>তারিখ / সময়</th><th>সার্ভিস</th><th>ক্লায়েন্ট</th><th>দায়িত্বে</th><th>শুটের সময়</th><th>স্ট্যাটাস</th>{!readOnly && <th></th>}</tr></thead>
        <tbody>
          {jobs.map(j => (
            <tr key={j._id}>
              <td>{j.date}<br />{fmt12(j.startTime)} - {fmt12(j.endTime)}</td>
              <td>{j.serviceType}{j.title ? <><br /><small>{j.title}</small></> : null}</td>
              <td>{j.client?.name} {j.client?.isMember && <span className="badge vip">Member</span>}{j.client?.phone && <><br />{j.client.phone}</>}</td>
              <td>{j.assignedTo || "-"}</td>
              <td>{fmtDur(j.durationMinutes)}</td>
              <td><span className={`badge ${j.status}`}>{STATUS_LABEL[j.status]}</span></td>
              {!readOnly && (
                <td>
                  <Link href={`/jobs/${j._id}`}>খুলুন</Link>
                  {onDelete && j.status !== "delivered" && <> | <a href="#" style={{ color: "#dc2626" }} onClick={e => { e.preventDefault(); onDelete(j._id); }}>মুছুন</a></>}
                </td>
              )}
            </tr>
          ))}
          {!jobs.length && <tr><td colSpan={7}>কোনো কাজ নেই</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
