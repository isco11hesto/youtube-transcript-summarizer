# youtube-transcript-summarizer
Google chrome extension that extracts the transcript from a youtube video, allowing you to see a summary of the video and ask questions about the video. Useful for longform podcasts

# YouTube Transcript Summarizer Chrome Extension

## Overview
The YouTube Transcript Summarizer is a full-stack Chrome extension that extracts YouTube video transcripts using a Flask backend (leveraging the [YouTube Transcript API](https://github.com/jdepoix/youtube-transcript-api)) and processes the transcript using the ChatGPT API to provide multiple analysis options. It supports long videos (3+ hours) by splitting the transcript into self-contained 1.5‑hour segments and generating separate summaries for each segment. Users can choose from summarization modes such as:

- **Concise Summary:** A brief summary of the transcript.
- **Most Useful Information:** Extraction of the key points.
- **Detailed Summary:** In-depth segmented summaries (with downloadable text).
- **Custom Prompt:** Analyze the transcript using a user-defined prompt.

## Features
- **Transcript Extraction:** Fetches transcript segments from YouTube via a Flask backend.
- **Multiple Summarization Modes:** Offers varied summaries based on user selection.
- **Long Video Support:** Splits transcripts into 1.5‑hour segments and independently summarizes each one.
- **Download Option:** Detailed summary sections can be downloaded as text files.
- **Custom Analysis:** Users may enter their own prompt for personalized analysis.

## 1. Backend Setup

### Create and Activate a Virtual Environment

For **Linux/Mac**:
```bash
python3 -m venv venv
source venv/bin/activate
```

For **Windows**:
```bash
python3 -m venv venv
venv\Scripts\activate
```

### Install Dependencies
Make sure you have the required Python packages:
```bash
pip install flask flask-cors youtube-transcript-api
```
Alternatively, if a requirements.txt is provided, run:
```bash
pip install -r requirements.txt
```

### Modify popup.js to include your OpenAI API key

### Run the Backend
Start the Flask server:
```bash
python backend.py
```
The backend will run on http://127.0.0.1:5000.

Tip: Verify the backend is working by navigating to, for example, http://127.0.0.1:5000/transcript?video_id=VIDEO_ID (replace VIDEO_ID with an actual YouTube video ID).

## 2. Installing the Chrome Extension
- Open Chrome and navigate to chrome://extensions/.
- Enable Developer Mode (toggle in the top-right corner).
- Click "Load unpacked."
- Select the folder containing the extension files (including manifest.json).
- Ensure the Backend is Running before using the extension.

## 3. Usage

### Visit a YouTube Video:
Navigate to any YouTube video page (e.g., a lecture, podcast, or tutorial).

### Open the Extension:
Click the extension icon in your Chrome toolbar to open the popup.

### Select a Summarization Mode:
- **Concise Summary**: Generate a brief summary of the transcript.
- **Most Useful Information**: Extract key points from the transcript.
- **Detailed Summary**: Produce a detailed summary segmented into 1.5‑hour sections; a download link is provided for each section.
- **Custom Prompt**: Enter your custom prompt in the textarea and click "Submit Custom Prompt" for personalized analysis.
- **Segment & Summarize Transcript**: This option splits the transcript into self-contained segments (every 1.5 hours) and summarizes each segment independently without re-summarizing the overall transcript.
