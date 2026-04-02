"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type RecordType = {
  _id: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  note: string;
};

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      const res = await axios.get("/api/records");
      setRecords(res.data.data);
    } catch (error) {
      console.log("Error fetching records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-white bg-black">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Your Records</h1>

      {records.length === 0 ? (
        <p>No records found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-700">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-2">Amount</th>
                <th className="p-2">Type</th>
                <th className="p-2">Category</th>
                <th className="p-2">Date</th>
                <th className="p-2">Note</th>
              </tr>
            </thead>

            <tbody>
              {records.map((rec) => (
                <tr key={rec._id} className="text-center border-t border-gray-700">
                  <td className="p-2">₹{rec.amount}</td>

                  <td
                    className={`p-2 ${
                      rec.type === "income"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {rec.type}
                  </td>

                  <td className="p-2">{rec.category}</td>

                  <td className="p-2">
                    {new Date(rec.date).toLocaleDateString()}
                  </td>

                  <td className="p-2">{rec.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}