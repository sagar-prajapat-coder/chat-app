import axios from "axios";
import Sidebar from "./layouts/Sidebar";
import { useEffect, useState } from "react";

function Dashboard() {
  const [userData, setUserData] = useState("");
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData?.token) {
      setUserData(userData);
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <div className="w-full md:w-64">
        <Sidebar user={userData} />
      </div>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-base sm:text-lg font-semibold mb-4">
            Welcome {userData?.name}
          </h2>
          <ul className="divide-y divide-gray-100">
            {/* List items go here */}
          </ul>
        </div>
      
      </main>
    </div>
  );
}

export default Dashboard;
