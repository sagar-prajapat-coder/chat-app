import axios from "axios";
import Sidebar from "./layouts/Sidebar";

function Dashboard() {
  const userData = JSON.parse(localStorage.getItem("user"))?.data.name;



  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Welcome {userData}</h2>
          <ul className="divide-y divide-gray-100">
           
          </ul>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
