import { redirect } from "next/navigation";
import { getDb } from "@/server/db/client";
import { userPreferences } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "@/server/auth/sessionStore";
import { cookies } from "next/headers";

async function checkUserPreferences() {
  // Get session from cookies
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("fp_session");
  
  if (!sessionCookie) {
    redirect("/");
  }

  // Get user from session
  const user = await getUserFromSession(sessionCookie.value);
  
  if (!user) {
    redirect("/");
  }

  // Check if user has preferences
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const prefsResult = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, user.id))
    .limit(1);

  const hasPreferences = prefsResult.length > 0;

  if (!hasPreferences) {
    redirect("/onboarding");
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkUserPreferences();

  return <>{children}</>;
}
