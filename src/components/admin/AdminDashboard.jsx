import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Users, ShieldCheck, AlertTriangle, Building2, Download, Search, CheckCircle2, XCircle, Award, Eye, FileSpreadsheet, MapPin, Activity, Flame, ShieldAlert, Sparkles, FileText } from 'lucide-react';
import { TRANSLATIONS } from '../../locales/translations';
import { getWorkerRoster } from '../../utils/offlineStorage';

export default function AdminDashboard({ currentLang, onOpenScanner, onViewWorkerCert }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  
  const [roster, setRoster] = useState(getWorkerRoster());
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');

  const totalCount = roster.length;
  const certifiedCount = roster.filter(w => w.certified).length;
  const passRate = Math.round((certifiedCount / totalCount) * 100);
  const under30Count = roster.filter(w => w.orientationDays <= 30).length;

  const mineClusters = [
    { name: "Jharia Coalfield, Dhanbad", certified: 420, activeWorkers: 450, risk: "High Methane", passPct: 93, color: "from-red-600 to-amber-600" },
    { name: "Bokaro Steel Plant Unit 4", certified: 310, activeWorkers: 340, risk: "Thermal Blast", passPct: 91, color: "from-blue-600 to-cyan-600" },
    { name: "Giridih Mica Processing Hub", certified: 180, activeWorkers: 210, risk: "Confined Dust", passPct: 86, color: "from-purple-600 to-indigo-600" },
    { name: "Tata Steel Colliery, Digwadih", certified: 290, activeWorkers: 300, risk: "Heavy Machinery", passPct: 96, color: "from-emerald-600 to-teal-600" }
  ];

  const filteredRoster = roster.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.mineSector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'all' || w.mineSector.toLowerCase().includes(sectorFilter.toLowerCase());
    return matchesSearch && matchesSector;
  });

  const exportCSV = () => {
    const headers = ["Worker ID", "Name", "Language", "Mine Sector", "Orientation Days", "Pass Score %", "Certified", "Certificate Hash", "Date"];
    const rows = roster.map(w => [
      w.id,
      `"${w.name}"`,
      w.language,
      `"${w.mineSector}"`,
      w.orientationDays,
      w.score,
      w.certified ? "YES" : "NO",
      w.certHash || "N/A",
      w.certDate || "N/A"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DGMS_Safety_Audit_Report_Jharkhand_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDFReport = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 297, 'F');

      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(1.5);
      doc.rect(6, 6, 198, 285);

      doc.setTextColor(245, 158, 11);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("DGMS INDUSTRIAL SAFETY AUDIT REPORT", 105, 18, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(226, 232, 240);
      doc.text("Cluster Compliance Telemetry - Dhanbad, Bokaro, Jamshedpur & Giridih", 105, 25, { align: 'center' });

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated On: ${new Date().toLocaleString()}  |  Factories Act 1948 & Mines Act 1952 Standards`, 105, 31, { align: 'center' });

      // Summary Box
      doc.setFillColor(30, 41, 59);
      doc.rect(12, 38, 186, 26, 'F');

      doc.setFontSize(10);
      doc.setTextColor(245, 158, 11);
      doc.text(`Total Workers Tracked: ${totalCount}`, 20, 48);
      doc.text(`Compliance Pass Rate: ${passRate}%`, 110, 48);
      doc.text(`Certified Recruits: ${certifiedCount}`, 20, 56);
      doc.text(`Orientation <30 Days: ${under30Count} Workers`, 110, 56);

      // Mine Clusters Summary Table
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text("REGIONAL MINE & PLANT CLUSTER TELEMETRY", 12, 74);

      let yPos = 82;
      mineClusters.forEach(cluster => {
        doc.setFillColor(30, 41, 59);
        doc.rect(12, yPos, 186, 12, 'F');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(cluster.name, 16, yPos + 7);
        doc.setTextColor(239, 68, 68);
        doc.text(`[${cluster.risk}]`, 95, yPos + 7);
        doc.setTextColor(16, 185, 129);
        doc.text(`Pass Rate: ${cluster.passPct}% (${cluster.certified}/${cluster.activeWorkers})`, 140, yPos + 7);
        yPos += 15;
      });

      // Roster Table Header
      yPos += 5;
      doc.setFontSize(11);
      doc.setTextColor(245, 158, 11);
      doc.text("WORKER SAFETY EVALUATION ROSTER", 12, yPos);
      yPos += 8;

      doc.setFillColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("ID / Name", 16, yPos);
      doc.text("Sector", 70, yPos);
      doc.text("Tenure", 125, yPos);
      doc.text("Score", 155, yPos);
      doc.text("Status", 175, yPos);
      yPos += 6;

      roster.slice(0, 12).forEach(w => {
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(`${w.id} - ${w.name.substring(0, 16)}`, 16, yPos);
        doc.text(w.mineSector.substring(0, 22), 70, yPos);
        doc.text(`${w.orientationDays} Days`, 125, yPos);
        doc.text(`${w.score}%`, 155, yPos);
        if (w.certified) {
          doc.setTextColor(16, 185, 129);
          doc.text("CERTIFIED", 175, yPos);
        } else {
          doc.setTextColor(239, 68, 68);
          doc.text("PENDING", 175, yPos);
        }
        yPos += 6;
      });

      doc.save(`DGMS_Cluster_Safety_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Audit PDF Report Export Error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border-2 border-amber-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black tracking-wider uppercase flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>DGMS DHANBAD COMPLIANCE AUDIT PORTAL</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            {t.adminTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.adminSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-2xl text-xs font-black flex items-center space-x-1.5 border border-slate-700 shadow-lg"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Verify QR</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-2xl text-xs shadow-md border border-slate-700 flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportPDFReport}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-xl hover:brightness-110 flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Audit PDF Report</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center space-x-4">
          <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/30">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t.totalWorkers}</p>
            <h3 className="text-3xl font-black text-white mt-1">{totalCount}</h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center space-x-4">
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t.passRate}</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-1">{passRate}%</h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center space-x-4">
          <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/30">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t.orientationUnder30}</p>
            <h3 className="text-3xl font-black text-amber-400 mt-1">{under30Count} Workers</h3>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center space-x-4">
          <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/30">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Jharkhand Industrial Hubs</p>
            <h3 className="text-3xl font-black text-white mt-1">4 Sectors</h3>
          </div>
        </div>
      </div>

      {/* Interactive Mine Clusters Map Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>Jharkhand Regional Mine & Plant Cluster Telemetry</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mineClusters.map((cluster, idx) => (
            <div key={idx} className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-black text-white leading-tight">{cluster.name}</h4>
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1 block">
                    {cluster.risk}
                  </span>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-400 font-medium">Compliance Rate</span>
                <span className="font-mono font-black text-emerald-400">{cluster.passPct}%</span>
              </div>

              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className={`h-full bg-gradient-to-r ${cluster.color}`} style={{ width: `${cluster.passPct}%` }} />
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                {cluster.certified} / {cluster.activeWorkers} Certified Recruits
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search worker name, ID or mine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
            {['all', 'dhanbad', 'bokaro', 'giridih'].map((sector) => (
              <button
                key={sector}
                onClick={() => setSectorFilter(sector)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all ${
                  sectorFilter === sector
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>

        {/* Worker Roster Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-extrabold text-[10px] border-b border-slate-800 tracking-wider">
              <tr>
                <th className="p-4">Worker ID & Name</th>
                <th className="p-4">Language</th>
                <th className="p-4">Mine Sector</th>
                <th className="p-4">Field Tenure</th>
                <th className="p-4">Score</th>
                <th className="p-4">Certification</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRoster.map((worker) => (
                <tr key={worker.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="font-extrabold text-white text-xs">{worker.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{worker.id}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 text-[10px] uppercase font-bold border border-slate-700">
                      {worker.language === 'sat' ? 'Ol Chiki' : worker.language}
                    </span>
                  </td>
                  <td className="p-4 font-semibold">{worker.mineSector}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      worker.orientationDays <= 30 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {worker.orientationDays} Days
                    </span>
                  </td>
                  <td className="p-4 font-black text-white text-sm">{worker.score}%</td>
                  <td className="p-4">
                    {worker.certified ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Certified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {worker.certified && (
                      <button
                        onClick={() => onViewWorkerCert(worker)}
                        className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 rounded-xl text-[11px] font-bold border border-amber-500/30 flex items-center space-x-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Cert</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
