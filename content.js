function extractTranscript() {
    let transcriptText = "";
    // Try to select transcript segments (the class may change over time)
    const segments = document.querySelectorAll("ytd-transcript-segment-renderer");
    if (segments.length === 0) {
      console.log("Transcript not found. Please open transcript by clicking the three dots -> Open transcript.");
      return "";
    }
    segments.forEach(segment => {
      transcriptText += segment.innerText + " ";
    });
    return transcriptText.trim();
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getTranscript") {
      const transcript = extractTranscript();
      sendResponse({ transcript });
    }
  });
  