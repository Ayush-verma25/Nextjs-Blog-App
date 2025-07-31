"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import SubsTableItems from "../../../Components/adminComponents/SubsTableItems";

const Page = () => {
  const [emails, setEmails] = useState([]);

  const fetchEmails = async () => {
  try {
    const res = await axios.get("/api/email");
    setEmails(res.data.emails);
  } catch (err) {
    toast.error("Failed to fetch emails");
  }
};

  const deleteEmail = async (mongoId) => {
    try {
      const response = await axios.delete("/api/email", {
        params: { id: mongoId },
      });

      if (response.data.success) {
        toast.success(response.data.msg);
        fetchEmails();
      } else {
        toast.error("Error deleting email");
      }
    } catch (error) {
      toast.error("Failed to delete email");
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <div className="flex-1 pt-5 px-5 sm:pt-12 sm:pl-16">
      <h1 className="text-xl font-bold">All Subscriptions</h1>
      <div className="relative max-w-[600px] h-[80vh] overflow-x-auto mt-4 border border-gray-400 scrollbar-hide">
        <table className="w-full text-sm text-gray-500">
          <thead className="text-xs text-left text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Email</th>
              <th className="hidden sm:block px-6 py-3">Date</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((item, index) => (
              <SubsTableItems
                key={item._id}
                mongoId={item._id}
                deleteEmail={deleteEmail}
                email={item.email}
                date={new Date(item.date).toLocaleDateString()}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Page;
