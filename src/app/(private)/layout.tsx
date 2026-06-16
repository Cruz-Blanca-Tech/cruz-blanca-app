import { AuthProvider } from '@/features/auth/components/auth-provider';
import { Sidebar } from '@/components/layout/sidebar';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-1 bg-zinc-50">
        <Sidebar />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </AuthProvider>
  );
}
