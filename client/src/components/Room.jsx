import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const Room = () => {
  const { room_id } = useParams();

  const userVideo = useRef(null);
  const partnerVideo = useRef(null);

  const userStream = useRef(null);
  const peerRef = useRef(null);
  const wsRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

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
          urls: "turn:free.expressturn.com:3478",
          username: "efPU52K4SLOQ34W2QY",
          credential: "1TJPNFxHKX7Zfelz",
        },
        {
          urls: "turn:free.expressturn.com:3478?transport=tcp",
          username: "efPU52K4SLOQ34W2QY",
          credential: "1TJPNFxHKX7Zfelz",
        },
        {
          urls: "turns:free.expressturn.com:443?transport=tcp",
          username: "efPU52K4SLOQ34W2QY",
          credential: "1TJPNFxHKX7Zfelz",
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
      const video = partnerVideo.current;
      if (!video) return;

      video.muted = true; // mobile-safe
      video.playsInline = true;
      video.srcObject = e.streams[0];

      video
        .play()
        .catch(() => setNeedsTap(true));
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
    let mounted = true;

    openCamera()
      .then((stream) => {
        if (!mounted) return;

        userStream.current = stream;
        userVideo.current.srcObject = stream;

        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        wsRef.current = new WebSocket(
          `${protocol}://${window.location.host}/ws/join?roomID=${room_id}`
        );

        wsRef.current.onmessage = async (e) => {
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
      })
      .catch(console.error);

    return () => {
      mounted = false;
      wsRef.current?.close();
      peerRef.current?.close();
      userStream.current?.getTracks().forEach((t) => t.stop());
    };
  }, [room_id]);

  // ---------- MUTE / UNMUTE ----------
  const toggleMute = () => {
    const audioTrack = userStream.current
      ?.getAudioTracks()
      ?.find((t) => t.kind === "audio");

    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  };

  // ---------- UI ----------
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Room {room_id}</h1>
          <p className="text-sm text-gray-400">
            Secure peer-to-peer session
          </p>
        </div>
        <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs text-green-400">
          Live
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* YOU */}
        <div>
          <p className="text-sm text-gray-400 mb-2">You</p>
          <video
            ref={userVideo}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg bg-black aspect-video"
          />
          <button
            onClick={toggleMute}
            className={`mt-3 px-4 py-2 rounded text-white ${
              isMuted ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
        </div>

        {/* PARTICIPANT */}
        <div>
          <p className="text-sm text-gray-400 mb-2">Participant</p>
          <video
            ref={partnerVideo}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg bg-black aspect-video"
          />
          {needsTap && (
            <button
              onClick={() => partnerVideo.current?.play()}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Tap to start audio/video
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Room;
