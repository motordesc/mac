import { getStaff } from "@/app/actions/staff";
import { getCurrentRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffManager } from "./staff-manager";

export default async function StaffPage() {
  const [staff, role] = await Promise.all([getStaff(), getCurrentRole()]);
  const isAdmin = role === "Admin";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Staff</h1>
      <Card>
        <CardHeader>
          <CardTitle>Team ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffManager staff={staff} isAdmin={isAdmin} />
        </CardContent>
      </Card>
    </div>
  );
}

