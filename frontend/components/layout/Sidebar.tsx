import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-60 border-r bg-white p-4 space-y-2">
      <Link href="/dashboard" className="block rounded-md px-3 py-2 hover:bg-muted">Dashboard</Link>
    </aside>
  );
}