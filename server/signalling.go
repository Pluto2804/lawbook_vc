package server

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var AllRooms RoomMap

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Signal struct {
	Type      string                 `json:"type"`
	Offer     map[string]interface{} `json:"offer,omitempty"`
	Answer    map[string]interface{} `json:"answer,omitempty"`
	Candidate map[string]interface{} `json:"candidate,omitempty"`
}

func JoinRoomReqHandler(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("roomID")
	if roomID == "" {
		http.Error(w, "roomID missing", http.StatusBadRequest)
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	participant := &Participant{Conn: ws}
	count := AllRooms.AddParticipant(roomID, participant)

	// ONLY when second user joins → tell first user to start offer
	if count == 2 {
		other := AllRooms.GetOther(roomID, ws)
		if other != nil {
			other.Conn.WriteJSON(Signal{Type: "ready"})
		}
	}

	for {
		var msg Signal
		if err := ws.ReadJSON(&msg); err != nil {
			log.Println("read error:", err)
			break
		}

		other := AllRooms.GetOther(roomID, ws)
		if other != nil {
			other.Conn.WriteJSON(msg)
		}
	}

	ws.Close()
}
