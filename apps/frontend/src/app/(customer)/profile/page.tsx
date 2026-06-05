import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";

export default function ProfilePage() {
  // Auth guard is client-side via ProfileForm
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-foreground mb-8">My Profile</h1>
      <ProfileForm />
    </div>
  );
}
