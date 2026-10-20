export default function PrintHeader({ title }: { title: string }) {
  return (
    <>
      <img src="/logo.jpg" className="wm" alt="" />
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderRadius: 10, color: "#fff", background: "linear-gradient(90deg,#4338ca,#7c3aed)" }}>
        <img src="/logo.jpg" alt="logo" style={{ height: 64, width: 64, objectFit: "contain", background: "#fff", borderRadius: 10, padding: 4 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>আমিও উদ্যোক্তা</div>
          <div style={{ fontSize: 12, opacity: 0.95 }}>📞 +8801685295669 &nbsp;|&nbsp; 🌐 www.amiouddokta.com &nbsp;|&nbsp; ✉ amiouddokta@gmail.com</div>
        </div>
      </div>
      <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
        <span style={{ display: "inline-block", background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", borderRadius: 999, padding: "5px 22px", fontWeight: 700, fontSize: 15 }}>{title}</span>
      </div>
    </>
  );
}