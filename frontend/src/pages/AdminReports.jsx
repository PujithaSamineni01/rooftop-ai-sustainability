import React from "react";

export default function AdminReports() {
  return (
    <div className="page-card">
      <h2>Admin Reports</h2>
      <p style={{ color: "#475569" }}>
        Admin-only insights including usage analytics, top recommendations, and impact metrics.
      </p>

      <div style={{ padding: 12, background: "#f8fafc", borderRadius: 8 }}>
        <strong>Coming soon:</strong>
        <div>• Analysis trends</div>
        <div>• Impact forecasts</div>
        <div>• User activity insights</div>
      </div>
    </div>
  );
}
