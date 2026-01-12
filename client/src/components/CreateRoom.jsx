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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-3">Lawbook</h1>
          <p className="text-xl text-slate-300">
            Virtual Moot Court Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
          <div className="p-8 md:p-12 space-y-8">

            <div className="text-center">
              <h2 className="text-3xl font-semibold text-white mb-2">
                Start or Join a Courtroom
              </h2>
              <p className="text-slate-400">
                Create a new session or join using a Room ID
              </p>
            </div>

            {/* CREATE */}
            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold py-4 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Creating Courtroom..." : "Create New Courtroom"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-slate-400 text-sm">OR</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* JOIN */}
            <div className="space-y-3">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter Room ID (e.g. XUwglD8s)"
                className="w-full px-4 py-3 rounded-lg bg-slate-900 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />

              <button
                onClick={joinRoom}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition"
              >
                Join Existing Courtroom
              </button>

              {error && (
                <p className="text-red-400 text-sm text-center">
                  {error}
                </p>
              )}
            </div>

            {/* Footer hint */}
            <p className="text-center text-slate-400 text-sm pt-4">
              Ask the host for the Room ID to join instantly
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 mt-8">
          Practicing law students • Professional moot court simulations
        </p>
      </div>
    </div>
  );
};

export default CreateRoom;
