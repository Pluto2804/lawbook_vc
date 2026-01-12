import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const Room = () => {
  const { room_id } = useParams();

  const userVideo = useRef(null);
  const partnerVideo = useRef(null);

  const userStream = useRef(null);
  const peerRef = useRef(null);
  const wsRef = useRef(null);

  // ---- MEDIA ----
  const openCamera = async () => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
  };

  // ---- PEER ----
  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },

        //  ExpressTURN (mobile / NAT safe)
        {
          urls: "turn:free.expressturn.com:3478",
          username: "efPU52K4SLOQ34W2QY",
          credential: "1TJPNFxHKX7ZfeIz",
        },
      ],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        wsRef.current.send(
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

  // ---- HOST ----
  const startCall = async () => {
    peerRef.current = createPeer();

    userStream.current.getTracks().forEach((track) =>
      peerRef.current.addTrack(track, userStream.current)
    );

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    wsRef.current.send(JSON.stringify({ type: "offer", offer }));
  };

  // ---- GUEST ----
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

  // ---- EFFECT ----
  useEffect(() => {
    openCamera().then((stream) => {
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
    });

    return () => {
      wsRef.current?.close();
      peerRef.current?.close();
      userStream.current?.getTracks().forEach((t) => t.stop());
    };
  }, [room_id]);

  // ---- UI ----
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Room {room_id}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <video ref={userVideo} autoPlay muted playsInline />
        <video ref={partnerVideo} autoPlay playsInline />
      </div>
    </div>
  );
};

export default Room;
