import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Loader2 } from "lucide-react";

export default function EventRegistrationsDashboard() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(collection(db, "eventRegistrations"), orderBy("createdAt", "desc"));
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRegistrations(Array.isArray(items) ? items : []);
          setLoading(false);
        },
        (error) => {
          console.error("Dashboard subscription error:", error);
          setRegistrations([]);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Dashboard error:", err);
      setRegistrations([]);
      setLoading(false);
    }
  }, []);

  const safeList = Array.isArray(registrations) ? registrations : [];

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Live Registrations</h2>
          <p className="text-xs text-slate-500">Real-time status from Firestore</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Total: {safeList.length}
        </div>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center gap-2 text-slate-500 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading data...</span>
        </div>
      ) : safeList.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500">
          No participant records found. Submit a form to test registration.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Participant</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {item.fullName || "N/A"} <span className="text-slate-400">({item.age || "-"})</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-800">
                      {item.category || "21K"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div>{item.email}</div>
                    <div className="text-slate-400">{item.phone}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 font-bold uppercase ${
                        item.paymentStatus === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.paymentStatus || "pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}