import { FC } from "react";
import { CoursesManagement } from "@/components/admin/CoursesManagement";

const AdminCoursesPage: FC = () => {
  return (
    <div className="p-6">
      <CoursesManagement />
    </div>
  );
};

export default AdminCoursesPage;

