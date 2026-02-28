import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("xcontent_token")?.value;

  if (token) {
    redirect("/assets");
  } else {
    redirect("/login");
  }
}
