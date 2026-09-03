import React, { useState } from "react";
import { Camera, Search, Menu, Sparkles, X, Eye, Info, MessageSquare, Award, MapPin } from "lucide-react";

import CameraScanner from "@fe/features/camera/camera-scanner";
import BotanistChatWindow from "@fe/features/botanist_chat/components/BotanistChatWindow";
import { askBotanistGuide } from "@fe/features/botanist_chat/services/chat-service";
import "./dashboard-page.css";

export default function DashboardPage() {
  onst [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State for Chat Window Modal
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialChatData, setInitialChatData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Trigger Gemini AI & open Chat Window
  const handleAskGuide = async (e) => {
    if (e) e.stopPropagation();
    setIsLoading(true);

    try {
      const data = await askBotanistGuide(
        "Phyllanthus emblica",
        "Can I grow this plant in my home garden in Vellore?"
      );
      setInitialChatData(data);
      setIsChatOpen(true);
    } catch (error) {
      console.error("Failed to fetch botanist advice:", error);
      alert("Error contacting Gemini AI server. Check backend terminal.");
    } finally {
      setIsLoading(false);    }
  };

  return (
    <div className="dashboard-layout">
      <main className="dashboard-container">
        {/* Species Card */}
        <div className="card-container cursor-pointer" onClick={() => setIsCameraOpen(true)}>
          <img
            src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80"
            alt="Phyllanthus emblica"
            className="card-image"
          />

          <button 
            className="ask-button relative z-20" 
            onClick={handleAskGuide}
            disabled={isLoading}
          >
            <Sparkles size={16} color="#4a5d4e" />
            <span>{isLoading ? "Consulting AI..." : "Ask the guide"}</span>
          </button>

          <div className="card-footer">
            <span className="species-tag">SPECIES RECOGNIZED</span>
            <h2 className="species-name">Phyllanthus emblica</h2>
            <p className="common-name">Indian gooseberry · Amla</p>
          </div>
        </div>

        {/* Interactive Botanist Chat Window Overlay */}
        <BotanistChatWindow
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          plantContext="Phyllanthus emblica"
          initialResponse={initialChatData}
        />
      </main>
    </div>
  );
}
