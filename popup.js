// Helper function to call the ChatGPT API with a given system prompt
async function callChatGPTWithSystemPrompt(text, systemPrompt) {
  const apiKey = ""; // Replace with your actual OpenAI API key.
  const endpoint = "https://api.openai.com/v1/chat/completions";
  
  const requestBody = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text }
    ],
    temperature: 0.7,
    max_tokens: 500
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error("Error from ChatGPT API:", response.statusText);
      return "Error summarizing transcript.";
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Fetch error:", error);
    return "Error summarizing transcript.";
  }
}

// Hierarchical summarization function (for smaller chunks)
async function hierarchicalSummarize(transcriptText, systemPrompt) {
  const maxChunkLength = 3000; // Adjust as needed (or use a token-based splitter for better accuracy)
  let chunks = [];
  for (let i = 0; i < transcriptText.length; i += maxChunkLength) {
    chunks.push(transcriptText.substring(i, i + maxChunkLength));
  }
  
  if (chunks.length === 1) {
    return await callChatGPTWithSystemPrompt(transcriptText, systemPrompt);
  }
  
  let chunkSummaries = [];
  for (const chunk of chunks) {
    const chunkSummary = await callChatGPTWithSystemPrompt(chunk, systemPrompt);
    chunkSummaries.push(chunkSummary);
  }
  
  const combinedSummaries = chunkSummaries.join("\n");
  const finalSummary = await callChatGPTWithSystemPrompt(combinedSummaries, systemPrompt);
  return finalSummary;
}

// New function: Split transcript into 1.5-hour segments and summarize each segment separately.
async function processAndSummarizeBySegment(systemPrompt) {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTabUrl = tabs[0].url;
    const urlObj = new URL(activeTabUrl);
    const videoId = urlObj.searchParams.get("v");
    if (!videoId) {
      document.getElementById("summary").innerText = "Not a valid YouTube video page.";
      return;
    }
    document.getElementById("summary").innerText = "Fetching transcript...";
    
    try {
      const backendUrl = `http://127.0.0.1:5000/transcript?video_id=${videoId}`;
      const response = await fetch(backendUrl);
      const data = await response.json();
      if (data.error) {
        document.getElementById("summary").innerText = "Error: " + data.error;
        return;
      }
      
      if (!Array.isArray(data.transcript)) {
        document.getElementById("summary").innerText = "Transcript is not available in segments.";
        return;
      }
      
      // Group transcript segments into 1.5-hour blocks (1.5 hours = 5400 seconds)
      const groups = {};
      data.transcript.forEach(segment => {
        // Determine which group this segment belongs to
        let groupIndex = Math.floor(segment.start / 5400);
        if (!groups[groupIndex]) {
          groups[groupIndex] = [];
        }
        groups[groupIndex].push(segment);
      });
      
      // Helper to format seconds as HH:MM
      function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
      
      let output = "";
      const groupIndices = Object.keys(groups).sort((a, b) => a - b);
      
      // Process each group separately.
      for (const groupIndex of groupIndices) {
        const segments = groups[groupIndex];
        const combinedText = segments.map(seg => seg.text).join(" ");
        // Summarize the text for this segment
        const groupSummary = await hierarchicalSummarize(combinedText, systemPrompt);
        // Compute time range header for the group
        const startTime = groupIndex * 5400;
        const endTime = (parseInt(groupIndex) + 1) * 5400;
        const header = `[${formatTime(startTime)} - ${formatTime(endTime)}]\n`;
        output += header + groupSummary + "\n\n";
      }
      
      document.getElementById("summary").innerText = output;
      document.getElementById("downloadLink").innerHTML = "";
    } catch (err) {
      console.error(err);
      document.getElementById("summary").innerText = "Error fetching transcript.";
    }
  });
}

// Existing functions for processing the transcript as a whole
async function processTranscriptAndSummarize(systemPrompt, enableDownload = false) {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTabUrl = tabs[0].url;
    const urlObj = new URL(activeTabUrl);
    const videoId = urlObj.searchParams.get("v");
    if (!videoId) {
      document.getElementById("summary").innerText = "Not a valid YouTube video page.";
      return;
    }
    document.getElementById("summary").innerText = "Fetching transcript...";
    
    try {
      const backendUrl = `http://127.0.0.1:5000/transcript?video_id=${videoId}`;
      const response = await fetch(backendUrl);
      const data = await response.json();
      if (data.error) {
        document.getElementById("summary").innerText = "Error: " + data.error;
        return;
      }
      
      let summaryResult;
      if (Array.isArray(data.transcript)) {
        // Combine the segments and process as one block.
        const combinedText = data.transcript.map(seg => seg.text).join(" ");
        summaryResult = await hierarchicalSummarize(combinedText, systemPrompt);
      } else {
        summaryResult = await callChatGPTWithSystemPrompt(data.transcript, systemPrompt);
      }
      
      document.getElementById("summary").innerText = summaryResult;
      
      if (enableDownload) {
        const blob = new Blob([summaryResult], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        document.getElementById("downloadLink").innerHTML =
          `<a href="${url}" download="detailed_summary.txt">Download Detailed Summary</a>`;
      } else {
        document.getElementById("downloadLink").innerHTML = "";
      }
    } catch (err) {
      console.error(err);
      document.getElementById("summary").innerText = "Error fetching transcript.";
    }
  });
}

// Event listeners for the different summary types

// 1. Concise Summary
document.getElementById("conciseBtn").addEventListener("click", () => {
  const systemPrompt = "You are a summarization assistant. Provide a concise summary of the following transcript:";
  processTranscriptAndSummarize(systemPrompt, false);
});

// 2. Most Useful Information
document.getElementById("usefulBtn").addEventListener("click", () => {
  const systemPrompt = "You are an information extraction assistant. Extract the most useful information from the following transcript:";
  processTranscriptAndSummarize(systemPrompt, false);
});

// 3. Detailed Summary (with download option)
document.getElementById("detailedBtn").addEventListener("click", () => {
  const systemPrompt = "You are a summarization assistant. Provide a detailed summary of the following transcript, including time stamps and highlighting the most important information:";
  processTranscriptAndSummarize(systemPrompt, true);
});

// 4. Custom Prompt – Use the text entered by the user as the system prompt
document.getElementById("customBtn").addEventListener("click", () => {
  const customPrompt = document.getElementById("customPrompt").value;
  if (!customPrompt) {
    alert("Please enter a custom prompt.");
    return;
  }
  processTranscriptAndSummarize(customPrompt, false);
});

// 5. Segment and Summarize Transcript (each 1.5-hour section separately)
document.getElementById("segmentBtn").addEventListener("click", () => {
  // Use the same system prompt as desired; you can also create separate buttons for different prompt types.
  const systemPrompt = "You are a summarization assistant. Provide a summary of the following transcript section:";
  processAndSummarizeBySegment(systemPrompt);
});
