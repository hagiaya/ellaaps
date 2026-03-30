import AdminHeader from "@/components/AdminHeader";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex" style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: 280, width: 'calc(100% - 280px)' }}>
        <AdminHeader />
        <main style={{ padding: '0 0 80px 0' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
