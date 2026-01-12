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

	// When SECOND user joins → notify FIRST to start offer
	if count == 2 {
		if other := AllRooms.GetOther(roomID, ws); other != nil {
			other.Conn.WriteJSON(Signal{Type: "ready"})
		}
	}

	defer func() {
		AllRooms.Remove(roomID, ws)
		ws.Close()
	}()

	for {
		var msg Signal
		if err := ws.ReadJSON(&msg); err != nil {
			log.Println("read error:", err)
			break
		}

		AllRooms.Mutex.Lock()
		participants := AllRooms.Map[roomID]
		AllRooms.Mutex.Unlock()

		for _, p := range participants {
			if p.Conn != ws {
				_ = p.Conn.WriteJSON(msg)
			}
		}
	}
}
