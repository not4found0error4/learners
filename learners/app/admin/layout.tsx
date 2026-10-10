import AdminNav from '@/components/admin/AdminNav';

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AdminNav />
      {children}
    </div>
  );
}
