import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

import '../css/dextra-d685c2.webflow.css';

// import '../css/normalize.css';
// import '../css/webflow.css';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar:state')?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <main
        className="w-full"
        style={{
          borderRadius: '40px 0 40px 40px',
          backgroundImage: 'linear-gradient(-45deg, #02081d, #000)',
        }}
      >
        <SidebarTrigger className="absolute z-50 mt-2 md:hidden" />
        {children}
      </main>
    </SidebarProvider>
  );
}
