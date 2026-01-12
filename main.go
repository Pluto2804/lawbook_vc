package main

import (
	"flag"
	"log"
	"net/http"
	"os"

	"lawbook_video_chat/server"
)

func main() {
	// Default address
	addr := flag.String("addr", ":8080", "HTTP network address")
	flag.Parse()

	// Initialize room storage
	server.AllRooms.Init()

	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)

	// WebSocket signaling endpoint
	http.HandleFunc("/ws/join", server.JoinRoomReqHandler)

	infoLog.Printf("Starting signaling server on %s", *addr)

	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		errorLog.Fatal(err)
	}
}
