import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const Room = () => {
  const { room_id } = useParams();

  const userVideo = useRef(null);
  const partnerVideo = useRef(null);

  const userStream = useRef(null);
  const peerRef = useRef(null);
  const wsRef = useRef(null);

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
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
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

  // ---------- CALLER (FIRST USER) ----------
  const startCall = async () => {
    peerRef.current = createPeer();

    userStream.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, userStream.current);
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

  // ---------- ANSWERER (SECOND USER) ----------
  const handleOffer = async (offer) => {
    peerRef.current = createPeer();

    await peerRef.current.setRemoteDescription(offer);

    userStream.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, userStream.current);
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
    let mounted = true;

    openCamera()
      .then((stream) => {
        if (!mounted) return;

        userStream.current = stream;
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
              // ONLY FIRST USER RECEIVES THIS
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
        <div>
          <p className="text-sm text-gray-400 mb-2">You</p>
          <video
            ref={userVideo}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg bg-black aspect-video"
          />
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Participant</p>
          <video
            ref={partnerVideo}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-black aspect-video"
          />
        </div>
      </div>
    </div>
  );
};

export default Room;

