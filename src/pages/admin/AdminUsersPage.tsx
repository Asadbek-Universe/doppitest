import { FC } from "react";
import { UsersManagement } from "@/components/admin/UsersManagement";

const AdminUsersPage: FC = () => {
  return (
    <div className="p-6">
      <UsersManagement />
    </div>
  );
};

export default AdminUsersPage;

