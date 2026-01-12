package server

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Participant struct {
	Conn *websocket.Conn
}

type RoomMap struct {
	Mutex sync.Mutex
	Map   map[string][]*Participant
}

func (r *RoomMap) Init() {
	r.Map = make(map[string][]*Participant)
}

func (r *RoomMap) CreateRoom(roomID string) {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()
	r.Map[roomID] = []*Participant{}
}

func (r *RoomMap) AddParticipant(roomID string, p *Participant) int {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()

	r.Map[roomID] = append(r.Map[roomID], p)
	return len(r.Map[roomID])
}

func (r *RoomMap) GetOther(roomID string, self *websocket.Conn) *Participant {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()

	for _, p := range r.Map[roomID] {
		if p.Conn != self {
			return p
		}
	}
	return nil
}
