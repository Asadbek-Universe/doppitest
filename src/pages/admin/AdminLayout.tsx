import { FC } from "react";
import { Outlet } from "react-router-dom";

// Minimal wrapper – the actual sidebar and layout are provided by AdminPanel.
const AdminLayout: FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      <Outlet />
    </div>
  );
};

export default AdminLayout;

