import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Sidebar from "../layouts/Sidebar";
import Api from "../config/Api";
import socket from "../config/Socket";

function Webrtc() {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user"));

  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState(null); // 'video' or 'audio'
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const startCall = async (type) => {
    setCallType(type);
    const constraints = type === "audio" ? { audio: true, video: false } : { audio: true, video: true };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio/video calling.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (type === "video") localVideoRef.current.srcObject = stream;

      peerConnection.current = new RTCPeerConnection();
      stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

      peerConnection.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            to: location.state.userId,
            candidate: event.candidate,
          });
        }
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("call-user", {
        userToCall: location.state.userId,
        offer,
        from: userData._id,
        type,
      });

      setIsCalling(true);
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Failed to access media devices. Please check your permissions.");
    }
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallType(null);
    setIsCalling(false);
  };

  useEffect(() => {
    socket.on("call-made", async ({ offer, from, type }) => {
      const accept = window.confirm(`Incoming ${type} call. Accept?`);
      if (!accept) return;

      setCallType(type);
      const constraints = type === "audio" ? { audio: true, video: false } : { audio: true, video: true };

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support audio/video calling.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
        if (type === "video") localVideoRef.current.srcObject = stream;

        peerConnection.current = new RTCPeerConnection();
        stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

        peerConnection.current.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          remoteVideoRef.current.srcObject = event.streams[0];
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              to: from,
              candidate: event.candidate,
            });
          }
        };

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.emit("make-answer", { answer, to: from });
        setIsCalling(true);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Failed to access media devices. Please check your permissions.");
      }
    });

    socket.on("answer-made", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (candidate && peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off("call-made");
      socket.off("answer-made");
      socket.off("ice-candidate");
    };
  }, [location.state.userId, userData._id]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-white flex justify-between space-x-2">
          <button
            onClick={() => startCall("video")}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            📹 Video Call
          </button>
          <button
            onClick={() => startCall("audio")}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            🎧 Audio Call
          </button>
          {isCalling && (
            <button onClick={endCall} className="bg-red-500 text-white px-4 py-2 rounded">
              ⛔ End Call
            </button>
          )}
        </div>

        {/* <div className="flex-1 p-4 bg-black flex justify-center items-center space-x-4">
          {callType === "video" && (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-1/2 rounded shadow-lg border border-white"
              />
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-1/2 rounded shadow-lg border border-white"
              />
            </>
          )}
          {callType === "audio" && remoteStream && (
            <audio ref={remoteVideoRef} autoPlay />
          )}
        </div> */}
      </main>
    </div>
  );
}

export default Webrtc;


