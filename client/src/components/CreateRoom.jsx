import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ROOM_ID_REGEX = /^[a-zA-Z0-9_-]{6,20}$/;

const CreateRoom = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  // Create a new room
  const createRoom = async () => {
    setError("");
    setLoading(true);

    try {
      const resp = await fetch("/api/create");
      if (!resp.ok) throw new Error("Failed to create room");

      const { room_id } = await resp.json();
      navigate(`/room/${room_id}`);
    } catch (err) {
      console.error(err);
      setError("Could not create courtroom. Please try again.");
      setLoading(false);
    }
  };

  // Join an existing room
  const joinRoom = () => {
    setError("");

    const trimmed = roomId.trim();

    if (!trimmed) {
      setError("Please enter a Room ID.");
      return;
    }

    if (!ROOM_ID_REGEX.test(trimmed)) {
      setError("Invalid Room ID format.");
      return;
    }

    navigate(`/room/${trimmed}`);
  };

  // Allow Enter key to join
  const handleKeyDown = (e) => {
    if (e.key === "Enter") joinRoom();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-5xl w-full">
          {/* Header with logo */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            
            <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent mb-4">
              LawBook
            </h1>
            <p className="text-xl text-slate-400 font-light tracking-wide">
              Professional Virtual Moot Court Platform
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800/50 overflow-hidden">
            {/* Decorative top border */}
            <div className="h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
            
            <div className="p-8 md:p-12 space-y-10">
              {/* Title Section */}
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Enter the Courtroom
                </h2>
                <p className="text-slate-400 text-lg">
                  Begin your moot court session or join an ongoing case
                </p>
              </div>

              {/* Create Button - Premium style */}
              <button
                onClick={createRoom}
                disabled={loading}
                className="group relative w-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:via-amber-800 hover:to-amber-900 text-white font-semibold py-5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-amber-900/50 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating Courtroom...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create New Courtroom</span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              </button>

              {/* Elegant Divider */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-slate-700"></div>
                <span className="text-slate-500 text-sm font-medium tracking-wider uppercase">Or</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-700 to-slate-700"></div>
              </div>

              {/* Join Section - Enhanced */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter Room ID (e.g., XUwglD8s)"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-all duration-300"
                  />
                </div>

                <button
                  onClick={joinRoom}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg border border-slate-700 hover:border-slate-600"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Join Existing Courtroom
                  </span>
                </button>

                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-800/30 rounded-lg">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="pt-6 border-t border-slate-800">
                <div className="flex items-start gap-3 text-slate-400 text-sm">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="leading-relaxed">
                    Request the Room ID from your session host to join instantly. Each courtroom is secured and monitored for optimal performance evaluation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-6 border border-slate-800/50">
              <div className="w-12 h-12 bg-amber-600/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">HD Video Sessions</h3>
              <p className="text-slate-400 text-sm">Crystal-clear video conferencing for professional moot court proceedings</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-6 border border-slate-800/50">
              <div className="w-12 h-12 bg-amber-600/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-slate-400 text-sm">Real-time argument evaluation and performance scoring</p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-6 border border-slate-800/50">
              <div className="w-12 h-12 bg-amber-600/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Detailed Reports</h3>
              <p className="text-slate-400 text-sm">Comprehensive performance reports shared with recruiters</p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-500 text-sm mt-12">
            Empowering law students through technology-enhanced advocacy practice
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;