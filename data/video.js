document.addEventListener("DOMContentLoaded", function () {
    // Get DOM elements
    const videoStream = document.getElementById("video-stream");
    const connectionStatus = document.getElementById("connection-status");
    const resolutionSelect = document.getElementById("resolution");
    const formatSelect = document.getElementById("format");
    const snapshotFormatSelect = document.getElementById("snapshot-format");
    const snapshotButton = document.getElementById("snapshot-button");
    const recordButton = document.getElementById("record-button");
    const stopButton = document.getElementById("stop-button");
    const zoomLevel = document.getElementById("zoom-level");
    
    // Other status indicators
    const lightStatus = document.getElementById("light-status");
    const irStatus = document.getElementById("ir-status");
    const batteryStatus = document.getElementById("battery-status");

    // Variables for recording
    let mediaRecorder;
    let recordedChunks = [];
    let isRecording = false;
    let recordingStartTime;
    let recordingTimer;
    
    // Get ESP32-CAM IP from config or use placeholder
    // You should replace this with actual IP loading from config.json
    const ESP32_CAM_IP = localStorage.getItem('esp32CamIp') || 'http://[YOUR_ESP32_CAM_IP]';
    
    // Set up initial video source URL
    function setVideoSource(resolution = 'medium') {
        try {
            const baseUrl = `${ESP32_CAM_IP}/stream`;
            videoStream.src = `${baseUrl}?resolution=${resolution}`;
            videoStream.play().catch(error => {
                console.error("Error playing video:", error);
                updateConnectionStatus(false);
            });
        } catch (error) {
            console.error("Error setting video source:", error);
            updateConnectionStatus(false);
        }
    }

    // Update connection status indicator
    function updateConnectionStatus(isOnline) {
        if (!connectionStatus) return;
        
        if (isOnline) {
            connectionStatus.textContent = "Online";
            connectionStatus.className = "indicator online";
        } else {
            connectionStatus.textContent = "Offline";
            connectionStatus.className = "indicator offline";
        }
    }

    // Initialize video stream
    setVideoSource(resolutionSelect ? resolutionSelect.value : 'medium');

    // Video stream event listeners
    if (videoStream) {
        videoStream.addEventListener("playing", () => {
            updateConnectionStatus(true);
            // Periodically check status from ESP32-CAM
            fetchCameraStatus();
        });

        videoStream.addEventListener("error", () => {
            updateConnectionStatus(false);
        });
        
        videoStream.addEventListener("stalled", () => {
            updateConnectionStatus(false);
        });
    }

    // Apply zoom level to video
    if (zoomLevel) {
        zoomLevel.addEventListener("input", () => {
            const zoom = zoomLevel.value;
            videoStream.style.transform = `scale(${zoom})`;
            videoStream.style.transformOrigin = "center";
        });
    }

    // Change video resolution on selection
    if (resolutionSelect) {
        resolutionSelect.addEventListener("change", () => {
            setVideoSource(resolutionSelect.value);
        });
    }

    // Take snapshot functionality
    if (snapshotButton) {
        snapshotButton.addEventListener("click", () => {
            if (!videoStream || videoStream.readyState < 2) {
                alert("Video stream is not ready. Please wait.");
                return;
            }
            
            // Create canvas with video dimensions
            const canvas = document.createElement("canvas");
            canvas.width = videoStream.videoWidth;
            canvas.height = videoStream.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(videoStream, 0, 0);
            
            // Get selected format (jpg or png)
            const format = snapshotFormatSelect ? snapshotFormatSelect.value : 'jpg';
            const mimeType = `image/${format}`;
            const dataURL = canvas.toDataURL(mimeType);
            
            // Generate timestamp for filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            // Option 1: Send to ESP32-CAM to save on SD card
            fetch(`${ESP32_CAM_IP}/save_snapshot`, {
                method: 'POST',
                body: JSON.stringify({ 
                    image: dataURL,
                    format: format,
                    filename: `snapshot_${timestamp}.${format}`
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Snapshot saved successfully as ${data.filename}`);
                } else {
                    throw new Error(data.message || "Failed to save snapshot");
                }
            })
            .catch(error => {
                console.error("Error saving snapshot:", error);
                
                // Option 2: If server save fails, download locally
                const downloadLink = document.createElement("a");
                downloadLink.href = dataURL;
                downloadLink.download = `snapshot_${timestamp}.${format}`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                alert("Snapshot downloaded to your device.");
            });
        });
    }

    // Recording functionality
    if (recordButton && stopButton) {
        recordButton.addEventListener("click", startRecording);
        stopButton.addEventListener("click", stopRecording);
    }

    function startRecording() {
        if (!videoStream || videoStream.readyState < 2) {
            alert("Video stream is not ready. Please wait.");
            return;
        }
        
        try {
            recordedChunks = [];
            const stream = videoStream.captureStream();
            
            // Get selected format
            const format = formatSelect ? formatSelect.value : 'mp4';
            let mimeType = 'video/webm;codecs=vp9'; // default for compatibility
            
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                mimeType = 'video/webm;codecs=vp9';
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                mimeType = 'video/webm';
            } else if (MediaRecorder.isTypeSupported('video/mp4')) {
                mimeType = 'video/mp4';
            }
            
            // Create MediaRecorder with selected options
            mediaRecorder = new MediaRecorder(stream, { mimeType });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                isRecording = false;
                clearInterval(recordingTimer);
                saveRecording(format);
            };
            
            mediaRecorder.onerror = (event) => {
                console.error("MediaRecorder error:", event);
                alert("Recording error occurred. Please try again.");
                stopRecording();
            };
            
            // Start recording
            mediaRecorder.start(1000); // Collect data every second
            isRecording = true;
            recordingStartTime = new Date();
            
            // Update UI
            recordButton.disabled = true;
            recordButton.textContent = "Recording...";
            stopButton.disabled = false;
            
            // Start recording timer display
            updateRecordingTimer();
            recordingTimer = setInterval(updateRecordingTimer, 1000);
            
            // Update status on ESP32-CAM
            fetch(`${ESP32_CAM_IP}/record_status`, {
                method: 'POST',
                body: JSON.stringify({ status: 'recording' }),
                headers: { 'Content-Type': 'application/json' }
            }).catch(e => console.error("Error updating recording status:", e));
            
        } catch (error) {
            console.error("Error starting recording:", error);
            alert("Failed to start recording. Your browser may not support this feature.");
        }
    }

    function stopRecording() {
        if (mediaRecorder && isRecording) {
            try {
                mediaRecorder.stop();
                
                // Update UI
                recordButton.disabled = false;
                recordButton.textContent = "Start Recording";
                stopButton.disabled = true;
                
                // Update status on ESP32-CAM
                fetch(`${ESP32_CAM_IP}/record_status`, {
                    method: 'POST',
                    body: JSON.stringify({ status: 'stopped' }),
                    headers: { 'Content-Type': 'application/json' }
                }).catch(e => console.error("Error updating recording status:", e));
                
            } catch (error) {
                console.error("Error stopping recording:", error);
                alert("Error stopping recording.");
            }
        }
    }

    function updateRecordingTimer() {
        if (!isRecording) return;
        
        const elapsed = Math.floor((new Date() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        
        recordButton.textContent = `Recording: ${minutes}:${seconds}`;
    }

    function saveRecording(format) {
        if (recordedChunks.length === 0) {
            alert("No recording data available.");
            return;
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `recording_${timestamp}.${format}`;
        const blob = new Blob(recordedChunks, { type: format === 'mp4' ? 'video/mp4' : 'video/webm' });
        
        // Option 1: Try to send to ESP32-CAM to save on SD card
        const reader = new FileReader();
        reader.onload = function() {
            const base64data = reader.result.split(',')[1];
            
            fetch(`${ESP32_CAM_IP}/save_recording`, {
                method: 'POST',
                body: JSON.stringify({
                    video: base64data,
                    filename: filename,
                    format: format
                }),
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Recording saved successfully as ${data.filename}`);
                } else {
                    throw new Error(data.message || "Failed to save recording");
                }
            })
            .catch(error => {
                console.error("Error saving recording to ESP32:", error);
                
                // Option 2: If server save fails, download locally
                downloadRecording(blob, filename);
            });
        };
        
        // Check if file is too large to send directly (>5MB)
        if (blob.size > 5 * 1024 * 1024) {
            // Skip server upload and download directly
            downloadRecording(blob, filename);
        } else {
            reader.readAsDataURL(blob);
        }
    }

    function downloadRecording(blob, filename) {
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url); // Clean up
        alert("Recording downloaded to your device.");
    }

    // Fetch camera status information
    function fetchCameraStatus() {
        // Only fetch if we have status indicators
        if (!lightStatus && !irStatus && !batteryStatus) return;
        
        fetch(`${ESP32_CAM_IP}/status`)
            .then(response => response.json())
            .then(data => {
                // Update light level indicator
                if (lightStatus && data.lightLevel) {
                    lightStatus.textContent = `Light Level: ${data.lightLevel}`;
                    // Add classes based on light level
                    if (data.lightLevel < 30) {
                        lightStatus.className = "indicator low-light";
                    } else if (data.lightLevel > 80) {
                        lightStatus.className = "indicator high-light";
                    } else {
                        lightStatus.className = "indicator normal-light";
                    }
                }
                
                // Update IR status
                if (irStatus && data.irStatus !== undefined) {
                    irStatus.textContent = `IR: ${data.irStatus ? 'On' : 'Off'}`;
                    irStatus.className = `indicator ${data.irStatus ? 'ir-on' : 'ir-off'}`;
                }
                
                // Update battery status
                if (batteryStatus && data.batteryLevel !== undefined) {
                    batteryStatus.textContent = `Battery: ${data.batteryLevel}%`;
                    
                    // Add classes based on battery level
                    if (data.batteryLevel < 20) {
                        batteryStatus.className = "indicator battery-low";
                    } else if (data.batteryLevel < 50) {
                        batteryStatus.className = "indicator battery-medium";
                    } else {
                        batteryStatus.className = "indicator battery-good";
                    }
                }
            })
            .catch(error => {
                console.error("Error fetching camera status:", error);
            });
    }

    // Set up periodic status polling (every 5 seconds)
    setInterval(fetchCameraStatus, 5000);
    
    // Automatically reconnect video if connection is lost
    setInterval(() => {
        if (videoStream && !videoStream.videoHeight) {
            console.log("Video connection lost, attempting reconnection...");
            setVideoSource(resolutionSelect ? resolutionSelect.value : 'medium');
        }
    }, 10000);
});