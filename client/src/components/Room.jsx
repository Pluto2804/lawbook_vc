import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const Room = () => {
  const userVideo = useRef(null);
  const userStream = useRef(null);
  const partnerVideo = useRef(null);
  const peerRef = useRef(null);
  const webSocketRef = useRef(null);
  const { room_id } = useParams();

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

  useEffect(() => {
    let mounted = true;

    // ---- Peer helpers ----
    const handleTrackEvent = (e) => {
      console.log("Received tracks event", e);
      if (partnerVideo.current && e.streams && e.streams[0]) {
        partnerVideo.current.srcObject = e.streams[0];
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
      // add local tracks to peer
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
        // Set remote description
        await peerRef.current.setRemoteDescription(offer);
        // Add local tracks
        if (userStream.current) {
          userStream.current.getTracks().forEach((track) => {
            peerRef.current.addTrack(track, userStream.current);
          });
        }
        // Create and send answer
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
          webSocketRef.current.send(JSON.stringify({ answer: peerRef.current.localDescription }));
        }
      } catch (err) {
        console.error("Error handling offer", err);
      }
    };

    // ---- Start camera and websocket ----
    openCamera()
      .then((stream) => {
        if (!mounted) return;
        userVideo.current && (userVideo.current.srcObject = stream);
        userStream.current = stream;

        // create and open websocket
        const ws = new WebSocket(`ws://localhost:8080/join?roomID=${encodeURIComponent(room_id)}`);
        webSocketRef.current = ws;

        ws.addEventListener("open", () => {
          console.log("WebSocket open — joining room");
          ws.send(JSON.stringify({ join: true }));
        });

        ws.addEventListener("message", async (e) => {
          try {
            const message = JSON.parse(e.data);

            if (message.join) {
              // other peer joined, initiate call
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
              // message.offer should be RTCSessionDescriptionInit — pass directly
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
        });

        ws.addEventListener("error", (err) => {
          console.error("WebSocket error", err);
        });
      })
      .catch((err) => {
        console.error("Could not open camera or start media:", err);
      });

    // ---- cleanup on unmount ----
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
        // stop all local tracks
        userStream.current.getTracks().forEach((t) => t.stop());
        userStream.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room_id]);

  return (
    <div>
      <video autoPlay playsInline ref={userVideo} muted controls={true} style={{ width: "45%" }} />
      <video autoPlay playsInline ref={partnerVideo} controls={true} style={{ width: "45%" }} />
    </div>
  );
};

export default Room;
