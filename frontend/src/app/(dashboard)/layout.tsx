import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { AIChatPopup } from "@/components/layout/AIChatPopup";
import styles from "./layout.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role as "CUSTOMER" | "ADMIN" | "DESIGNER";

  return (
    <div className={styles.shell}>
      <Header />

      <div className={styles.body}>
        <DashboardSidebar role={userRole} />

        <main className={styles.main} id="main-content">
          {children}
        </main>
      </div>

      {/* Floating AI chat popup — available on all dashboard pages */}
      <AIChatPopup />
    </div>
  );
}
