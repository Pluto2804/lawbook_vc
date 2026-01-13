import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const Room = () => {
  const { room_id } = useParams();

  const userVideo = useRef(null);
  const partnerVideo = useRef(null);

  const streamRef = useRef(null);
  const peerRef = useRef(null);
  const wsRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // ---------- MEDIA ----------
  const openMedia = async () => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
  };

  // ---------- PEER ----------
  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },

        // TURN (REQUIRED for mobile networks)
        {
          urls: "turn:free.express.turn.com:3478",
          username: "efPU52K4SLOQ34W2QY",
          credential: "1TJPNFxHKXrZfeIz",
        },
      ],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        wsRef.current?.send(
          JSON.stringify({
            type: "ice",
            candidate: e.candidate,
          })
        );
      }
    };

    peer.ontrack = (e) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = e.streams[0];
      }
    };

    return peer;
  };

  // ---------- CALLER ----------
  const startCall = async () => {
    peerRef.current = createPeer();

    streamRef.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, streamRef.current);
    });

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    wsRef.current.send(
      JSON.stringify({
        type: "offer",
        offer,
      })
    );
  };

  // ---------- ANSWERER ----------
  const handleOffer = async (offer) => {
    peerRef.current = createPeer();

    await peerRef.current.setRemoteDescription(offer);

    streamRef.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, streamRef.current);
    });

    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    wsRef.current.send(
      JSON.stringify({
        type: "answer",
        answer,
      })
    );
  };

  // ---------- EFFECT ----------
  useEffect(() => {
    let active = true;

    openMedia().then((stream) => {
      if (!active) return;

      streamRef.current = stream;
      userVideo.current.srcObject = stream;

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(
        `${protocol}://${window.location.host}/ws/join?roomID=${room_id}`
      );

      wsRef.current = ws;

      ws.onmessage = async (e) => {
        const msg = JSON.parse(e.data);

        switch (msg.type) {
          case "ready":
            await startCall();
            break;

          case "offer":
            await handleOffer(msg.offer);
            break;

          case "answer":
            await peerRef.current.setRemoteDescription(msg.answer);
            break;

          case "ice":
            await peerRef.current.addIceCandidate(msg.candidate);
            break;

          default:
            break;
        }
      };
    });

    return () => {
      active = false;
      wsRef.current?.close();
      peerRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [room_id]);

  // ---------- CONTROLS ----------
  const toggleMic = () => {
    streamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
      setMicOn(t.enabled);
    });
  };

  const toggleCam = () => {
    streamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
      setCamOn(t.enabled);
    });
  };

  // ---------- UI ----------
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Room {room_id}</h1>
          <p className="text-sm text-gray-400">Secure peer-to-peer session</p>
        </div>
        <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs text-green-400">
          Live
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <video
          ref={userVideo}
          autoPlay
          muted
          playsInline
          className="w-full aspect-video rounded-lg bg-black"
        />
        <video
          ref={partnerVideo}
          autoPlay
          playsInline
          className="w-full aspect-video rounded-lg bg-black"
        />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 pt-4">
        <button
          onClick={toggleMic}
          className={`px-4 py-2 rounded ${
            micOn ? "bg-gray-700" : "bg-red-600"
          }`}
        >
          {micOn ? "Mute" : "Unmute"}
        </button>

        <button
          onClick={toggleCam}
          className={`px-4 py-2 rounded ${
            camOn ? "bg-gray-700" : "bg-red-600"
          }`}
        >
          {camOn ? "Camera Off" : "Camera On"}
        </button>
      </div>
    </div>
  );
};

export default Room;

