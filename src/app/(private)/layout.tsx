import { AuthProvider } from '@/features/auth/components/auth-provider';
import { MainLayout } from '@/components/layout/main-layout';
import { QueryProvider } from '@/components/providers/query-provider';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <MainLayout>{children}</MainLayout>
      </AuthProvider>
    </QueryProvider>
  );
}
