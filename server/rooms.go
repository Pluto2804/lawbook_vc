package server

import (
	"log"
	"math/rand"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Single entitiy in the hashmap
type Participant struct {
	Host bool
	Conn *websocket.Conn
}

// Main hashmap with [roomID string] -> [[]Participant]
type RoomMap struct {
	Mutex sync.RWMutex
	Map   map[string][]Participant
}

// init initialises the RoomMap struct
func (r *RoomMap) Init() {
	r.Map = make(map[string][]Participant)

}

// Get will return the number of participants in the room
func (r *RoomMap) Get(roomID string) []Participant {
	r.Mutex.RLock()
	defer r.Mutex.RUnlock()

	return r.Map[roomID]
}

// CreateRoom generates a unique roomID and return it -> insert it in the hashmap
func (r *RoomMap) CreateRoom() string {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()
	src := rand.NewSource(time.Now().UnixNano())
	ra := rand.New(src)
	var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789")
	b := make([]rune, 8)
	for i := range b {
		b[i] = letters[ra.Intn(len(letters))]
	}
	roomId := string(b)
	r.Map[roomId] = []Participant{}
	return roomId

}

// Will create a participant and add it in hashmap
func (r *RoomMap) InsertIntoRoom(roomID string, host bool, conn *websocket.Conn) {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()

	p := Participant{Host: host, Conn: conn}

	log.Println("Inserting into room with roomID: ", roomID)
	r.Map[roomID] = append(r.Map[roomID], p)

}

// Deletes the room with roomID
func (r *RoomMap) DeleteRoom(roomID string) {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()
	delete(r.Map, roomID)
}
