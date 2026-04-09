// src/components/MockInterview/InterviewPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaMicrophone, FaStop, FaArrowLeft, FaDownload } from "react-icons/fa";
import aiAvatar from "../../assets/ai_interviewer.png";
import "./MockInterview.css";

const TIMER_SECONDS = 60;

const InterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions: initQuestions, role, experience, difficulty } = location.state || {};

  // Redirect if no questions passed
  useEffect(() => {
    if (!initQuestions || initQuestions.length === 0) navigate("/");
  }, [initQuestions, navigate]);

  const [phase, setPhase] = useState("interviewing"); // interviewing | completed
  const [questions] = useState(initQuestions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(initQuestions?.[0] || "");
  const [feedbackList, setFeedbackList] = useState([]);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [micPrompt, setMicPrompt] = useState(false);

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // ── Speech Recognition ──
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);
  const wantListeningRef = useRef(false);

  const createAndStart = () => {
    if (!SpeechRecognitionAPI) return;
    try { recognitionRef.current?.abort(); } catch (_) {}
    const rec = new SpeechRecognitionAPI();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) setInput((prev) => prev + t + " ");
        else interim += t;
      }
      setInterimTranscript(interim);
    };

    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      wantListeningRef.current = false;
      setIsListening(false);
      setInterimTranscript("");
    };

    rec.onend = () => {
      if (wantListeningRef.current) {
        setTimeout(() => { if (wantListeningRef.current) createAndStart(); }, 200);
      } else { setIsListening(false); setInterimTranscript(""); }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
      setMicPrompt(false);
    } catch {
      setIsListening(false);
      setMicPrompt(true);
    }
  };

  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      try { recognitionRef.current?.abort(); } catch (_) {}
      synthRef.current?.cancel();
    };
  }, []);

  const startListening = () => {
    if (!SpeechRecognitionAPI) { alert("Speech recognition not supported. Use Chrome."); return; }
    wantListeningRef.current = true;
    setMicPrompt(false);
    createAndStart();
  };

  const stopListening = () => {
    wantListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript("");
    try { recognitionRef.current?.abort(); } catch (_) {}
    recognitionRef.current = null;
  };

  const toggleListening = () => {
    if (aiSpeaking) { synthRef.current?.cancel(); setAiSpeaking(false); return; }
    if (isListening) stopListening();
    else startListening();
  };

  // ── TTS ──
  const speakQuestion = (text) => {
    synthRef.current?.cancel();
    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US"; utterance.rate = 0.9; utterance.pitch = 1.05; utterance.volume = 1;
      const voices = synthRef.current.getVoices();
      const preferred = voices.find((v) => /zira|susan|samantha|karen|victoria|female|google us english/i.test(v.name));
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setAiSpeaking(true);
      utterance.onend = () => {
        setAiSpeaking(false);
        wantListeningRef.current = true;
        setTimeout(() => createAndStart(), 300);
      };
      utterance.onerror = () => setAiSpeaking(false);
      synthRef.current.speak(utterance);
    };
    if (synthRef.current.getVoices().length > 0) doSpeak();
    else synthRef.current.addEventListener("voiceschanged", doSpeak, { once: true });
  };

  // ── Timer ──
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Speak first question on mount
  useEffect(() => {
    if (questions.length > 0) {
      startTimer();
      setTimeout(() => {
        speakQuestion(`Hello! I'm your AI Interviewer today. Let's begin. Here is your first question. ${questions[0]}`);
      }, 600);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (phase !== "interviewing") {
      clearInterval(timerRef.current);
      synthRef.current?.cancel();
      stopListening();
    }
    return () => clearInterval(timerRef.current);
  }, [phase]); // eslint-disable-line

  // ── Submit Answer ──
  const submitAnswer = async () => {
    const answerText = input.trim();
    if (!answerText || loading) return;
    synthRef.current?.cancel();
    stopListening();
    setAiSpeaking(false);
    setInput(""); setInterimTranscript(""); setLoading(true);
    clearInterval(timerRef.current);

    try {
      const response = await axios.post("http://localhost:5000/api/interview/submit-answer", {
        question: currentQuestion, answer: answerText,
      });
      const data = response.data.data;
      setFeedbackList((prev) => [...prev, { question: currentQuestion, answer: answerText, ...data }]);
      setCurrentFeedback(data);
      const feedbackSnippet = data.feedback || "Good answer.";
      setTimeout(() => speakQuestion(feedbackSnippet), 300);
    } catch { alert("Network error while evaluating answer."); }
    setLoading(false);
  };

  // ── Next Question ──
  const goToNextQuestion = () => {
    synthRef.current?.cancel();
    stopListening();
    setCurrentFeedback(null);
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
      startTimer();
      setTimeout(() => speakQuestion(`Question ${nextIndex + 1}. ${questions[nextIndex]}`), 400);
    } else {
      // Save to history
      const allFeedback = [...feedbackList];
      const session = {
        id: Date.now(),
        date: new Date().toISOString(),
        role, experience, difficulty,
        feedbackList: allFeedback,
        avgScore: allFeedback.length
          ? (allFeedback.reduce((s, f) => s + (f.finalScore || 0), 0) / allFeedback.length).toFixed(1) : "0",
      };
      const existing = JSON.parse(localStorage.getItem("interview_history") || "[]");
      const updated = [session, ...existing].slice(0, 20);
      localStorage.setItem("interview_history", JSON.stringify(updated));
      setTimeout(() => speakQuestion("That concludes our interview. You did great! Thank you for your time."), 400);
      setPhase("completed");
    }
  };

  // Timer ring
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / TIMER_SECONDS) * circumference;
  const statusLabel = aiSpeaking ? "AI Speaking" : isListening ? "Listening..." : loading ? "Evaluating..." : "Waiting";
  const statusColor = aiSpeaking ? "#3b82f6" : isListening ? "#22c55e" : loading ? "#f59e0b" : "#94a3b8";

  // ── PDF Download ──
  const downloadPDF = () => {
    const avg = (arr, key) => arr.length ? (arr.reduce((s, f) => s + (f[key] || 0), 0) / arr.length).toFixed(1) : "0";
    const avgScore = avg(feedbackList, "finalScore");
    const avgConf = avg(feedbackList, "confidence");
    const avgComm = avg(feedbackList, "communication");
    const avgCorr = avg(feedbackList, "correctness");
    const scoreNum = parseFloat(avgScore);
    const advice = scoreNum >= 8 ? "Excellent performance! You demonstrated strong technical knowledge and communication skills."
      : scoreNum >= 6 ? "Good performance. Focus on providing more structured and detailed answers."
      : scoreNum >= 4 ? "Average performance. Work on clarity, confidence, and providing specific examples."
      : "Significant improvement required. Focus on structured thinking, clarity, and confident delivery.";
    const rows = feedbackList.map((f, i) => `<tr><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#334155;width:40px;vertical-align:top">${i+1}</td><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;color:#334155;width:240px;vertical-align:top;line-height:1.5">${f.question}</td><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;text-align:center;vertical-align:top">${f.finalScore}/10</td><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;color:#475569;line-height:1.5;vertical-align:top">${f.feedback}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>AI Interview Report</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',system-ui,sans-serif;padding:50px;color:#0f172a;background:white}@media print{body{padding:30px}}</style></head><body><h1 style="text-align:center;font-size:1.8rem;font-weight:800;color:#22c55e;margin-bottom:6px">AI Interview Performance Report</h1><hr style="border:none;height:3px;background:linear-gradient(90deg,#22c55e,#0d9488);border-radius:2px;margin-bottom:32px"/><div style="background:#f0fdf4;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px"><p style="font-size:1.4rem;font-weight:800;color:#0f172a">Final Score: ${avgScore}/10</p></div><div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:24px"><p style="font-size:1rem;margin-bottom:10px"><strong>Confidence:</strong> ${avgConf}</p><p style="font-size:1rem;margin-bottom:10px"><strong>Communication:</strong> ${avgComm}</p><p style="font-size:1rem"><strong>Correctness:</strong> ${avgCorr}</p></div><div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:32px"><p style="font-size:1.1rem;font-weight:700;margin-bottom:10px">Professional Advice</p><p style="font-size:0.95rem;color:#475569;line-height:1.6">${advice}</p></div><table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0"><thead><tr style="background:#22c55e;color:white"><th style="padding:14px 16px;text-align:left;font-size:0.85rem;font-weight:700">#</th><th style="padding:14px 16px;text-align:left;font-size:0.85rem;font-weight:700">Question</th><th style="padding:14px 16px;text-align:center;font-size:0.85rem;font-weight:700">Score</th><th style="padding:14px 16px;text-align:left;font-size:0.85rem;font-weight:700">Feedback</th></tr></thead><tbody>${rows}</tbody></table><p style="text-align:center;margin-top:32px;font-size:0.8rem;color:#94a3b8">Generated by AI Smart Interview Platform • ${new Date().toLocaleDateString()}</p></body></html>`;
    const win = window.open("", "_blank"); win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500);
  };

  if (!questions || questions.length === 0) return null;

  // ── COMPLETED DASHBOARD ──
  if (phase === "completed") {
    const avgScore = feedbackList.length ? (feedbackList.reduce((s, f) => s + (f.finalScore || 0), 0) / feedbackList.length).toFixed(1) : 0;
    const avgConf = feedbackList.length ? (feedbackList.reduce((s, f) => s + (f.confidence || 0), 0) / feedbackList.length).toFixed(1) : 0;
    const avgComm = feedbackList.length ? (feedbackList.reduce((s, f) => s + (f.communication || 0), 0) / feedbackList.length).toFixed(1) : 0;
    const avgCorr = feedbackList.length ? (feedbackList.reduce((s, f) => s + (f.correctness || 0), 0) / feedbackList.length).toFixed(1) : 0;
    const scoreNum = parseFloat(avgScore);
    const r = 60; const c = 2 * Math.PI * r; const p = (scoreNum / 10) * c;
    const ratingText = scoreNum >= 8 ? "Excellent performance!" : scoreNum >= 6 ? "Good performance. Keep improving." : scoreNum >= 4 ? "Average. Work on clarity and confidence." : "Significant improvement required.";
    const scores = feedbackList.map((f) => f.finalScore || 0);
    const chartW = 400; const chartH = 160; const padX = 40; const padY = 20;
    const usableW = chartW - padX * 2; const usableH = chartH - padY * 2;
    const pts = scores.map((s, i) => ({ x: padX + (scores.length > 1 ? (i / (scores.length - 1)) * usableW : usableW / 2), y: padY + usableH - (s / 10) * usableH }));
    const line = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x},${pt.y}`).join(" ");
    const area = line + ` L${pts[pts.length - 1]?.x || padX},${chartH - padY} L${padX},${chartH - padY} Z`;

    return (
      <div className="mi-container">
        <div className="iv-dashboard fade-in" id="interview-report">
          <div className="dash-header">
            <div className="dash-header-left">
              <button className="dash-back" onClick={() => navigate("/")}><FaArrowLeft /></button>
              <div>
                <h2 className="dash-title">Interview Analytics Dashboard</h2>
                <p className="dash-subtitle">AI-powered performance insights</p>
              </div>
            </div>
            <button className="dash-pdf-btn" onClick={downloadPDF}><FaDownload size={14} /> Download PDF</button>
          </div>
          <div className="dash-grid-2">
            <div className="dash-card">
              <p className="dash-card-title">Overall Performance</p>
              <div className="dash-donut-wrap">
                <svg width="150" height="150" viewBox="0 0 150 150"><circle cx="75" cy="75" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" /><circle cx="75" cy="75" r={r} fill="none" stroke="#22c55e" strokeWidth="10" strokeDasharray={c} strokeDashoffset={c - p} strokeLinecap="round" transform="rotate(-90 75 75)" style={{ transition: "stroke-dashoffset 1s ease" }} /></svg>
                <span className="dash-donut-score">{avgScore}</span>
              </div>
              <p className="dash-donut-sub">Out of 10</p>
              <p className="dash-rating"><strong>{ratingText.split(".")[0]}.</strong> {ratingText.split(".").slice(1).join(".")}</p>
            </div>
            <div className="dash-card">
              <p className="dash-card-title">Performance Trend</p>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="dash-chart">
                {[0, 3, 5, 7, 10].map((v) => { const y = padY + usableH - (v / 10) * usableH; return <g key={v}><line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="#f1f5f9" /><text x={padX - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="11">{v}</text></g>; })}
                <path d={area} fill="rgba(34,197,94,0.1)" /><path d={line} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" />
                {pts.map((pt, i) => (<g key={i}><circle cx={pt.x} cy={pt.y} r="4" fill="#22c55e" /><text x={pt.x} y={chartH - 4} textAnchor="middle" fill="#94a3b8" fontSize="11">Q{i + 1}</text></g>))}
              </svg>
            </div>
          </div>
          <div className="dash-grid-2">
            <div className="dash-card">
              <p className="dash-card-title">Skill Evaluation</p>
              {[{ label: "Confidence", value: avgConf }, { label: "Communication", value: avgComm }, { label: "Correctness", value: avgCorr }].map((s) => (
                <div key={s.label} className="dash-skill-row"><div className="dash-skill-head"><span>{s.label}</span><span className="dash-skill-val">{s.value}</span></div><div className="dash-bar-bg"><div className="dash-bar-fill" style={{ width: `${(s.value / 10) * 100}%` }} /></div></div>
              ))}
            </div>
            <div className="dash-card dash-card-scroll">
              <p className="dash-card-title">Question Breakdown</p>
              {feedbackList.map((f, i) => (
                <div key={i} className="dash-q-card"><div className="dash-q-header"><span className="dash-q-label">Question {i + 1}</span><span className={`dash-q-score ${f.finalScore >= 7 ? "good" : f.finalScore >= 4 ? "ok" : "low"}`}>{f.finalScore} / 10</span></div><p className="dash-q-text">{f.question}</p><div className="dash-q-fb"><span className="dash-q-fb-label">AI Feedback</span><p>{f.feedback}</p></div></div>
              ))}
            </div>
          </div>
          <button className="setup-start-btn green-btn" style={{ maxWidth: "320px", marginTop: "24px" }} onClick={() => navigate("/")}>Start New Interview</button>
        </div>
      </div>
    );
  }

  // ── INTERVIEWING ──
  return (
    <div className="mi-container">
      <div className="iv-shell fade-in">
        <div className="iv-left">
          <div className="iv-avatar-card">
            <img src={aiAvatar} alt="AI Interviewer" className={`iv-avatar-img ${aiSpeaking ? "speaking-pulse" : ""}`} />
            <div className="iv-greeting">
              {aiSpeaking ? <span className="iv-speaking-text"><span className="dot-anim" />Speaking...</span>
                : isListening ? <span style={{ color: "#22c55e", fontWeight: 600 }}>🎤 Listening to you...</span>
                : "Hi there, I hope you're feeling confident and ready."}
            </div>
          </div>
          <div className="iv-status-card">
            <div className="iv-status-row">
              <span className="iv-status-label">Interview Status</span>
              <span className="iv-speaking-badge" style={{ color: statusColor }}>
                <span className="iv-dot" style={{ background: statusColor }} /> {statusLabel}
              </span>
            </div>
            <div className="iv-timer-wrap">
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5" />
                <circle cx="36" cy="36" r={radius} fill="none" stroke={timeLeft < 15 ? "#ef4444" : "#22c55e"} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" transform="rotate(-90 36 36)" style={{ transition: "stroke-dashoffset 1s linear" }} />
              </svg>
              <span className="iv-timer-text" style={{ color: timeLeft < 15 ? "#ef4444" : "#22c55e" }}>{timeLeft}s</span>
            </div>
            <div className="iv-q-counts">
              <div className="iv-q-item"><span className="iv-q-num">{currentQuestionIndex + 1}</span><span className="iv-q-lbl">Current Question</span></div>
              <div className="iv-q-item"><span className="iv-q-num">{questions.length}</span><span className="iv-q-lbl">Total Questions</span></div>
            </div>
          </div>
        </div>
        <div className="iv-right">
          <div className="iv-right-header">
            <h2 className="iv-title">AI Smart Interview</h2>
            <button className="iv-end-btn" onClick={() => { synthRef.current?.cancel(); stopListening(); navigate("/"); }}>End Interview</button>
          </div>
          <div className="iv-question-box">{currentQuestion}</div>
          <div className="iv-answer-wrapper">
            <textarea className="iv-answer-area" placeholder={isListening ? "Speak now — your words appear here..." : "Type your answer or press mic to speak..."} value={input + interimTranscript} onChange={(e) => { setInput(e.target.value); setInterimTranscript(""); }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }} disabled={!!currentFeedback} />
            {isListening && <div className="iv-listening-bar"><span /><span /><span /><span /><span /></div>}
          </div>
          {!currentFeedback && (
            <>
              <div className="iv-bottom-row">
                <button className={`iv-mic-btn ${isListening ? "listening" : aiSpeaking ? "ai-speaking" : micPrompt ? "mic-prompt-pulse" : ""}`} onClick={toggleListening} title={aiSpeaking ? "Stop AI speaking" : isListening ? "Stop listening" : "Start voice input"}>
                  {isListening ? <FaStop size={16} /> : <FaMicrophone size={18} />}
                </button>
                <button className="iv-submit-btn" onClick={submitAnswer} disabled={loading || !(input.trim() || interimTranscript.trim())}>
                  {loading ? "Evaluating..." : "Submit Answer"}
                </button>
              </div>
              {micPrompt && !isListening && <p className="iv-mic-prompt">👆 Click the mic button to start speaking your answer</p>}
            </>
          )}
          {currentFeedback && (
            <div className="iv-inline-feedback fade-in">
              <p className="iv-inline-fb-text">{currentFeedback.feedback}</p>
              <button className="iv-next-btn" onClick={goToNextQuestion}>
                {currentQuestionIndex + 1 >= questions.length ? "View Results →" : "Next Question →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
