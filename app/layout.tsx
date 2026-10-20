import "./globals.css";
export const metadata = { title: "Schedule Management" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="bn"><body>{children}</body></html>;
}
