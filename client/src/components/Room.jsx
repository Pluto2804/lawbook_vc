import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const Room = () => {
  const { room_id } = useParams();

  const userVideo = useRef(null);
  const partnerVideo = useRef(null);

  const userStream = useRef(null);
  const peerRef = useRef(null);
  const wsRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // ---------- MEDIA ----------
  const openCamera = async () => {
    return navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
  };

  // ---------- PEER ----------
  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
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
      partnerVideo.current.srcObject = e.streams[0];
    };

    return peer;
  };

  // ---------- CALLER ----------
  const startCall = async () => {
    peerRef.current = createPeer();

    userStream.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, userStream.current);
    });

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    wsRef.current.send(JSON.stringify({ type: "offer", offer }));
  };

  // ---------- ANSWERER ----------
  const handleOffer = async (offer) => {
    peerRef.current = createPeer();
    await peerRef.current.setRemoteDescription(offer);

    userStream.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, userStream.current);
    });

    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    wsRef.current.send(JSON.stringify({ type: "answer", answer }));
  };

  // ---------- EFFECT ----------
  useEffect(() => {
    openCamera().then((stream) => {
      userStream.current = stream;
      userVideo.current.srcObject = stream;

      const protocol = location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(
        `${protocol}://${location.host}/ws/join?roomID=${room_id}`
      );

      wsRef.current = ws;

      ws.onmessage = async (e) => {
        const msg = JSON.parse(e.data);

        if (msg.type === "ready") startCall();
        if (msg.type === "offer") handleOffer(msg.offer);
        if (msg.type === "answer")
          await peerRef.current.setRemoteDescription(msg.answer);
        if (msg.type === "ice")
          await peerRef.current.addIceCandidate(msg.candidate);
      };
    });

    return () => {
      wsRef.current?.close();
      peerRef.current?.close();
      userStream.current?.getTracks().forEach((t) => t.stop());
    };
  }, [room_id]);

  // ---------- CONTROLS ----------
  const toggleMic = () => {
    userStream.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
      setMicOn(t.enabled);
    });
  };

  const toggleCam = () => {
    userStream.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
      setCamOn(t.enabled);
    });
  };

  // ---------- UI ----------
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Room {room_id}</h1>
        <span className="text-green-400 text-xs">Live</span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <video
          ref={userVideo}
          autoPlay
          muted
          playsInline
          className="rounded-lg bg-black aspect-video"
        />
        <video
          ref={partnerVideo}
          autoPlay
          playsInline
          className="rounded-lg bg-black aspect-video"
        />
      </div>

      {/* CONTROLS */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={toggleMic}
          className={`px-4 py-2 rounded ${
            micOn ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {micOn ? "Mute" : "Unmute"}
        </button>

        <button
          onClick={toggleCam}
          className={`px-4 py-2 rounded ${
            camOn ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {camOn ? "Camera Off" : "Camera On"}
        </button>
      </div>
    </div>
  );
};

export default Room;
