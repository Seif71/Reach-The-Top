import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-3 text-sm text-muted">
        Optional, but useful if you want to update your listing and see whether you still hold #1.
      </p>
      <RegisterForm />
    </div>
  );
}
