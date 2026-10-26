// app/supervisor/students/[studentId]/page.tsx (or your respective path)
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { notify } from "@/components/notificationToaster";
import ErrorState from "@/components/ErrorState";
import { PageHeading } from "@/components/ui/page-heading";
import { formatDate } from "@/shared/utils/format";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { FormField, TextInput } from "@/components/ui/form-field";
import { UserDto } from "@/modules/user/mappers/user-mapper";
import { getStudentAction } from "@/Interfaces/getters/user.getters";
import { ResetStudentPasswordPayload } from "@/shared/validation/user";
import { deleteStudentAction, passwordResetStudentAction } from "@/Interfaces/actions/users.actions";

export default function StudentDetailsPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<UserDto | null>(null);

  // Load student details on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getStudentAction(studentId);
      if ("error" in res) {
        setError(res.error);
      } else {
        setStudent(res);
      }
      setLoading(false);
    }
    loadData();
  }, [studentId]);

  // Handle Password Reset
  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!student) return;

    const formData = new FormData(e.currentTarget);
    const payload: ResetStudentPasswordPayload = {
      studentId: student.id,
      data: {
        password: String(formData.get("password") ?? ""),
      },
    };

    const res = await passwordResetStudentAction(payload);
    if ("error" in res) {
      notify.error("Password reset failed", res.error);
    } else {
      notify.success("Password reset successfully", "A new temporary password has been assigned.");
      // e.currentTarget.reset();
    }
  };

  // Handle Delete Student
  const handleDeleteStudent = async () => {
    if (!student) return;

    const res = await deleteStudentAction(student.id);
    if ("error" in res) {
      notify.error("Failed to delete student", res.error);
    } else {
      notify.success("Student account deleted", "Redirecting to students directory...");
      router.push("/supervisor/students");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !student) {
    return <ErrorState message={error || "Student not found."} />;
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Student account"
        title={student.name}
        description="View student account details. Students manage their own display name, email, and password; their college ID remains fixed."
        action={
          <Button variant="ghost" className="rounded-xl gap-2" >
            <Link href="/supervisor/students">
              <ArrowLeft size={16} /> Students
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-[1.4fr_0.6fr]">
        {/* Main Details Card */}
        <section className="rounded-[2rem] border border-white/10 bg-card/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <GraduationCap size={26} />
          </span>

          <dl className="grid gap-6 sm:grid-cols-2">
            {[
              ["Full name", student.name],
              ["College ID", student.collegeId ?? "—"],
              ["Login ID", student.loginId],
              ["Email", student.email ?? "Not provided"],
              ["Account created", formatDate(student.createdAt)],
              ["Initial password", student.mustChangePassword ? "Password change still required" : "No change required"],
            ].map(([label, value]) => (
              <div key={label} className="space-y-1">
                <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</dt>
                <dd className="break-words text-sm font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Password Reset Section */}
        <section className="rounded-[2rem] border border-white/10 bg-card/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight">Reset password</h2>
            <p className="text-xs text-muted-foreground">Assign a new temporary password for this student account.</p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-5">
            <FormField
              label="New temporary password"
              name="password"
              hint="At least 9 characters. Share securely with the student."
            >
              <TextInput
                name="password"
                type="password"
                required
                minLength={9}
                maxLength={128}
                autoComplete="new-password"
                placeholder="••••••••••••"
              />
            </FormField>

            <ConfirmSubmitButton
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-destructive px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow-lg shadow-destructive/20 transition-all hover:bg-destructive/90"
              confirmMessage="Are you sure you want to reset this student's password?"
            >
              Reset password
            </ConfirmSubmitButton>
          </form>
        </section>
      </div>

      {/* Sidebar Actions */}
      <aside className="rounded-[2rem] border border-white/10 bg-card/80 p-6 backdrop-blur-xl shadow-xl h-fit space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldCheck size={18} />
          </span>
          <h2 className="font-bold tracking-tight">Account actions</h2>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Deleting a student removes the account permanently. Shared project and AI suggestion history remains intact.
        </p>

        <div className="pt-2">
          <ConfirmSubmitButton
            onClick={handleDeleteStudent}
            className="w-full rounded-xl border border-destructive/30 bg-destructive/10 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
            confirmMessage="Permanently delete this student account? Shared project and AI suggestion history will remain."
          >
            Delete student account
          </ConfirmSubmitButton>
        </div>
      </aside>
    </div>
  );
}