<?php
session_start();

// Initialize chat history if not exists
if (!isset($_SESSION['chat_history'])) {
    $_SESSION['chat_history'] = [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web IDE</title>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@mdi/font@7.2.96/css/materialdesignicons.min.css" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
    
    <!-- Third-party libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs/loader.min.js"></script>
    
    <!-- Initialize our application -->
    <script>
        // Wait for all libraries to load
        window.addEventListener('load', function() {
            // Check if JSZip is loaded
            if (typeof JSZip === 'undefined') {
                console.error('JSZip library failed to load. Attempting to load it again...');
                // Try to load JSZip again
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                script.onload = function() {
                    console.log('JSZip loaded successfully on second attempt');
                    // Initialize our application after JSZip is loaded
                    if (!window.ide) {
                        window.ide = new IDE();
                    }
                };
                script.onerror = function() {
                    console.error('Failed to load JSZip even on second attempt');
                };
                document.head.appendChild(script);
            }
        });
    </script>
    
    <!-- Our application code -->
    <script src="script.js"></script>
</head>
<body>
    <div class="app-container">
        <!-- File Manager Panel -->
        <div class="panel file-manager" id="fileManagerPanel">
            <div class="panel-header">
                <h2>File Manager</h2>
                <button id="downloadProject" class="material-btn">
                    <i class="material-icons">cloud_download</i>
                </button>
            </div>
            <div class="file-list" id="fileList"></div>
        </div>

        <!-- Code Editor Panel -->
        <div class="panel editor" id="editorPanel">
            <div class="panel-header">
                <h2>Editor</h2>
                <div class="editor-actions">
                    <button id="downloadProject" class="material-btn">
                        <span class="material-icons">download</span>
                    </button>
                </div>
            </div>
            <div id="editorTabs" class="editor-tabs"></div>
            <div id="monacoEditor"></div>
            <div class="status-bar">
                <div class="progress-container">
                    <div class="progress-bar"></div>
                </div>
                <div class="status-text"></div>
                <div class="estimated-time"></div>
            </div>
            <div class="log-section">
                <div class="log-header">
                    <span>Activity Log</span>
                    <button class="clear-log">
                        <span class="material-icons">clear</span>
                    </button>
                </div>
                <div class="log-content"></div>
            </div>
        </div>

        <!-- AI Assistant Panel -->
        <div class="panel assistant" id="assistantPanel">
            <div class="panel-header">
                <h2>Assistant</h2>
            </div>
            <div class="chat-messages" id="chatMessages"></div>
            <div class="chat-input">
                <textarea id="promptInput" placeholder="Ask me anything..."></textarea>
                <button id="sendPrompt">
                    <span class="material-icons">send</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Resizer elements -->
    <div class="resizer" id="leftResizer"></div>
    <div class="resizer" id="rightResizer"></div>

</body>
</html>
