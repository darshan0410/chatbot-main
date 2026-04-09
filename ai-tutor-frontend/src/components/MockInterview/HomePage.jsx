// src/components/MockInterview/HomePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaRobot, FaMicrophone, FaRegClock, FaMagic, FaUser, FaBriefcase, FaChartLine, FaFileUpload, FaChartBar, FaFileAlt, FaFilePdf, FaHistory } from "react-icons/fa";
import "./MockInterview.css";

import imgEval from "../../assets/ai_evaluation.png";
import imgResume from "../../assets/resume_interview.png";
import imgPdf from "../../assets/pdf_report.png";
import imgHistory from "../../assets/history_analytics.png";

import imgHr from "../../assets/hr_mode.png";
import imgTech from "../../assets/tech_mode.png";
import imgConf from "../../assets/confidence_mode.png";
import imgCredits from "../../assets/credits_mode.png";

const HomePage = () => {
  const navigate = useNavigate();

  // Setup state
  const [role, setRole] = useState("Frontend Developer");
  const [experience, setExperience] = useState("2 years");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [resumeText, setResumeText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const difficulties = ["Beginner", "Intermediate", "Advanced"];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await axios.post("http://localhost:5000/api/interview/upload-resume", formData);
      if (res.data.success) {
        setResumeText(res.data.text);
        setUploadedFileName(file.name);
        setResumeAnalysis(null);
      } else alert("Failed to parse resume.");
    } catch { alert("Error uploading resume."); }
    setUploading(false);
  };

  const analyzeResume = async () => {
    if (!resumeText) return;
    setAnalyzing(true);
    try {
      const res = await axios.post("http://localhost:5000/api/interview/extract-resume", { resumeText });
      if (res.data.success) setResumeAnalysis(res.data.data);
      else alert("Failed to analyze resume.");
    } catch { alert("Error analyzing resume."); }
    setAnalyzing(false);
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/interview/generate-questions", {
        role, experience, mode: difficulty,
        projectText: resumeAnalysis?.projects?.join(", ") || "Standard Portfolio",
        skillsText: resumeAnalysis?.skills?.join(", ") || resumeText,
        safeResume: resumeText,
      });
      if (res.data.success && res.data.questions.length > 0) {
        navigate("/interview", {
          state: {
            questions: res.data.questions,
            role, experience, difficulty,
            resumeAnalysis,
          }
        });
      } else alert("Failed to generate questions. Please try again.");
    } catch { alert("Error connecting to server."); }
    setLoading(false);
  };

  return (
    <div className={`mi-container ${!showSetup ? "landing-mode" : ""}`}>

      {/* ── LANDING ── */}
      {!showSetup && (
        <div className="mi-landing fade-in">
          <div className="landing-badge"><FaMagic color="#22c55e" /> AI Powered Smart Interview Platform</div>
          <h1 className="landing-heading">
            Practice Interviews with<br/>
            <span className="landing-highlight">AI Intelligence</span>
          </h1>
          <p className="landing-subtext">
            Role-based mock interviews with smart follow-ups, adaptive difficulty and real-time performance evaluation.
          </p>
          <div className="landing-actions">
            <button className="landing-btn-primary" onClick={() => setShowSetup(true)}>Start Interview</button>
            <button className="landing-btn-secondary" onClick={() => navigate("/history")}>View History</button>
          </div>
          <div className="landing-cards">
            <div className="landing-card card-left">
              <div className="card-icon"><FaRobot size={20} color="#22c55e" /></div>
              <div className="card-step">STEP 1</div>
              <h4>Role & Experience Selection</h4>
              <p>AI adjusts difficulty based on selected job role.</p>
            </div>
            <div className="landing-card card-center">
              <div className="card-icon"><FaMicrophone size={20} color="#22c55e" /></div>
              <div className="card-step">STEP 2</div>
              <h4>Smart Voice Interview</h4>
              <p>Dynamic follow-up questions based on your answers.</p>
            </div>
            <div className="landing-card card-right">
              <div className="card-icon"><FaRegClock size={20} color="#22c55e" /></div>
              <div className="card-step">STEP 3</div>
              <h4>Timer Based Simulation</h4>
              <p>Real interview pressure with time tracking.</p>
            </div>
          </div>
          <h3 className="landing-footer-heading" style={{ marginTop: "60px", marginBottom: "40px", fontSize: "2rem", textAlign: "center" }}>
            Advanced AI <span style={{ color: "#22c55e" }}>Capabilities</span>
          </h3>
          
          <div className="adv-capabilities-grid">
            {/* Card 1 */}
            <div className="adv-cap-card">
              <div className="adv-cap-img-wrap">
                <img src={imgEval} alt="AI Answer Evaluation" className="adv-cap-img" />
              </div>
              <div className="adv-cap-content">
                <div className="adv-cap-icon" style={{ background: "#f0fdf4", color: "#22c55e" }}><FaChartBar size={14} /></div>
                <h4>AI Answer Evaluation</h4>
                <p>Scores communication, technical accuracy and confidence.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="adv-cap-card">
              <div className="adv-cap-img-wrap">
                <img src={imgResume} alt="Resume Based Interview" className="adv-cap-img" />
              </div>
              <div className="adv-cap-content">
                <div className="adv-cap-icon" style={{ background: "#f0fdf4", color: "#22c55e" }}><FaFileAlt size={14} /></div>
                <h4>Resume Based Interview</h4>
                <p>Project-specific questions based on uploaded resume.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="adv-cap-card">
              <div className="adv-cap-img-wrap">
                <img src={imgPdf} alt="Downloadable PDF Report" className="adv-cap-img" />
              </div>
              <div className="adv-cap-content">
                <div className="adv-cap-icon" style={{ background: "#f0fdf4", color: "#22c55e" }}><FaFilePdf size={14} /></div>
                <h4>Downloadable PDF Report</h4>
                <p>Detailed strengths, weaknesses and improvement insights.</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="adv-cap-card">
              <div className="adv-cap-img-wrap">
                <img src={imgHistory} alt="History & Analytics" className="adv-cap-img" />
              </div>
              <div className="adv-cap-content">
                <div className="adv-cap-icon" style={{ background: "#f0fdf4", color: "#22c55e" }}><FaHistory size={14} /></div>
                <h4>History & Analytics</h4>
                <p>Track progress with performance graphs and topic analysis.</p>
              </div>
            </div>
          </div>

          <h3 className="landing-footer-heading" style={{ marginTop: "80px", marginBottom: "40px", fontSize: "2rem", textAlign: "center" }}>
            Multiple Interview <span style={{ color: "#22c55e" }}>Modes</span>
          </h3>

          <div className="modes-grid" style={{ marginBottom: "60px" }}>
            {/* Mode Card 1 */}
            <div className="mode-card" onClick={() => { setRole("HR Manager"); setDifficulty("Intermediate"); setShowSetup(true); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
              <div className="mode-card-content">
                <h4>HR Interview Mode</h4>
                <p>Behavioral and communication based evaluation.</p>
              </div>
              <img src={imgHr} alt="HR Interview Mode" className="mode-card-img" />
            </div>

            {/* Mode Card 2 */}
            <div className="mode-card" onClick={() => { setRole("Frontend Developer"); setDifficulty("Advanced"); setShowSetup(true); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
              <div className="mode-card-content">
                <h4>Technical Mode</h4>
                <p>Deep technical questioning based on selected role.</p>
              </div>
              <img src={imgTech} alt="Technical Mode" className="mode-card-img" />
            </div>

            {/* Mode Card 3 */}
            <div className="mode-card" onClick={() => { setDifficulty("Beginner"); setShowSetup(true); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
              <div className="mode-card-content">
                <h4>Confidence Detection</h4>
                <p>Basic tone and voice analysis insights.</p>
              </div>
              <img src={imgConf} alt="Confidence Detection" className="mode-card-img" />
            </div>

            {/* Mode Card 4 */}
            <div className="mode-card" onClick={() => alert("Premium access feature coming soon!")}>
              <div className="mode-card-content">
                <h4>Credits System</h4>
                <p>Unlock premium interview sessions easily.</p>
              </div>
              <img src={imgCredits} alt="Credits System" className="mode-card-img" />
            </div>
          </div>
        </div>
      )}

      {/* ── SETUP ── */}
      {showSetup && (
        <div className="mi-setup fade-in mi-setup-card">
          <div className="setup-left">
            <h2>Start Your AI Interview</h2>
            <p>Practice real interview scenarios powered by AI. Improve communication, technical skills, and confidence.</p>
            <div className="setup-feature"><FaUser color="#22c55e" /> Choose Role & Experience</div>
            <div className="setup-feature"><FaMicrophone color="#22c55e" /> Smart Voice Interview</div>
            <div className="setup-feature"><FaChartLine color="#22c55e" /> Performance Analytics</div>
          </div>
          <div className="setup-right">
            <h3>Interview Setup</h3>
            <div className="setup-input-group">
              <FaUser className="setup-icon" />
              <input type="text" placeholder="Enter Role" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="setup-input-group">
              <FaBriefcase className="setup-icon" />
              <input type="text" placeholder="Experience (e.g. 2 years)" value={experience} onChange={(e) => setExperience(e.target.value)} />
            </div>
            <div className="setup-input-group">
              <select className="setup-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                {difficulties.map((d) => <option key={d} value={d}>{d} Interview</option>)}
              </select>
            </div>
            <div
              className={`resume-dashed-box ${uploadedFileName ? "uploaded" : ""}`}
              onClick={() => document.getElementById("resume-upload").click()}
              style={{ cursor: "pointer" }}
            >
              <FaFileUpload size={24} color={uploadedFileName ? "#22c55e" : "#94a3b8"} />
              <span className="resume-filename">
                {uploading ? "Uploading & Reading..." : uploadedFileName || "Click to upload Resume (PDF / TXT)"}
              </span>
              {!uploadedFileName && <span className="resume-hint">Optional — for personalized questions</span>}
              <input type="file" id="resume-upload" style={{ display: "none" }} accept=".pdf,.txt" onChange={handleFileUpload} />
            </div>
            {uploadedFileName && !resumeAnalysis && (
              <button className="analyze-btn" onClick={analyzeResume} disabled={analyzing}>
                {analyzing ? "Analyzing..." : "Analyze Resume"}
              </button>
            )}
            {resumeAnalysis && (
              <div className="analysis-card fade-in">
                <h4 className="analysis-title">Resume Analysis Result</h4>
                <div className="analysis-section">
                  <p className="analysis-label">Projects:</p>
                  <ul className="analysis-list">
                    {resumeAnalysis.projects?.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
                <div className="analysis-section">
                  <p className="analysis-label">Skills:</p>
                  <div className="analysis-tags">
                    {resumeAnalysis.skills?.map((s, i) => <span key={i} className="tag tag-skill">{s}</span>)}
                  </div>
                </div>
              </div>
            )}
            <button
              className={`setup-start-btn ${resumeAnalysis ? "green-btn" : ""}`}
              onClick={startInterview}
              disabled={loading}
            >
              {loading ? "Preparing Interview..." : "Start Interview"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
