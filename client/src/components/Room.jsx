import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const Room = () => {
  const { room_id } = useParams();
  const navigate = useNavigate();

  const userVideo = useRef(null);
  const partnerVideo = useRef(null);

  const userStream = useRef(null);
  const peerRef = useRef(null);
  const wsRef = useRef(null);

  const [muted, setMuted] = useState(false);

  // ---------- MEDIA ----------
  const openCamera = async () => {
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
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
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
          JSON.stringify({ type: "ice", candidate: e.candidate })
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

    userStream.current.getTracks().forEach((track) =>
      peerRef.current.addTrack(track, userStream.current)
    );

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    wsRef.current.send(JSON.stringify({ type: "offer", offer }));
  };

  // ---------- ANSWERER ----------
  const handleOffer = async (offer) => {
    peerRef.current = createPeer();

    await peerRef.current.setRemoteDescription(offer);

    userStream.current.getTracks().forEach((track) =>
      peerRef.current.addTrack(track, userStream.current)
    );

    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    wsRef.current.send(JSON.stringify({ type: "answer", answer }));
  };

  // ---------- EFFECT ----------
  useEffect(() => {
    openCamera().then((stream) => {
      userStream.current = stream;
      userVideo.current.srcObject = stream;

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(
        `${protocol}://${window.location.host}/ws/join?roomID=${room_id}`
      );

      wsRef.current = ws;

      ws.onmessage = async (e) => {
        const msg = JSON.parse(e.data);

        if (msg.type === "ready") await startCall();
        if (msg.type === "offer") await handleOffer(msg.offer);
        if (msg.type === "answer")
          await peerRef.current.setRemoteDescription(msg.answer);
        if (msg.type === "ice")
          await peerRef.current.addIceCandidate(msg.candidate);
      };
    });

    return () => endCall();
    // eslint-disable-next-line
  }, [room_id]);

  // ---------- CONTROLS ----------
  const toggleMute = () => {
    userStream.current.getAudioTracks().forEach(
      (track) => (track.enabled = muted)
    );
    setMuted(!muted);
  };

  const endCall = () => {
    wsRef.current?.close();
    peerRef.current?.close();
    userStream.current?.getTracks().forEach((t) => t.stop());
    navigate("/");
  };

  // ---------- UI ----------
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Room {room_id}</h1>
        <span className="text-green-400 text-sm">Live</span>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <video
          ref={userVideo}
          autoPlay
          muted
          playsInline
          className="w-full rounded-lg bg-black aspect-video"
        />
        <video
          ref={partnerVideo}
          autoPlay
          playsInline
          className="w-full rounded-lg bg-black aspect-video"
        />
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={toggleMute}
          className="px-4 py-2 bg-slate-700 rounded-lg"
        >
          {muted ? "Unmute" : "Mute"}
        </button>

        <button
          onClick={endCall}
          className="px-4 py-2 bg-red-600 rounded-lg"
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default Room;
