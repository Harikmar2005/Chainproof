import { useState, useEffect } from "react";
import { getReports, clearReports } from "../services/api";
import SecurityIntelligenceReport from "../components/SecurityIntelligenceReport";
import { 
    LightningIcon, 
    TrashIcon, 
    SearchIcon, 
    FileTextIcon, 
    DownloadIcon, 
    AlertTriangleIcon,
    ShieldAlertIcon,
    ShieldCheckIcon,
    ShieldIcon
} from "../components/Icons";

function Reports({ onRouteChange }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [severityFilter, setSeverityFilter] = useState("ALL");
    const [decisionFilter, setDecisionFilter] = useState("ALL");
    const [clearing, setClearing] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    const loadReports = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getReports();
            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Unable to fetch report history from backend.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const handleClear = async () => {
        if (!window.confirm("Are you sure you want to permanently clear all scan reports?")) {
            return;
        }

        try {
            setClearing(true);
            await clearReports();
            setReports([]);
            setSelectedReport(null);
        } catch (err) {
            alert(err.message || "Failed to clear scan history.");
        } finally {
            setClearing(false);
        }
    };

    const handleExportJSON = (report) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `chainproof-report-${(report.image || "image").replace(/[:/]/g, "_")}-${report.id || "scan"}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    const handleReportUpdated = (updatedReport) => {
        setSelectedReport(updatedReport);
        setReports((prev) => 
            prev.map((r) => (r.scan_id === updatedReport.scan_id ? updatedReport : r))
        );
    };

    const filteredReports = reports.filter((r) => {
        const matchesSearch = !searchTerm || r.image?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = severityFilter === "ALL" || r.severity?.toUpperCase() === severityFilter;
        
        const reportDecision = (r.ai_analysis?.security_decision || (r.severity === "CRITICAL" ? "BLOCK" : "REVIEW")).toUpperCase();
        const matchesDecision = decisionFilter === "ALL" || reportDecision === decisionFilter;

        return matchesSearch && matchesSeverity && matchesDecision;
    });

    const getDecisionBadge = (report) => {
        const decision = (report.ai_analysis?.security_decision || (report.severity === "CRITICAL" ? "BLOCK" : report.severity === "LOW" ? "TRUST" : "REVIEW")).toUpperCase();
        if (decision === "BLOCK") {
            return (
                <span className="decision-badge badge-block">
                    <ShieldAlertIcon size={12} /> BLOCK
                </span>
            );
        }
        if (decision === "TRUST") {
            return (
                <span className="decision-badge badge-trust">
                    <ShieldCheckIcon size={12} /> TRUST
                </span>
            );
        }
        return (
            <span className="decision-badge badge-review">
                <ShieldIcon size={12} /> REVIEW
            </span>
        );
    };

    return (
        <main className="reports-page" id="main-content">
            <div className="reports-container">
                {/* Page Header */}
                <div className="reports-header-section">
                    <div>
                        <div className="breadcrumb-nav">
                            <button type="button" onClick={() => onRouteChange("dashboard")}>Dashboard</button>
                            <span>/</span>
                            <span>Audit Reports</span>
                        </div>
                        <h1>Security Audit Records</h1>
                        <p>Enterprise container vulnerability ledger, ML classification archives, and AI security decisions.</p>
                    </div>

                    <div className="reports-header-actions">
                        <button
                            type="button"
                            className="cta-button primary"
                            onClick={() => onRouteChange("scan")}
                        >
                            <LightningIcon size={16} /> New Security Scan
                        </button>
                        {reports.length > 0 && (
                            <button
                                type="button"
                                className="btn-danger"
                                onClick={handleClear}
                                disabled={clearing}
                            >
                                <TrashIcon size={15} /> {clearing ? "Clearing..." : "Clear Ledger"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters & Search Bar */}
                <div className="reports-controls">
                    <div className="search-input-wrapper">
                        <SearchIcon size={16} className="search-icon-svg" />
                        <input
                            type="text"
                            placeholder="Filter by image name (e.g. alpine, juice-shop, python)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Filter reports by container image"
                        />
                        {searchTerm && (
                            <button 
                                type="button" 
                                className="clear-search-btn"
                                onClick={() => setSearchTerm("")}
                                aria-label="Clear search input"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="filters-group-row">
                        {/* Severity Filter */}
                        <div className="filter-pills" role="group" aria-label="Filter by severity">
                            <span className="filter-group-label">Severity:</span>
                            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
                                <button
                                    key={sev}
                                    type="button"
                                    className={`filter-pill ${severityFilter === sev ? "active" : ""}`}
                                    onClick={() => setSeverityFilter(sev)}
                                >
                                    {sev}
                                </button>
                            ))}
                        </div>

                        {/* Decision Filter */}
                        <div className="filter-pills" role="group" aria-label="Filter by decision">
                            <span className="filter-group-label">Decision:</span>
                            {["ALL", "BLOCK", "REVIEW", "TRUST"].map((dec) => (
                                <button
                                    key={dec}
                                    type="button"
                                    className={`filter-pill ${decisionFilter === dec ? "active" : ""}`}
                                    onClick={() => setDecisionFilter(dec)}
                                >
                                    {dec}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="reports-loading-box">
                        <div className="spinner"></div>
                        <p>Loading security audit ledger...</p>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="reports-error-banner" role="alert">
                        <AlertTriangleIcon size={18} />
                        <div>
                            <strong>Error Loading Records:</strong> {error}
                        </div>
                        <button type="button" onClick={loadReports} className="retry-btn">
                            Retry
                        </button>
                    </div>
                )}

                {/* Content Table or Empty State */}
                {!loading && !error && (
                    <>
                        {filteredReports.length === 0 ? (
                            <div className="reports-empty-state">
                                <FileTextIcon size={44} className="empty-icon-svg" />
                                <h2>No Audit Records Found</h2>
                                <p>
                                    {reports.length === 0 
                                        ? "No container images have been scanned yet. Initiate your first scan!" 
                                        : "No reports matched the specified filter parameters."}
                                </p>
                                {reports.length === 0 ? (
                                    <button
                                        type="button"
                                        className="cta-button primary"
                                        onClick={() => onRouteChange("scan")}
                                    >
                                        <LightningIcon size={16} /> Scan Container Image
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => { setSearchTerm(""); setSeverityFilter("ALL"); setDecisionFilter("ALL"); }}
                                    >
                                        Reset Filter Criteria
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="reports-table-card">
                                <div className="table-responsive">
                                    <table className="reports-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Container Image</th>
                                                <th>Date &amp; Time</th>
                                                <th>Risk Score</th>
                                                <th>Severity</th>
                                                <th>Vulnerabilities</th>
                                                <th>Signature</th>
                                                <th>AI Decision</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReports.map((report, idx) => {
                                                const totalVulns = report.vulnerabilities?.total || 0;
                                                const sevClass = (report.severity || "UNKNOWN").toLowerCase();

                                                return (
                                                    <tr key={report.id || report.scan_id || idx}>
                                                        <td>
                                                            <span className="report-id-badge">#{report.id || idx + 1}</span>
                                                        </td>
                                                        <td>
                                                            <strong className="image-name-cell">{report.image}</strong>
                                                            {report.scan_id && (
                                                                <span className="scan-uuid">{report.scan_id.slice(0, 8)}...</span>
                                                            )}
                                                        </td>
                                                        <td className="timestamp-cell">
                                                            {report.timestamp || "Recent"}
                                                        </td>
                                                        <td>
                                                            <div className="score-pill-wrapper">
                                                                <span className={`score-badge ${sevClass}`}>
                                                                    {report.risk_score ?? "—"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`status-pill ${sevClass}`}>
                                                                {report.severity || "UNKNOWN"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="vuln-count-text">
                                                                {totalVulns > 0 ? `${totalVulns} CVEs` : "0 CVEs"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`signature-status ${report.signature?.verified ? "verified" : "unverified"}`}>
                                                                {report.signature?.verified ? "Verified" : "Unsigned"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {getDecisionBadge(report)}
                                                        </td>
                                                        <td>
                                                            <div className="row-actions">
                                                                <button
                                                                    type="button"
                                                                    className="action-btn view-btn"
                                                                    onClick={() => setSelectedReport(report)}
                                                                    title="Open Comprehensive Security Report"
                                                                >
                                                                    Inspect
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="action-btn export-btn"
                                                                    onClick={() => handleExportJSON(report)}
                                                                    title="Export Raw JSON"
                                                                >
                                                                    <DownloadIcon size={13} /> JSON
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Comprehensive Security Intelligence Report Modal */}
                {selectedReport && (
                    <div className="report-modal-overlay" onClick={() => setSelectedReport(null)} role="dialog" aria-modal="true">
                        <div className="report-modal report-modal-wide" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-top-bar">
                                <span className="modal-title-label">ChainProof Enterprise Security Inspector</span>
                                <button
                                    type="button"
                                    className="modal-close-btn"
                                    onClick={() => setSelectedReport(null)}
                                    aria-label="Close modal"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="modal-body-scroll">
                                <SecurityIntelligenceReport
                                    reportData={selectedReport}
                                    onUpdateReport={handleReportUpdated}
                                    onClose={() => setSelectedReport(null)}
                                    isModal={true}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default Reports;
