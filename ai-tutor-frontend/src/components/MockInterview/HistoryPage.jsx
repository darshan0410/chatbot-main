// src/components/MockInterview/HistoryPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaHistory, FaTrash, FaEye } from "react-icons/fa";
import "./MockInterview.css";

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("interview_history") || "[]"); } catch { return []; }
  });
  const [selectedHistory, setSelectedHistory] = useState(null);

  const deleteSession = (id) => {
    const updated = history.filter((x) => x.id !== id);
    setHistory(updated);
    localStorage.setItem("interview_history", JSON.stringify(updated));
  };

  // ── Detail View ──
  if (selectedHistory) {
    const fl = selectedHistory.feedbackList || [];
    const avgScore = selectedHistory.avgScore || "0";
    const avgConf = fl.length ? (fl.reduce((s, f) => s + (f.confidence || 0), 0) / fl.length).toFixed(1) : "0";
    const avgComm = fl.length ? (fl.reduce((s, f) => s + (f.communication || 0), 0) / fl.length).toFixed(1) : "0";
    const avgCorr = fl.length ? (fl.reduce((s, f) => s + (f.correctness || 0), 0) / fl.length).toFixed(1) : "0";
    const scoreNum = parseFloat(avgScore);
    const r = 60; const c = 2 * Math.PI * r; const p = (scoreNum / 10) * c;

    return (
      <div className="mi-container">
        <div className="iv-dashboard fade-in">
          <div className="dash-header">
            <div className="dash-header-left">
              <button className="dash-back" onClick={() => setSelectedHistory(null)}><FaArrowLeft /></button>
              <div>
                <h2 className="dash-title">{selectedHistory.role}</h2>
                <p className="dash-subtitle">{selectedHistory.difficulty} • {selectedHistory.experience} • {new Date(selectedHistory.date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="dash-grid-2">
            <div className="dash-card">
              <p className="dash-card-title">Overall Performance</p>
              <div className="dash-donut-wrap">
                <svg width="150" height="150" viewBox="0 0 150 150">
                  <circle cx="75" cy="75" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle cx="75" cy="75" r={r} fill="none" stroke="#22c55e" strokeWidth="10"
                    strokeDasharray={c} strokeDashoffset={c - p}
                    strokeLinecap="round" transform="rotate(-90 75 75)"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <span className="dash-donut-score">{avgScore}</span>
              </div>
              <p className="dash-donut-sub">Out of 10</p>
            </div>

            <div className="dash-card">
              <p className="dash-card-title">Skill Evaluation</p>
              {[
                { label: "Confidence", value: avgConf },
                { label: "Communication", value: avgComm },
                { label: "Correctness", value: avgCorr },
              ].map((s) => (
                <div key={s.label} className="dash-skill-row">
                  <div className="dash-skill-head">
                    <span>{s.label}</span>
                    <span className="dash-skill-val">{s.value}</span>
                  </div>
                  <div className="dash-bar-bg">
                    <div className="dash-bar-fill" style={{ width: `${(s.value / 10) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-card" style={{ width: "100%", marginBottom: "20px" }}>
            <p className="dash-card-title">Question Breakdown</p>
            {fl.map((f, i) => (
              <div key={i} className="dash-q-card">
                <div className="dash-q-header">
                  <span className="dash-q-label">Question {i + 1}</span>
                  <span className={`dash-q-score ${f.finalScore >= 7 ? "good" : f.finalScore >= 4 ? "ok" : "low"}`}>
                    {f.finalScore} / 10
                  </span>
                </div>
                <p className="dash-q-text">{f.question}</p>
                <div className="dash-q-fb">
                  <span className="dash-q-fb-label">AI Feedback</span>
                  <p>{f.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="mi-container">
      <div className="iv-dashboard fade-in">
        <div className="dash-header">
          <div className="dash-header-left">
            <button className="dash-back" onClick={() => navigate("/")}>
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="dash-title">Interview History</h2>
              <p className="dash-subtitle">{history.length} past interview{history.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="hist-empty">
            <FaHistory size={48} color="#e2e8f0" />
            <h3>No interviews yet</h3>
            <p>Complete your first mock interview to see your history here.</p>
            <button className="setup-start-btn green-btn" style={{ maxWidth: "280px", marginTop: "16px" }}
              onClick={() => navigate("/")}>
              Start First Interview
            </button>
          </div>
        ) : (
          <div className="hist-list">
            {history.map((h) => {
              const isCompleted = parseFloat(h.avgScore) > 0;
              const dateStr = new Date(h.date).toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });
              return (
                <div key={h.id} className="nhc-card" onClick={() => setSelectedHistory(h)}>
                  <div className="nhc-left">
                    <h4>{h.role}</h4>
                    <p>Looking for {h.role.toLowerCase()} role. • {h.difficulty}</p>
                    <span className="nhc-date">{dateStr}</span>
                  </div>
                  <div className="nhc-right">
                    <div className="nhc-score-col">
                      <span className="nhc-score-val" style={{ color: isCompleted ? '#22c55e' : '#475569' }}>{h.avgScore}/10</span>
                      <span className="nhc-score-label">Overall Score</span>
                    </div>
                    <div className="hist-info">
                      <h4>{h.role}</h4>
                      <p>{h.difficulty} • {h.experience}</p>
                      <span className="hist-date">
                        {new Date(h.date).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="hist-card-actions">
                    <button className="hist-view-btn" onClick={() => setSelectedHistory(h)} title="View report">
                      <FaEye size={14} /> View
                    </button>
                    <button className="hist-del-btn" onClick={() => deleteSession(h.id)} title="Delete">
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
