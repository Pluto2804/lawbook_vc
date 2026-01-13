package main

import (
	"flag"
	"lawbook_video_chat/server"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  Warning: .env file not found, using system environment variables")
	}

	// Initialize Gemini AI
	if err := server.InitGemini(); err != nil {
		log.Printf("⚠️  Gemini AI initialization failed: %v", err)
		log.Println("⚠️  AI evaluation features will be disabled")
	}
	defer server.CloseGemini()

	// For local development: default 8080
	addr := flag.String("addr", ":8080", "HTTP network address")
	flag.Parse()

	server.AllRooms.Init()
	go server.BroadCaster()

	// Existing routes
	http.HandleFunc("/create", server.CreateRoomReqHandler)
	http.HandleFunc("/join", server.JoinRoomReqHandler)

	// New AI evaluation route
	http.HandleFunc("/api/evaluate", server.HandleEvaluateAudio)

	// Serve static frontend files
	http.Handle("/", http.FileServer(http.Dir("./client/dist")))

	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(os.Stderr, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)

	infoLog.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	infoLog.Println("🚀 Lawbook Video Chat Server Starting")
	infoLog.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	infoLog.Printf("📍 Address: %s", *addr)
	infoLog.Println("🔌 WebSocket: /create, /join")
	infoLog.Println("🤖 AI Evaluation: /api/evaluate")
	infoLog.Println("📁 Static files: ./client/dist")
	infoLog.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		errorLog.Println(err)
	}
}
