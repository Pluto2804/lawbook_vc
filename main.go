package main

import (
	"flag"
	"lawbook_video_chat/server"
	"log"
	"net/http"
	"os"
)

func main() {
	addr := flag.String("addr", ":8000", "HTTP network address")
	flag.Parse()
	server.AllRooms.Init()
	go server.BroadCaster()

	http.HandleFunc("/create", server.CreateRoomReqHandler)
	http.HandleFunc("/join", server.JoinRoomReqHandler)

	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)

	infoLog.Printf("Starting a server on %s", *addr)
	err := http.ListenAndServe(":8000", nil)
	if err != nil {
		errorLog.Println(err)
	}
}
