import sys
import json

def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: whisper_transcribe.py <audio_path>\n")
        sys.exit(1)

    audio_path = sys.argv[1]

    try:
        import whisper
    except ImportError:
        sys.stderr.write("openai-whisper is not installed. Run: pip install openai-whisper\n")
        sys.exit(1)

    try:
        model = whisper.load_model("base")
        result = model.transcribe(audio_path)

        output = {
            "language": result.get("language", "pt"),
            "segments": [
                {
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": seg["text"].strip(),
                }
                for seg in result.get("segments", [])
            ],
        }

        print(json.dumps(output))
        sys.exit(0)

    except Exception as e:
        sys.stderr.write(str(e) + "\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
