import type { Metadata } from "next";
import "./globals.css";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { QuickCaptureWrapper } from "@/components/layout/QuickCaptureWrapper";
import { SelectedTaskWrapper } from "@/components/layout/SelectedTaskWrapper";

export const metadata: Metadata = {
  title: "Flow GTD",
  description: "A calm, focused GTD task manager",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch areas with their active projects for the task edit dropdown
  const areasWithProjects = await prisma.area.findMany({
    orderBy: { sort_order: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      projects: {
        where: { status: "ACTIVE" },
        orderBy: { sort_order: "asc" },
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Fetch all tags for the task edit toggle pills
  const allTags = await prisma.tag.findMany({
    orderBy: { sort_order: "asc" },
    select: {
      id: true,
      name: true,
      icon: true,
    },
  });

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--bg-root)] text-[var(--text-primary)]">
        <SelectedTaskWrapper areasWithProjects={areasWithProjects} allTags={allTags}>
          <QuickCaptureWrapper>
          {/* Mobile Header - visible below md breakpoint */}
          <div className="md:hidden">
            <MobileHeader />
          </div>

          {/* Desktop Layout - visible at md breakpoint and above */}
          <div className="hidden md:flex h-screen">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* TopBar */}
              <TopBar />

              {/* Page Content */}
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>

          {/* Mobile Content - visible below md breakpoint */}
          <div className="md:hidden">
            {/* Content with padding for fixed header and bottom nav */}
            <main className="pt-14 pb-14" style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}>
              {children}
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
          </div>
        </QuickCaptureWrapper>
        </SelectedTaskWrapper>
      </body>
    </html>
  );
}
