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
    <div className="min-h-screen bg-gradient-to-br from-[#0B1120] via-[#101828] to-[#0B1120] relative overflow-hidden">
      {/* Sophisticated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-amber-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-blue-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-slate-800/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-[480px]">
          {/* Logo and Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-xl shadow-amber-900/20">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            
            <h1 className="text-5xl font-semibold text-white mb-3 tracking-tight">
              LawBook
            </h1>
            <p className="text-base text-slate-400">
              Professional Virtual Moot Court Platform
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-8">
              {/* Title */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Enter the Courtroom
                </h2>
                <p className="text-sm text-slate-400">
                  Begin your moot court session or join an ongoing case
                </p>
              </div>

              {/* Create Button */}
              <button
                onClick={createRoom}
                disabled={loading}
                className="group relative w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-amber-900/30 hover:shadow-xl hover:shadow-amber-900/40 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5 text-[15px]">
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
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-700/50"></div>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Or</span>
                <div className="flex-1 h-px bg-slate-700/50"></div>
              </div>

              {/* Join Section */}
              <div className="space-y-3">
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
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900/60 text-white text-[15px] placeholder-slate-500 border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                  />
                </div>

                <button
                  onClick={joinRoom}
                  className="w-full bg-slate-700/50 hover:bg-slate-700/70 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50 transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span className="flex items-center justify-center gap-2 text-[15px]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Join Existing Courtroom
                  </span>
                </button>

                {error && (
                  <div className="flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-400 text-sm leading-relaxed">{error}</p>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500/80 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Request the Room ID from your session host to join. Each courtroom is secured and monitored.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30 text-center">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-2.5 mx-auto">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-medium text-xs mb-1">HD Video</h3>
              <p className="text-slate-500 text-[11px] leading-tight">Crystal-clear sessions</p>
            </div>

            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30 text-center">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-2.5 mx-auto">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-medium text-xs mb-1">AI Analysis</h3>
              <p className="text-slate-500 text-[11px] leading-tight">Real-time scoring</p>
            </div>

            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30 text-center">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-2.5 mx-auto">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-white font-medium text-xs mb-1">Reports</h3>
              <p className="text-slate-500 text-[11px] leading-tight">Detailed feedback</p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-500 text-xs mt-8">
            Empowering law students through technology-enhanced advocacy practice
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;