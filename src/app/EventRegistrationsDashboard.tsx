import React, { useCallback, useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";
import { 
  Users, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ShieldCheck,
  ArrowLeft,
  Handshake,
  Building,
  Target,
  Plus,
  Eye,
  X,
  PieChart,
  LogOut,
  RefreshCw
} from "lucide-react";

export interface Registration {
  id: string;
  fullName: string;
  age: number;
  gender?: "male" | "female" | "";
  category: "21K" | "10K" | "Children's 5K";
  email: string;
  phone: string;
  paymentStatus: "verified" | "pending" | "failed";
  mpesaCode?: string;
  createdAt: string;
}

interface ListRegistrationsResponse {
  registrations: Registration[];
}

export interface Sponsor {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  tier: "Gold (KSh 100k)" | "Silver (KSh 50k)" | "Bronze (KSh 25k)";
  amount: number;
  status: "Confirmed" | "Pledged";
  logoSubmitted: boolean;
}

export default function EventRegistrationsDashboard({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [activeView, setActiveView] = useState<"registrations" | "sponsors">("registrations");
  const [signOutError, setSignOutError] = useState("");
  
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(true);
  const [registrationLoadError, setRegistrationLoadError] = useState("");

  const [sponsors] = useState<Sponsor[]>([
    {
      id: "SP-01",
      companyName: "Autism Allies Kenya",
      contactPerson: "Dr. Sarah Kimani",
      email: "sarah@autismallies.co.ke",
      tier: "Gold (KSh 100k)",
      amount: 100000,
      status: "Confirmed",
      logoSubmitted: true
    },
    {
      id: "SP-02",
      companyName: "Coffee Bench Nanyuki",
      contactPerson: "Peter Njuguna",
      email: "info@coffeebench.co.ke",
      tier: "Silver (KSh 50k)",
      amount: 50000,
      status: "Confirmed",
      logoSubmitted: true
    },
    {
      id: "SP-03",
      companyName: "Laikipia Heights Resort",
      contactPerson: "Grace Wamae",
      email: "management@laikipiaheights.com",
      tier: "Bronze (KSh 25k)",
      amount: 25000,
      status: "Pledged",
      logoSubmitted: false
    }
  ]);

  const [activeTab, setActiveTab] = useState<"all" | "verified" | "pending">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedParticipant, setSelectedParticipant] = useState<Registration | null>(null);

  const loadRegistrations = useCallback(async () => {
    if (!functions) {
      setRegistrationLoadError("Registration service is not configured.");
      setIsLoadingRegistrations(false);
      return;
    }

    setIsLoadingRegistrations(true);
    setRegistrationLoadError("");
    try {
      const listRegistrations = httpsCallable<unknown, ListRegistrationsResponse>(functions, "listEventRegistrations");
      const response = await listRegistrations();
      setRegistrations(response.data.registrations);
    } catch (cause) {
      setRegistrationLoadError(cause instanceof Error ? cause.message : "Could not load event registrations.");
    } finally {
      setIsLoadingRegistrations(false);
    }
  }, []);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  const EVENT_CAPACITY = 500;
  const verifiedCount = registrations.filter(r => r.paymentStatus === 'verified').length;
  const pendingCount = registrations.filter(r => r.paymentStatus === 'pending').length;
  const ticketRevenue = verifiedCount * 1000;
  const sponsorshipTotal = sponsors.reduce((acc, s) => acc + (s.status === "Confirmed" ? s.amount : 0), 0);
  const totalFunds = ticketRevenue + sponsorshipTotal;

  const handleSignOut = async () => {
    setSignOutError("");
    try {
      await onSignOut();
    } catch {
      setSignOutError("Could not sign out. Please try again.");
    }
  };

  const filteredData = registrations.filter((item) => {
    const matchesSearch =
      item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone?.includes(searchTerm) ||
      item.mpesaCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" ? true : item.paymentStatus === activeTab;

    const matchesCategory =
      selectedCategory === "all" ? true : item.category === selectedCategory;

    return matchesSearch && matchesTab && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between pb-6 border-b border-slate-200 gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <a 
                href="#/" 
                className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition shadow-xs"
                title="Return to website"
              >
                <ArrowLeft className="w-4 h-4" />
              </a>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Wahome Foundation Admin
              </h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1 rounded-full">
                Miles for Minds 2027
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 pl-11">
              Event registration portal & live M-Pesa automated ledger.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1">
                <button
                  onClick={() => setActiveView("registrations")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeView === "registrations"
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Attendees
                </button>
                <button
                  onClick={() => setActiveView("sponsors")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeView === "sponsors"
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Handshake className="w-3.5 h-3.5" />
                  Sponsors ({sponsors.length})
                </button>
              </div>

              <button
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8,"
                    + ["Name,Age,Gender,Email,Phone,Category,M-Pesa,Status"]
                    .concat(registrations.map(r => `"${r.fullName}","${r.age}","${r.gender || ''}","${r.email}","${r.phone}","${r.category}","${r.mpesaCode || ''}","${r.paymentStatus}"`))
                    .join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "miles_for_minds_ledger.csv");
                  document.body.appendChild(link);
                  link.click();
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => void loadRegistrations()}
                disabled={isLoadingRegistrations}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
                title="Refresh participant registrations"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingRegistrations ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="flex items-center self-end md:self-auto">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
        {signOutError && <p role="alert" className="mt-3 text-right text-sm text-red-600">{signOutError}</p>}

        {/* Seamless Horizontal Divider Stat Banner (Replaces AI Boxes) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-6 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 gap-4 sm:gap-0">
            
            <div className="sm:px-6 first:pl-0">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
                <Target className="w-4 h-4 text-emerald-600" /> Attendance Capacity
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {registrations.length} <span className="text-xs font-normal text-slate-400">/ {EVENT_CAPACITY} Limit</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-1.5 rounded-full" 
                  style={{ width: `${(registrations.length / EVENT_CAPACITY) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="sm:px-6 pt-4 sm:pt-0">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Ticket Revenue
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                KSh {ticketRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {verifiedCount} verified M-Pesa entries
              </p>
            </div>

            <div className="sm:px-6 pt-4 sm:pt-0">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
                <Building className="w-4 h-4 text-blue-600" /> Sponsorship Raised
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                KSh {sponsorshipTotal.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {sponsors.filter(s => s.status === 'Confirmed').length} corporate partners
              </p>
            </div>

            <div className="sm:px-6 pt-4 sm:pt-0">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
                <PieChart className="w-4 h-4 text-amber-600" /> Total Funds
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                KSh {totalFunds.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Combined ticket & sponsor capital
              </p>
            </div>

          </div>
        </div>

        {/* Dynamic Section Content */}
        {activeView === "registrations" ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({registrations.length})
                </button>
                <button
                  onClick={() => setActiveTab("verified")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === "verified"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Verified ({verifiedCount})
                </button>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === "pending"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pending ({pendingCount})
                </button>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, phone, M-Pesa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="all">All Categories</option>
                    <option value="21K">21K</option>
                    <option value="10K">10K</option>
                    <option value="Children's 5K">Children's 5K</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {isLoadingRegistrations ? (
                <div className="py-16 text-center text-slate-500">Loading registrations…</div>
              ) : registrationLoadError ? (
                <div role="alert" className="py-10 text-center text-red-700 bg-red-50 rounded-xl border border-red-100">
                  <p>{registrationLoadError}</p>
                  <p className="mt-1 text-xs text-red-600">Check that this signed-in account has a staff or superadmin record.</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No registration entries found for this event.
                </div>
              ) : (
                filteredData.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-xs"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-sm shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {item.fullName}
                          </h3>
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                          <span className="text-[11px] text-slate-400">Age: {item.age}</span>
                          {item.gender && <span className="text-[11px] text-slate-400">Gender: {item.gender === "male" ? "Male" : "Female"}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          <span>{item.email}</span>
                          <span>•</span>
                          <span>{item.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                      <div className="text-right">
                        <div className="text-xs text-slate-400 mb-0.5">
                          M-Pesa: <span className="font-mono text-slate-800 font-medium">{item.mpesaCode || "—"}</span>
                        </div>
                        {item.paymentStatus === "verified" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedParticipant(item)}
                          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-6 shadow-xs">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Event Partners & Corporate Sponsors</h2>
                <p className="text-xs text-slate-500 mt-0.5">Track pledged funds and partner logo uploads.</p>
              </div>
              <button 
                onClick={() => alert("Add Sponsor form opened")}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Add Partner
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold text-sm shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {sponsor.companyName}
                        </h3>
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                          {sponsor.tier}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span>Contact: {sponsor.contactPerson}</span>
                        <span>•</span>
                        <span>{sponsor.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 mb-0.5">
                        KSh {sponsor.amount.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-end gap-2 text-xs">
                        {sponsor.logoSubmitted ? (
                          <span className="text-emerald-700 text-[10px] font-medium">Logo Uploaded</span>
                        ) : (
                          <span className="text-amber-700 text-[10px] font-medium">Logo Pending</span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sponsor.status === "Confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {sponsor.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal View */}
        {selectedParticipant && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 relative text-slate-800 shadow-xl">
              <button 
                onClick={() => setSelectedParticipant(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedParticipant.fullName}</h3>
                  <span className="text-xs text-slate-400">ID: {selectedParticipant.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 my-6 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Category</span>
                  <span className="text-slate-900 font-semibold">{selectedParticipant.category}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Age</span>
                  <span className="text-slate-900 font-semibold">{selectedParticipant.age} years</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Phone</span>
                  <span className="text-slate-900 font-semibold">{selectedParticipant.phone}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Email</span>
                  <span className="text-slate-900 font-semibold truncate block">{selectedParticipant.email}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                  <span className="text-slate-400 block mb-1">M-Pesa Code</span>
                  <span className="text-emerald-700 font-mono font-bold text-sm">{selectedParticipant.mpesaCode || "Pending Payment"}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
