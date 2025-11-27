package main

import (
	"lawbook_video_chat/server"
	"log"
	"net/http"
	"os"
)

func main() {

	server.AllRooms.Init()
	go server.BroadCaster()

	http.HandleFunc("/create", server.CreateRoomReqHandler)
	http.HandleFunc("/join", server.JoinRoomReqHandler)

	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)

	// IMPORTANT: Use the PORT environment variable on DigitalOcean
	port := os.Getenv("PORT")
	if port == "" {
		// local development fallback
		port = "8000"
	}

	infoLog.Printf("Starting a server on :%s", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		errorLog.Println(err)
	}
}
