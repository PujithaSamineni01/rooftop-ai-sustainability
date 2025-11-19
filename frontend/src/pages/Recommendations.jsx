// src/pages/Recommendations.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory, useLocation } from "react-router-dom";
import sampleData from "../data/sample_recommendation.json";

function numberFormat(n, digits = 0) {
  if (n == null || isNaN(Number(n))) return "-";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function toTitleCase(str) {
  if (!str) return "";
  return str
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedFlavor, setExpandedFlavor] = useState(null);
  const history = useHistory();
  const location = useLocation();
  const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
  const useLocal = new URLSearchParams(location.search).get("local") === "true";

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    if (useLocal) {
      setData(sampleData);
      setLoading(false);
      return () => (mounted = false);
    }

    axios
      .get(`${backend}/recommendations`)
      .then((resp) => {
        if (!mounted) return;
        setData(resp.data);
      })
      .catch((err) => {
        console.warn("No recommendations from backend — using local sample.", err?.message || err);
        if (mounted) setData(sampleData);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [backend, useLocal]);

  if (loading) {
    return (
      <div className="page-card">
        <h2>Recommendations & Savings</h2>
        <div>Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-card">
        <h2>Recommendations & Savings</h2>
        <p>No analysis found (and no local sample available).</p>
        <p>
          Please run the rooftop analysis from <button onClick={() => history.push("/")}>Home</button>.
        </p>
      </div>
    );
  }

  // mapped fields
  const usableArea = data.cv_usable_area_m2 ?? data.assumptions?.usable_area_m2 ?? null;
  const flavors = data.system_generated_flavors || [];
  const userRecs = data.user_recommendations || [];
  const impact = data.impact || {};
  const assumptions = data.assumptions || {};

  // only high-confidence
  const highConfidenceFlavors = flavors.filter((f) => (f.confidence || "").toString().toLowerCase() === "high");

  const totalHighKwh = highConfidenceFlavors.reduce((sum, f) => sum + (Number(f.total_est_annual_kwh) || 0), 0);
  const totalHighCo2 = highConfidenceFlavors.reduce((sum, f) => sum + (Number(f.total_est_annual_co2_kg) || 0), 0);

  return (
    <div className="page-card recommendations-page" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 680px", minWidth: 320 }}>
        <div className="rec-header">
          <div>
            <h2 style={{ margin: 0 }}>Recommendations & Savings</h2>
            <div className="muted">Recommendations for roof <strong>{data.roof_id}</strong></div>
            <div className="muted small" style={{ marginTop: 8 }}>
              Usable rooftop area (CV): <strong>{usableArea != null ? `${numberFormat(usableArea)} m²` : "N/A"}</strong>
            </div>
          </div>

          <div className="rec-summary-block">
            {/* <div className="rec-summary-values">
              <div className="rec-summary-label">High-confidence total</div>
              <div className="rec-summary-kwh">{numberFormat(totalHighKwh)} kWh / yr</div>
              <div className="rec-summary-co2">{numberFormat(totalHighCo2)} kg CO₂ / yr</div>
            </div> */}
            <button className="small-cta" onClick={() => history.push("/")}>Run another analysis</button>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          {highConfidenceFlavors.length === 0 ? (
            <div className="empty-card">
              <strong>No high-confidence recommendations found</strong>
              <div className="muted" style={{ marginTop: 8 }}>
                There are no items with confidence = <code>high</code> in the latest result. Try running another analysis or view all recommendations.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {highConfidenceFlavors.map((flavor, idx) => {
                const key = flavor.flavor || `flavor-${idx}`;
                const isOpen = expandedFlavor === key;
                return (
                  <article key={key} className="rec-card">
                    <header className="rec-card-header">
                      <div>
                        <h3 className="rec-card-title">{toTitleCase(flavor.flavor)}</h3>
                        <div className="rec-card-sub">{flavor.summary}</div>
                      </div>

                      <div className="rec-card-right">
                        <div className="rec-badge">High</div>
                        <div className="rec-card-meta">
                          <div className="muted small">Estimated</div>
                          <div className="meta-values">
                            <div className="meta-kwh">{numberFormat(flavor.total_est_annual_kwh)} kWh</div>
                            <div className="meta-co2">{numberFormat(flavor.total_est_annual_co2_kg)} kg CO₂</div>
                          </div>
                        </div>

                        <button
                          className="btn-view"
                          onClick={() => setExpandedFlavor(isOpen ? null : key)}
                          aria-expanded={isOpen}
                        >
                          {isOpen ? "Hide details" : "View details"}
                        </button>
                      </div>
                    </header>

                    {isOpen && (
                      <div className="rec-card-body">
                        {flavor.interventions && flavor.interventions.length > 0 ? (
                          <div className="interventions-list">
                            {flavor.interventions.map((it, i) => (
                              <div key={i} className="intervention">
                                <div className="intervention-head">
                                  <strong>{it.title || it.name || `Intervention ${i + 1}`}</strong>
                                  <div className="muted small">{it.est_energy_kwh_per_year ? `${numberFormat(it.est_energy_kwh_per_year)} kWh/yr` : ""}</div>
                                </div>

                                {it.description && <p className="muted">{it.description}</p>}

                                {it.details && (
                                  <div className="intervention-details">
                                    {it.details.capacity_kw != null && <div>Capacity: {numberFormat(it.details.capacity_kw, 2)} kW</div>}
                                    {it.details.panels_est != null && <div>Panels: {it.details.panels_est}</div>}
                                    {it.details.usable_area_m2 != null && <div>Area used: {numberFormat(it.details.usable_area_m2)} m²</div>}
                                    {it.details.battery_kwh != null && <div>Battery: {it.details.battery_kwh} kWh</div>}
                                    {it.details.cooling_savings_pct != null && <div>Cooling save: {Math.round(it.details.cooling_savings_pct * 100)}%</div>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="muted">No interventions listed for this flavor.</div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* User recommendations */}
        <section style={{ marginTop: 22 }}>
          <h3 style={{ marginBottom: 8 }}>User recommendations</h3>
          <div className="user-rec-grid">
            {userRecs.length === 0 ? (
              <div className="muted">No user recommendations available.</div>
            ) : (
              userRecs.map((u, i) => (
                <div key={i} className="user-rec">
                  <div>
                    <div style={{ fontWeight: 700 }}>{u.name}</div>
                    <div className="muted small">{u.category}</div>
                  </div>
                  <div style={{ textAlign: "right", fontWeight: 700 }}>{u.estimated_cost}</div>
                  {u.description && <div className="muted" style={{ marginTop: 8 }}>{u.description}</div>}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Right column: Impact */}
      <aside style={{ width: 340, minWidth: 260 }}>
        <div className="savings-widget">
          <div className="savings-header">
            <h3 style={{ margin: 0 }}>Impact summary</h3>
            <small className="muted">Engine assumptions & impact metrics</small>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="impact-row">
              <div className="impact-label">Energy savings</div>
              <div className="impact-value">{numberFormat(impact.energy_savings_kwh)} kWh</div>
            </div>

            <div className="impact-row">
              <div className="impact-label">Air quality score</div>
              <div className="impact-value">{impact.air_quality_score ?? "-"}</div>
            </div>

            <div className="impact-row">
              <div className="impact-label">Biodiversity gain</div>
              <div className="impact-value">{impact.biodiversity_gain ?? "-"}</div>
            </div>

            <div className="impact-row">
              <div className="impact-label">Stormwater reduction</div>
              <div className="impact-value">{numberFormat(impact.stormwater_reduction_liters)} L</div>
            </div>
          </div>

          {/* <div className="savings-divider" />

          <div className="assumptions">
            <div className="muted"><strong>Assumptions</strong></div>
            <div className="muted small">Sun hours: {assumptions.sun_hours_source ?? "-"}</div>
            <div className="muted small">Usable area: {assumptions.usable_area_m2 ? `${numberFormat(assumptions.usable_area_m2)} m²` : "-"}</div>
            <div className="muted small">Rainfall factor: {assumptions.rainfall_factor ?? "-"}</div>
          </div>

          <div style={{ marginTop: 14 }}>
            <button className="small-cta" onClick={() => history.push("/")}>Run another analysis</button>
          </div> */}
        </div>
      </aside>
    </div>
  );
}
