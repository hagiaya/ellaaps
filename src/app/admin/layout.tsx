import AdminHeader from "@/components/AdminHeader";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col md:pl-64">
        <AdminHeader />
        <main className="p-6 pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
