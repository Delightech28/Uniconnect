import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import AppHeader from "../AppHeader";
import Footer from "../Footer";
import Sidebar from "./components/Sidebar";
import LoadingOverlay from "./components/LoadingOverlay";
import FileUpload from "./components/FileUpload";
import Dashboard from "./components/Dashboard";
import PodcastSection from "./components/PodcastSection";
import QuizSection from "./components/QuizSection";
import TutorSection from "./components/TutorSection";
import DocumentSummary from "./components/Summary/DocumentSummary";
import HistoryPage from "./components/HistoryPage";
import { analyzeDocument, generateTopics } from "./services/geminiService";
// ComingSoonOverlay removed
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const StudyHubApp = ({ darkMode, toggleDarkMode }) => {
  // ComingSoonOverlay removed: feature available

  const [currentView, setCurrentView] = useState("upload");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Processing...");
  const [studyDoc, setStudyDoc] = useState(null);
  const [history, setHistory] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [topics, setTopics] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const abortRef = useRef(null);

  // Load quiz history and documents from localStorage on mount
  useEffect(() => {
    console.log(
      "[App] useEffect: Loading quiz history and documents from localStorage",
    );

    // Load quiz history
    const savedHistory = localStorage.getItem("studyHub_quizHistory");
    console.log("[App] Raw localStorage value:", savedHistory);

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        console.log(
          "[App] Parsed quiz history:",
          parsed,
          "Length:",
          Array.isArray(parsed) ? parsed.length : "not an array",
        );
        setQuizHistory(parsed);
      } catch (e) {
        console.error("[App] Error parsing quiz history:", e);
      }
    } else {
      console.log("[App] No saved history found in localStorage");
      setQuizHistory([]);
    }

    // Load documents
    const savedDocuments = localStorage.getItem("studyHub_documents");
    if (savedDocuments) {
      try {
        const parsedDocs = JSON.parse(savedDocuments);
        console.log("[App] Parsed documents:", parsedDocs.length);
        setDocuments(parsedDocs);
      } catch (e) {
        console.error("[App] Error parsing documents:", e);
      }
    }
  }, []);

  // Track changes to quizHistory
  useEffect(() => {
    console.log(
      "[App] quizHistory updated:",
      quizHistory,
      "Length:",
      quizHistory.length,
    );
  }, [quizHistory]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleFileUpload = async (file) => {
    if (cooldown > 0) {
      alert(
        `Please wait ${cooldown} seconds before uploading another document.`,
      );
      return;
    }

    if (!file || !(file instanceof Blob)) {
      alert("Invalid file object");
      return;
    }

    setLoading(true);
    setLoadingMessage("Analyzing document...");
    abortRef.current = new AbortController();

    try {
      // Use local pdfjs-dist ESM build and Vite-provided worker URL
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

      // Convert File to ArrayBuffer and parse
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map((item) => item.str).join(" ") + "\n";
      }

      if (!text.trim()) {
        throw new Error(
          "No text content found in PDF. Please ensure the PDF contains selectable text.",
        );
      }

      setLoadingMessage("Extracting topics...");
      console.log("[App] Starting topic extraction from document text...");
      const extractedTopics = await generateTopics(
        text,
        abortRef.current.signal,
      );
      console.log("[App] Topics extracted:", extractedTopics);

      const docData = {
        name: file.name,
        text: text,
        uploadedAt: new Date().toISOString(),
        id: Date.now().toString(),
      };

      console.log(
        "[App] Document uploaded:",
        docData.name,
        "Extracted topics:",
        extractedTopics,
      );
      setStudyDoc(docData);
      setTopics(extractedTopics);
      setHistory([...history, docData]);

      // Save document to documents list to avoid re-uploading
      const updatedDocuments = documents.filter((d) => d.id !== docData.id);
      updatedDocuments.unshift(docData);
      setDocuments(updatedDocuments);

      try {
        localStorage.setItem(
          "studyHub_documents",
          JSON.stringify(updatedDocuments),
        );
        console.log("[App] Document saved to localStorage");
      } catch (e) {
        console.error("[App] Error saving document:", e);
      }

      setCurrentView("analysis");

      setCooldown(30);
    } catch (error) {
      if (error.name !== "AbortError") {
        alert("Error processing document: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    setCurrentView("upload");
  };

  const handleLoadDocumentFromHistory = async (docId) => {
    console.log("[App] Loading document from history:", docId);
    const doc = documents.find((d) => d.id === docId);

    if (!doc) {
      alert("Document not found in history");
      return;
    }

    setLoading(true);
    setLoadingMessage("Re-analyzing document...");

    try {
      // Re-extract topics from the stored document text (full reload)
      console.log("[App] Re-analyzing document:", doc.name);
      const extractedTopics = await generateTopics(
        doc.text,
        abortRef.current?.signal,
      );
      console.log("[App] Topics re-extracted:", extractedTopics);

      // Update document with new timestamp and topics
      const updatedDoc = {
        ...doc,
        uploadedAt: new Date().toISOString(),
      };

      setStudyDoc(updatedDoc);
      setTopics(extractedTopics);
      setCurrentView("analysis"); // Go to dashboard/topics view
    } catch (error) {
      console.error("[App] Error re-analyzing document:", error);
      // Fallback: just load the document without re-analyzing
      setStudyDoc(doc);
      setTopics([]);
      setCurrentView("analysis");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (topicId, score) => {
    console.log(
      "[App] handleQuizComplete called - Topic:",
      topicId,
      "Score:",
      score,
      "CurrentQuizHistory:",
      quizHistory,
    );

    const updatedTopics = topics.map((t) =>
      t.id === topicId ? { ...t, score, passed: score >= 70 } : t,
    );
    setTopics(updatedTopics);

    // Save quiz result to history
    const quizResult = {
      id: Date.now().toString(),
      docName: studyDoc?.name || "Unknown Document",
      topic: topicId,
      score: score,
      passed: score >= 70,
      completedAt: new Date().toISOString(),
    };

    console.log("[App] Creating quiz result object:", quizResult);

    const updatedHistory = [quizResult, ...quizHistory];
    console.log(
      "[App] Updated history before setState:",
      updatedHistory,
      "Length:",
      updatedHistory.length,
    );

    setQuizHistory(updatedHistory);

    try {
      const jsonString = JSON.stringify(updatedHistory);
      console.log("[App] Stringified history:", jsonString.substring(0, 100));
      localStorage.setItem("studyHub_quizHistory", jsonString);
      console.log("[App] localStorage.setItem called successfully");

      // Verify it was saved
      const verify = localStorage.getItem("studyHub_quizHistory");
      console.log(
        "[App] Verified localStorage contains:",
        verify ? verify.substring(0, 100) : "NOTHING",
      );
    } catch (e) {
      console.error("[App] Error saving quiz history:", e);
    }
  };

  const renderView = () => {
    if (!studyDoc && currentView !== "upload" && currentView !== "history") {
      return (
        <FileUpload onFileUpload={handleFileUpload} isDarkMode={darkMode} />
      );
    }

    switch (currentView) {
      case "upload":
        return (
          <FileUpload
            onFileUpload={handleFileUpload}
            isDarkMode={darkMode}
            progress={0}
          />
        );

      case "analysis":
        return studyDoc && summaryData ? (
          <DocumentSummary
            data={summaryData}
            onBack={() => setCurrentView("upload")}
            isDarkMode={darkMode}
          />
        ) : (
          <Dashboard
            topics={topics}
            onStartQuiz={() => setCurrentView("quiz")}
            onStartChat={() => setCurrentView("tutor")}
            onStartPodcast={() => setCurrentView("podcast")}
            isDarkMode={darkMode}
          />
        );

      case "quiz":
        return studyDoc ? (
          <QuizSection
            docText={studyDoc.text}
            topics={topics}
            onQuizComplete={handleQuizComplete}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
            isDarkMode={darkMode}
          />
        ) : null;

      case "tutor":
        return studyDoc ? (
          <TutorSection
            docText={studyDoc.text}
            topics={topics}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
            isPaused={cooldown > 0}
            isDarkMode={darkMode}
          />
        ) : null;

      case "podcast":
        return studyDoc ? (
          <PodcastSection
            docText={studyDoc.text}
            topics={topics}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
            isPaused={cooldown > 0}
            isDarkMode={darkMode}
          />
        ) : null;

      case "history":
        return (
          <HistoryPage
            history={quizHistory}
            documents={documents}
            onLoadDocument={handleLoadDocumentFromHistory}
            isDarkMode={darkMode}
          />
        );

      default:
        return (
          <FileUpload onFileUpload={handleFileUpload} isDarkMode={darkMode} />
        );
    }
  };

  return (
    <div
      className={`flex flex-col min-h-screen ${darkMode ? "bg-slate-950" : "bg-white"}`}
      style={{ overscrollBehaviorY: "contain" }}
    >
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <div className="flex-1 flex">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          hasDocument={!!studyDoc}
          disabled={cooldown > 0}
          onUploadClick={handleUploadClick}
          isDarkMode={darkMode}
        />

        <main className="flex-1 md:ml-20 mb-20 md:mb-0">
          {loading && (
            <LoadingOverlay
              progress={50}
              stage={loadingMessage}
              onCancel={handleCancel}
              isDarkMode={darkMode}
            />
          )}
          {renderView()}
        </main>
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default StudyHubApp;
