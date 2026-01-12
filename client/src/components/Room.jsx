import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const Room = () => {
  const { room_id } = useParams();

  const userVideo = useRef(null);
  const partnerVideo = useRef(null);

  const userStream = useRef(null);
  const peerRef = useRef(null);
  const wsRef = useRef(null);

  const [connected, setConnected] = useState(false);

  // ==========================
  // MEDIA
  // ==========================
  const openCamera = async () => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
  };

  // ==========================
  // PEER CONNECTION
  // ==========================
  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },

        
        {
          urls: "turn:free.expressturn.com:3478",
          username: "efPU52K4SLOQ34W2QY",
          credential: "1TJPNFxHKX7Zfelz",
        },
      ],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate && wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: "ice",
            candidate: e.candidate,
          })
        );
      }
    };

    peer.ontrack = (e) => {
      console.log("Remote track received");

      if (partnerVideo.current) {
        partnerVideo.current.srcObject = e.streams[0];

       
        partnerVideo.current
          .play()
          .then(() => console.log("Remote video playing"))
          .catch(() => console.log("Autoplay blocked (user gesture required)"));
      }

      setConnected(true);
    };

    return peer;
  };

  // ==========================
  // CALLER (1st user)
  // ==========================
  const startCall = async () => {
    console.log("Starting call (offer)");

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

  // ==========================
  // ANSWERER (2nd user)
  // ==========================
  const handleOffer = async (offer) => {
    console.log("Handling offer");

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

  // ==========================
  // MAIN EFFECT
  // ==========================
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
              await startCall();
              break;

            case "offer":
              await handleOffer(msg.offer);
              break;

            case "answer":
              await peerRef.current.setRemoteDescription(msg.answer);
              break;

            case "ice":
              if (peerRef.current) {
                await peerRef.current.addIceCandidate(msg.candidate);
              }
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

  // ==========================
  // UI
  // ==========================
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
        {/* LOCAL */}
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

        {/* REMOTE */}
        <div>
          <p className="text-sm text-gray-400 mb-2">
            Participant {connected && "✓"}
          </p>
          <video
            ref={partnerVideo}
            autoPlay
            muted         
            playsInline
            className="w-full rounded-lg bg-black aspect-video"
          />
        </div>
      </div>
    </div>
  );
};

export default Room;
