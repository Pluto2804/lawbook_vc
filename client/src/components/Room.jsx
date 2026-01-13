import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check } from "lucide-react";

const Room = () => {
  const userVideo = useRef(null);
  const userStream = useRef(null);
  const partnerVideo = useRef(null);
  const peerRef = useRef(null);
  const webSocketRef = useRef(null);
  const { room_id } = useParams();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  const openCamera = async () => {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const cameras = allDevices.filter((d) => d.kind === "videoinput");

    if (cameras.length === 0) {
      throw new Error("No camera available on this device");
    }

    const constraints = {
      audio: true,
      video: {
        deviceId: cameras[0].deviceId,
      },
    };

    return navigator.mediaDevices.getUserMedia(constraints);
  };

  const toggleMute = () => {
    if (userStream.current) {
      const audioTrack = userStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (userStream.current) {
      const videoTrack = userStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }
    if (peerRef.current) {
      peerRef.current.close();
    }
    if (userStream.current) {
      userStream.current.getTracks().forEach((t) => t.stop());
    }
    // In your app, navigate back: window.location.href = "/";
    alert("Call ended");
  };

  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}/room/${room_id}`;
    navigator.clipboard.writeText(roomLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    let mounted = true;

    const handleTrackEvent = (e) => {
      console.log("Received tracks event", e);
      if (partnerVideo.current && e.streams && e.streams[0]) {
        partnerVideo.current.srcObject = e.streams[0];
        setIsConnected(true);
      }
    };

    const handleCandidateEvent = (e) => {
      console.log("Found ICE candidate", e.candidate);
      if (e.candidate && webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify({ iceCandidate: e.candidate }));
      }
    };

    const handleNegotiationNeeded = async () => {
      console.log("Negotiation needed — creating offer");
      try {
        if (!peerRef.current) return;
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
          webSocketRef.current.send(JSON.stringify({ offer: peerRef.current.localDescription }));
        }
      } catch (err) {
        console.error("Error during negotiation", err);
      }
    };

    const createPeer = () => {
      console.log("Creating PeerConnection");
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peer.onnegotiationneeded = handleNegotiationNeeded;
      peer.onicecandidate = handleCandidateEvent;
      peer.ontrack = handleTrackEvent;

      return peer;
    };

    const callUser = () => {
      console.log("Calling other user");
      peerRef.current = createPeer();
      if (userStream.current) {
        userStream.current.getTracks().forEach((track) => {
          peerRef.current.addTrack(track, userStream.current);
        });
      }
    };

    const handleOffer = async (offer) => {
      console.log("Received offer — creating answer");
      try {
        peerRef.current = createPeer();
        await peerRef.current.setRemoteDescription(offer);
        if (userStream.current) {
          userStream.current.getTracks().forEach((track) => {
            peerRef.current.addTrack(track, userStream.current);
          });
        }
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
          webSocketRef.current.send(JSON.stringify({ answer: peerRef.current.localDescription }));
        }
      } catch (err) {
        console.error("Error handling offer", err);
      }
    };

    openCamera()
      .then((stream) => {
        if (!mounted) return;
        userVideo.current && (userVideo.current.srcObject = stream);
        userStream.current = stream;

        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const ws = new WebSocket(
          `${protocol}://${window.location.host}/ws/join?roomID=${room_id}`
        );

        webSocketRef.current = ws;

        ws.addEventListener("open", () => {
          console.log("WebSocket open — joining room");
          ws.send(JSON.stringify({ join: true }));
        });

        ws.addEventListener("message", async (e) => {
          try {
            const message = JSON.parse(e.data);

            if (message.join) {
              callUser();
            }

            if (message.iceCandidate) {
              console.log("Receiving and adding ICE candidate");
              if (peerRef.current) {
                try {
                  await peerRef.current.addIceCandidate(message.iceCandidate);
                } catch (err) {
                  console.error("Error adding received ICE candidate", err);
                }
              }
            }

            if (message.offer) {
              await handleOffer(message.offer);
            }

            if (message.answer) {
              console.log("Received answer — setting remote description");
              if (peerRef.current) {
                try {
                  await peerRef.current.setRemoteDescription(message.answer);
                } catch (err) {
                  console.error("Error setting remote description (answer)", err);
                }
              }
            }
          } catch (err) {
            console.error("Failed to parse WS message", err, e.data);
          }
        });

        ws.addEventListener("close", () => {
          console.log("WebSocket closed");
          setIsConnected(false);
        });

        ws.addEventListener("error", (err) => {
          console.error("WebSocket error", err);
        });
      })
      .catch((err) => {
        console.error("Could not open camera or start media:", err);
      });

    return () => {
      mounted = false;
      if (webSocketRef.current) {
        try {
          webSocketRef.current.close();
        } catch (e) {
          /* ignore */
        }
        webSocketRef.current = null;
      }

      if (peerRef.current) {
        try {
          peerRef.current.close();
        } catch (e) {
          /* ignore */
        }
        peerRef.current = null;
      }

      if (userStream.current) {
        userStream.current.getTracks().forEach((t) => t.stop());
        userStream.current = null;
      }
    };
  }, [room_id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Room {room_id}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              End-to-end encrypted peer-to-peer session
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Copy Room Link Button */}
            <button
              onClick={copyRoomLink}
              className="flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors ring-1 ring-slate-700"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-400" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Invite Link</span>
                </>
              )}
            </button>

            {/* Connection Status */}
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 ring-1 ring-emerald-500/20">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-emerald-400">
                {isConnected ? "Connected" : "Waiting..."}
              </span>
            </div>
          </div>
        </header>

        {/* Video Grid */}
        <div className="relative">
          {/* Partner Video - Large Main View */}
          <div className="relative h-[600px] overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl">
            <video
              ref={partnerVideo}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                <div className="text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 ring-4 ring-slate-700/50">
                    <Video className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-medium text-slate-300">Waiting for participant...</p>
                  <p className="mt-2 text-sm text-slate-500">Share the room link to connect</p>
                </div>
              </div>
            )}
            <div className="absolute top-4 left-4 rounded-lg bg-black/60 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/10">
              Participant
            </div>
          </div>

          {/* Your Video - Picture-in-Picture */}
          <div className="absolute bottom-6 right-6 w-80 h-60 overflow-hidden rounded-xl bg-slate-900/80 backdrop-blur-xl ring-2 ring-white/20 shadow-2xl">
            <video
              ref={userVideo}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center">
                  <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                    <VideoOff className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-400">Camera off</p>
                </div>
              </div>
            )}
            <div className="absolute top-3 left-3 rounded-lg bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/10">
              You {isMuted && "(Muted)"}
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-4 rounded-full bg-slate-900/95 backdrop-blur-xl px-6 py-4 shadow-2xl ring-1 ring-white/10">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600 ring-2 ring-red-400/50"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff className="h-6 w-6 text-white" />
              ) : (
                <Mic className="h-6 w-6 text-white" />
              )}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {isMuted ? "Unmute" : "Mute"}
              </span>
            </button>

            {/* Video Button */}
            <button
              onClick={toggleVideo}
              className={`group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                isVideoOff
                  ? "bg-red-500 hover:bg-red-600 ring-2 ring-red-400/50"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
              title={isVideoOff ? "Turn on camera" : "Turn off camera"}
            >
              {isVideoOff ? (
                <VideoOff className="h-6 w-6 text-white" />
              ) : (
                <Video className="h-6 w-6 text-white" />
              )}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {isVideoOff ? "Camera on" : "Camera off"}
              </span>
            </button>

            {/* End Call Button */}
            <button
              onClick={endCall}
              className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-red-600 transition-all duration-200 hover:bg-red-700 hover:scale-110 ring-2 ring-red-500/50"
              title="End call"
            >
              <PhoneOff className="h-6 w-6 text-white" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                End call
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;