package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type Evaluation struct {
	Accuracy float64 `json:"accuracy"`
	Feedback string  `json:"feedback"`
	Time     string  `json:"time"`
}

var geminiClient *genai.Client
var evaluationQueue = make(chan struct{}, 2)

func InitGemini() error {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("GEMINI_API_KEY not set in environment")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return fmt.Errorf("failed to create Gemini client: %v", err)
	}
	geminiClient = client
	log.Println("✅ Gemini AI client initialized successfully")
	return nil
}

func CloseGemini() {
	if geminiClient != nil {
		geminiClient.Close()
	}
}

func HandleEvaluateAudio(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if geminiClient == nil {
		http.Error(w, "Gemini AI not initialized", http.StatusServiceUnavailable)
		return
	}

	select {
	case evaluationQueue <- struct{}{}:
		defer func() { <-evaluationQueue }()
	default:
		http.Error(w, "Server busy, please try again", http.StatusServiceUnavailable)
		return
	}

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		log.Printf("Failed to parse form: %v", err)
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("audio")
	if err != nil {
		log.Printf("Audio file error: %v", err)
		http.Error(w, "Audio file required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	log.Printf("📥 Received audio file: %s (size: %d bytes)", header.Filename, header.Size)

	reference := r.FormValue("reference")
	if reference == "" {
		reference = `Under the Fourth Amendment, police generally require a warrant 
to conduct a search. However, exceptions exist, such as exigent circumstances 
where evidence may be destroyed, harm may occur, or a suspect might escape.`
	}

	audioBytes, err := io.ReadAll(file)
	if err != nil {
		log.Printf("Failed to read audio: %v", err)
		http.Error(w, "Failed to read audio", http.StatusInternalServerError)
		return
	}

	log.Printf("📊 Processing %d bytes of audio data", len(audioBytes))

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	model := geminiClient.GenerativeModel("gemini-pro")

	prompt := fmt.Sprintf(`You are an evaluator. Compare the user's spoken argument in the audio to this reference argument:

%s

Analyze how well the speaker's argument matches the reference in terms of:
- Key legal concepts mentioned
- Accuracy of legal principles
- Completeness of the argument

Return ONLY this JSON (no markdown, no code blocks):
{
  "accuracy": <float between 0 and 1>,
  "feedback": "<short feedback about what was good and what could be improved>"
}`, reference)

	log.Println("🤖 Sending request to Gemini...")

	resp, err := model.GenerateContent(ctx,
		genai.Text(prompt),
		&genai.Blob{
			MIMEType: "audio/webm",
			Data:     audioBytes,
		},
	)
	if err != nil {
		log.Printf("❌ Gemini API error: %v", err)
		http.Error(w, fmt.Sprintf("Gemini evaluation failed: %v", err), http.StatusInternalServerError)
		return
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		log.Println("❌ No response from Gemini")
		http.Error(w, "No response from Gemini", http.StatusInternalServerError)
		return
	}

	raw := fmt.Sprint(resp.Candidates[0].Content.Parts[0])
	log.Printf("📝 Raw Gemini response: %s", raw)

	clean := strings.ReplaceAll(raw, "```json", "")
	clean = strings.ReplaceAll(clean, "```", "")
	clean = strings.TrimSpace(clean)

	var eval Evaluation
	if err := json.Unmarshal([]byte(clean), &eval); err != nil {
		log.Printf("❌ JSON parse error: %v, Raw: %s", err, clean)
		http.Error(w, fmt.Sprintf("Failed to parse evaluation: %v", err), http.StatusInternalServerError)
		return
	}

	eval.Time = time.Now().Format("15:04:05")
	log.Printf("✅ Evaluation complete: Accuracy=%.2f, Feedback=%s", eval.Accuracy, eval.Feedback)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(eval)
}
