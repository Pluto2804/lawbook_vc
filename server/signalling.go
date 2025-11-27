package server

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

// Allrooms is basically a global hashmap for the server
var AllRooms RoomMap

// Create a room and return room id
func CreateRoomReqHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	roomID := AllRooms.CreateRoom()

	type resp struct {
		RoomID string `json:"room_id"`
	}
	log.Println(AllRooms.Map)
	json.NewEncoder(w).Encode(resp{RoomID: roomID})

}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type broadCastMsg struct {
	Message map[string]interface{}
	RoomID  string
	Client  *websocket.Conn
}

var broadcast = make(chan broadCastMsg)

func BroadCaster() {
	for {
		msg := <-broadcast

		clients := AllRooms.Map[msg.RoomID]
		for _, client := range clients {
			if client.Conn != msg.Client {
				err := client.Conn.WriteJSON(msg.Message)
				if err != nil {
					log.Println("Write error:", err)
					client.Conn.Close()
				}
			}
		}
	}
}

// Joins the client to a particular room
func JoinRoomReqHandler(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query()["roomID"]
	if len(roomID) == 0 {
		log.Println("roomID missing in URL Parameters")
		return
	}
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Websocket upgrage error ", err)
		return
	}
	AllRooms.InsertIntoRoom(roomID[0], false, ws)
	for {
		var msg broadCastMsg

		err := ws.ReadJSON(&msg.Message)
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		msg.Client = ws
		msg.RoomID = roomID[0]
		log.Println(msg.Message)
		broadcast <- msg
	}

	ws.Close()
}
