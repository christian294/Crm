import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell
      userName={user.name}
      userEmail={user.email}
      userAvatar={user.avatarUrl}
    >
      {children}
    </AppShell>
  );
}
