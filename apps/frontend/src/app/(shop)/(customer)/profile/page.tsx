import { ProfileForm } from "./ProfileForm";

export default function ProfilePage() {
  // Auth guard is client-side via ProfileForm
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
      <h1 className="text-2xl font-bold text-white/80 mb-8">My Profile</h1>
      <ProfileForm />
    </div>
  );
}
