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
  Heart,
  Building,
  Target,
  Plus,
  Pencil,
  Trash2,
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
  category: "21K" | "10K" | "Children's 1K";
  email: string;
  phone: string;
  paymentStatus: "verified" | "pending" | "failed";
  paymentMethod?: string;
  paymentReceipt?: string;
  createdAt: string;
}

interface ListRegistrationsResponse {
  registrations: Registration[];
}

export interface GeneralDonation {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  paymentStatus: "verified" | "pending" | "failed";
  paymentProvider: string;
  paymentReceipt: string;
  paymentReference: string;
  createdAt: string;
}

interface ListGeneralDonationsResponse {
  donations: GeneralDonation[];
}

interface ListEventSponsorsResponse {
  sponsors: Sponsor[];
}

function formatKshInput(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export interface Sponsor {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  amount: number;
  status: "Confirmed" | "Pledged";
  logoSubmitted: boolean;
}

export default function EventRegistrationsDashboard({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [activeView, setActiveView] = useState<"registrations" | "donations" | "sponsors">("registrations");
  const [signOutError, setSignOutError] = useState("");
  
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(true);
  const [registrationLoadError, setRegistrationLoadError] = useState("");

  const [donations, setDonations] = useState<GeneralDonation[]>([]);
  const [isLoadingDonations, setIsLoadingDonations] = useState(false);
  const [donationLoadError, setDonationLoadError] = useState("");

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoadingSponsors, setIsLoadingSponsors] = useState(true);
  const [sponsorLoadError, setSponsorLoadError] = useState("");
  const [sponsorSaveError, setSponsorSaveError] = useState("");
  const [sponsorEditorOpen, setSponsorEditorOpen] = useState(false);
  const [isSavingSponsor, setIsSavingSponsor] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [sponsorForm, setSponsorForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    amount: "",
    status: "Pledged" as Sponsor["status"],
    logoSubmitted: false,
  });

  const [activeTab, setActiveTab] = useState<"all" | "verified" | "pending">("all");
  const [activeDonationTab, setActiveDonationTab] = useState<"all" | "verified" | "pending" | "failed">("all");
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

  const loadSponsors = useCallback(async () => {
    if (!functions) {
      setSponsorLoadError("Sponsor service is not configured.");
      setIsLoadingSponsors(false);
      return;
    }

    setIsLoadingSponsors(true);
    setSponsorLoadError("");
    try {
      const listSponsors = httpsCallable<unknown, ListEventSponsorsResponse>(functions, "listEventSponsors");
      const response = await listSponsors();
      setSponsors(response.data.sponsors);
    } catch (cause) {
      setSponsorLoadError(cause instanceof Error ? cause.message : "Could not load event sponsors.");
    } finally {
      setIsLoadingSponsors(false);
    }
  }, []);

  const loadDonations = useCallback(async () => {
    if (!functions) {
      setDonationLoadError("Donation service is not configured.");
      setIsLoadingDonations(false);
      return;
    }

    setIsLoadingDonations(true);
    setDonationLoadError("");
    try {
      const listDonations = httpsCallable<unknown, ListGeneralDonationsResponse>(functions, "listGeneralDonations");
      const response = await listDonations();
      setDonations(response.data.donations);
    } catch (cause) {
      setDonationLoadError(cause instanceof Error ? cause.message : "Could not load general donations.");
    } finally {
      setIsLoadingDonations(false);
    }
  }, []);

  useEffect(() => {
    void loadRegistrations();
    void loadSponsors();
  }, [loadRegistrations, loadSponsors]);

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

  const openSponsorEditor = (sponsor?: Sponsor) => {
    setSponsorSaveError("");
    setEditingSponsor(sponsor ?? null);
    setSponsorForm(sponsor ? {
      companyName: sponsor.companyName,
      contactPerson: sponsor.contactPerson,
      email: sponsor.email,
      amount: sponsor.amount.toLocaleString("en-US"),
      status: sponsor.status,
      logoSubmitted: sponsor.logoSubmitted,
    } : {
      companyName: "",
      contactPerson: "",
      email: "",
      amount: "",
      status: "Pledged",
      logoSubmitted: false,
    });
    setSponsorEditorOpen(true);
  };

  const saveSponsor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!functions) {
      setSponsorSaveError("Sponsor service is not configured.");
      return;
    }
    setIsSavingSponsor(true);
    setSponsorSaveError("");
    try {
      const save = httpsCallable<{
        id?: string;
        companyName: string;
        contactPerson: string;
        email: string;
        amount: number;
        status: Sponsor["status"];
        logoSubmitted: boolean;
      }, {id: string}>(functions, "saveEventSponsor");
      await save({
        ...(editingSponsor ? {id: editingSponsor.id} : {}),
        ...sponsorForm,
        amount: Number(sponsorForm.amount.replace(/,/g, "")),
      });
      setSponsorEditorOpen(false);
      await loadSponsors();
    } catch (cause) {
      setSponsorSaveError(cause instanceof Error ? cause.message : "Could not save this sponsor.");
    } finally {
      setIsSavingSponsor(false);
    }
  };

  const deleteSponsor = async (sponsor: Sponsor) => {
    if (!functions || !window.confirm(`Delete ${sponsor.companyName} from the sponsor list?`)) return;
    setSponsorSaveError("");
    try {
      const remove = httpsCallable<{id: string}, {deleted: true}>(functions, "deleteEventSponsor");
      await remove({id: sponsor.id});
      await loadSponsors();
    } catch (cause) {
      setSponsorSaveError(cause instanceof Error ? cause.message : "Could not delete this sponsor.");
    }
  };

  const filteredData = registrations.filter((item) => {
    const matchesSearch =
      item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone?.includes(searchTerm) ||
      item.paymentReceipt?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" ? true : item.paymentStatus === activeTab;

    const matchesCategory =
      selectedCategory === "all" ? true : item.category === selectedCategory;

    return matchesSearch && matchesTab && matchesCategory;
  });

  const filteredDonations = donations.filter((item) => {
    const matchesSearch =
      item.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.donorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.paymentReceipt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.paymentReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeDonationTab === "all" || item.paymentStatus === activeDonationTab;
    return matchesSearch && matchesTab;
  });
  const verifiedDonationCount = donations.filter((donation) => donation.paymentStatus === "verified").length;
  const pendingDonationCount = donations.filter((donation) => donation.paymentStatus === "pending").length;

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
                {activeView === "donations" ? "General Donations" : "Miles for Minds 2027"}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 pl-11">
              {activeView === "donations" ? "General donor contributions and PayPal payment ledger." : "Event registration portal and PayPal payment ledger."}
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
                <button
                  onClick={() => {
                    setActiveView("donations");
                    void loadDonations();
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeView === "donations"
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  General Donations ({donations.length})
                </button>
              </div>

              <button
                onClick={() => {
                  const donationExport = activeView === "donations";
                  const headers = donationExport
                    ? ["Donor Name", "Email", "Amount", "Currency", "Payment Provider", "Receipt", "Reference", "Status", "Created At"]
                    : ["Name", "Age", "Gender", "Email", "Phone", "Category", "Payment Method", "Receipt", "Status"];
                  const rows = donationExport
                    ? donations.map((donation) => [donation.donorName, donation.donorEmail, donation.amount.toFixed(2), donation.currency, donation.paymentProvider, donation.paymentReceipt, donation.paymentReference, donation.paymentStatus, donation.createdAt])
                    : registrations.map((registration) => [registration.fullName, registration.age, registration.gender || "", registration.email, registration.phone, registration.category, registration.paymentMethod || "", registration.paymentReceipt || "", registration.paymentStatus]);
                  const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
                  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", donationExport ? "general_donations.csv" : "miles_for_minds_ledger.csv");
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeView === "donations") void loadDonations();
                  else if (activeView === "registrations") void loadRegistrations();
                  else void loadSponsors();
                }}
                disabled={activeView === "donations" ? isLoadingDonations : activeView === "registrations" ? isLoadingRegistrations : isLoadingSponsors}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
                title={activeView === "donations" ? "Refresh general donations" : activeView === "registrations" ? "Refresh participant registrations" : "Refresh event sponsors"}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${(activeView === "donations" ? isLoadingDonations : activeView === "registrations" ? isLoadingRegistrations : isLoadingSponsors) ? "animate-spin" : ""}`} />
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
                {verifiedCount} verified payment entries
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
                    placeholder="Search name, phone, PayPal receipt..."
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
                    <option value="Children's 1K">Children's 1K</option>
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
                          {item.paymentMethod ? `${item.paymentMethod === "paypal" ? "PayPal" : item.paymentMethod}: ` : "Payment: "}<span className="font-mono text-slate-800 font-medium">{item.paymentReceipt || "—"}</span>
                        </div>
                        {item.paymentStatus === "verified" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : item.paymentStatus === "failed" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                            Payment failed
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
        ) : activeView === "donations" ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-6 shadow-xs">
            <div className="flex flex-col gap-4 pb-6 border-b border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">General Donations</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Recent one-time contributions, separate from race tickets and sponsorships. Showing up to 500 records.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Verified donations</p>
                  <p className="text-lg font-bold text-slate-900">{verifiedDonationCount} of {donations.length}</p>
                  <p className="text-[11px] text-slate-400">Pending: {pendingDonationCount}</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                  {(["all", "verified", "pending", "failed"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setActiveDonationTab(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                        activeDonationTab === status ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {status === "all" ? `All (${donations.length})` : `${status} (${donations.filter((donation) => donation.paymentStatus === status).length})`}
                    </button>
                  ))}
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search donor, email, or receipt..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {isLoadingDonations ? (
                <div className="py-16 text-center text-slate-500">Loading general donations…</div>
              ) : donationLoadError ? (
                <div role="alert" className="py-10 text-center text-red-700 bg-red-50 rounded-xl border border-red-100">
                  <p>{donationLoadError}</p>
                  <p className="mt-1 text-xs text-red-600">Check that this signed-in account has a staff or superadmin record.</p>
                </div>
              ) : filteredDonations.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No general donations found for this filter.
                </div>
              ) : (
                filteredDonations.map((donation) => (
                  <div key={donation.id} className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-xs">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900">{donation.donorName}</h3>
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded">General</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{donation.donorEmail || "Email not provided"}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{donation.createdAt ? new Date(donation.createdAt).toLocaleString() : "Date unavailable"}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                      <div className="sm:text-right">
                        <p className="text-base font-bold text-slate-900">{donation.currency} {donation.amount.toFixed(2)}</p>
                        <p className="text-[11px] text-slate-500">{donation.paymentProvider ? `${donation.paymentProvider === "paypal" ? "PayPal" : donation.paymentProvider} · ` : ""}{donation.paymentReceipt || donation.paymentReference}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ${
                        donation.paymentStatus === "verified" ? "text-emerald-700 bg-emerald-50 border border-emerald-200" :
                          donation.paymentStatus === "failed" ? "text-red-700 bg-red-50 border border-red-200" :
                            "text-amber-700 bg-amber-50 border border-amber-200"
                      }`}>
                        {donation.paymentStatus === "verified" ? <CheckCircle2 className="w-3 h-3" /> : donation.paymentStatus === "pending" ? <Clock className="w-3 h-3" /> : null}
                        {donation.paymentStatus === "verified" ? "Verified" : donation.paymentStatus === "failed" ? "Failed" : "Pending"}
                      </span>
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
                type="button"
                onClick={() => openSponsorEditor()}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Add Sponsor
              </button>
            </div>

            {sponsorSaveError && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{sponsorSaveError}</p>}

            <div className="mt-6 flex flex-col gap-3">
              {isLoadingSponsors ? (
                <div className="py-16 text-center text-slate-500">Loading sponsors…</div>
              ) : sponsorLoadError ? (
                <div role="alert" className="py-10 text-center text-red-700 bg-red-50 rounded-xl border border-red-100">
                  <p>{sponsorLoadError}</p>
                  <p className="mt-1 text-xs text-red-600">Check that this signed-in account has a staff or superadmin record.</p>
                </div>
              ) : sponsors.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No event sponsors yet. Add a sponsor to start the list.
                </div>
              ) : sponsors.map((sponsor) => (
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
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span>Contact: {sponsor.contactPerson}</span>
                        <span>•</span>
                        <span>{sponsor.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 mb-0.5">
                        KSh {sponsor.amount.toLocaleString("en-US")}
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
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openSponsorEditor(sponsor)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"
                        title={`Edit ${sponsor.companyName}`}
                        aria-label={`Edit ${sponsor.companyName}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteSponsor(sponsor)}
                        className="p-2 text-slate-500 hover:text-red-700 hover:bg-white rounded-lg border border-transparent hover:border-red-200"
                        title={`Delete ${sponsor.companyName}`}
                        aria-label={`Delete ${sponsor.companyName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sponsorEditorOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={(event) => void saveSponsor(event)} className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{editingSponsor ? "Edit sponsor" : "Add sponsor"}</h2>
                  <p className="text-xs text-slate-500 mt-1">Changes are saved to the event sponsor list.</p>
                </div>
                <button type="button" onClick={() => setSponsorEditorOpen(false)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg" aria-label="Close sponsor editor">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5">
                <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                  Company or organization
                  <input required maxLength={150} value={sponsorForm.companyName} onChange={(event) => setSponsorForm({...sponsorForm, companyName: event.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 focus:outline-none focus:border-emerald-600" />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Contact person
                  <input required maxLength={150} value={sponsorForm.contactPerson} onChange={(event) => setSponsorForm({...sponsorForm, contactPerson: event.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 focus:outline-none focus:border-emerald-600" />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Contact email
                  <input required type="email" maxLength={254} value={sponsorForm.email} onChange={(event) => setSponsorForm({...sponsorForm, email: event.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 focus:outline-none focus:border-emerald-600" />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Amount (KSh)
                  <input required type="text" inputMode="numeric" placeholder="Enter any amount" value={sponsorForm.amount} onChange={(event) => setSponsorForm({...sponsorForm, amount: formatKshInput(event.target.value)})} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 focus:outline-none focus:border-emerald-600" />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Status
                  <select value={sponsorForm.status} onChange={(event) => setSponsorForm({...sponsorForm, status: event.target.value as Sponsor["status"]})} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 focus:outline-none focus:border-emerald-600">
                    <option value="Pledged">Pledged</option>
                    <option value="Confirmed">Confirmed</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 self-end pb-2 text-xs font-medium text-slate-700">
                  <input type="checkbox" checked={sponsorForm.logoSubmitted} onChange={(event) => setSponsorForm({...sponsorForm, logoSubmitted: event.target.checked})} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                  Sponsor logo received
                </label>
              </div>

              {sponsorSaveError && <p role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{sponsorSaveError}</p>}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setSponsorEditorOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSavingSponsor} className="px-4 py-2 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{isSavingSponsor ? "Saving…" : editingSponsor ? "Save changes" : "Add sponsor"}</button>
              </div>
            </form>
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
                  <span className="text-slate-400 block mb-1">Payment receipt or reference</span>
                  <span className="text-emerald-700 font-mono font-bold text-sm">{selectedParticipant.paymentReceipt || "Pending Payment"}</span>
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
