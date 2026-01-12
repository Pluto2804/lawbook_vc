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

func (r *RoomMap) AddParticipant(roomID string, p *Participant) int {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()

	if _, ok := r.Map[roomID]; !ok {
		r.Map[roomID] = []*Participant{}
	}

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

func (r *RoomMap) Remove(roomID string, conn *websocket.Conn) {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()

	participants := r.Map[roomID]
	for i, p := range participants {
		if p.Conn == conn {
			r.Map[roomID] = append(participants[:i], participants[i+1:]...)
			break
		}
	}

	if len(r.Map[roomID]) == 0 {
		delete(r.Map, roomID)
	}
}
