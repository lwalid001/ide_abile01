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
                <button id="downloadBtn" name="downloadBtn" class="material-btn" title="Download Project" type="button">
                    <i class="material-icons">cloud_download</i>
                </button>
                <input type="file" id="folderUpload" name="folderUpload" webkitdirectory directory multiple style="display:none;">
                <button id="uploadFolderBtn" name="uploadFolderBtn" class="material-btn" title="Upload Folder" type="button">
                    <i class="material-icons">folder_open</i>
                </button>
                <button id="saveAndDeployBtn" name="saveAndDeployBtn" class="material-btn" title="Save & Deploy" type="button">
                    <i class="material-icons">rocket_launch</i>
                </button>
            </div>
            <div class="file-list" id="fileList"></div>
        </div>

        <!-- Code Editor Panel -->
        <div class="panel editor" id="editorPanel">
            <div class="panel-header">
                <h2>Editor</h2>
            </div>
            <div id="editorTabs" class="editor-tabs"></div>
            <div id="monacoEditor"></div>
            <div class="status-bar" id="statusBar">
                <div class="progress-container">
                    <div class="progress-bar"></div>
                </div>
                <div class="status-text"></div>
                <div class="estimated-time"></div>
            </div>
            <div class="log-section" id="logSection">
                <div class="log-header">
                    <span>Activity Log</span>
                    <button id="clearLogBtn" class="clear-log material-btn" type="button">
                        <i class="material-icons">clear</i>
                    </button>
                </div>
                <div class="log-content" id="logContent"></div>
            </div>
        </div>

        <!-- AI Assistant Panel -->
        <div class="panel assistant" id="assistantPanel">
            <div class="panel-header">
                <h2>Assistant</h2>
            </div>
            <div class="chat-container">
                <div class="chat-messages" id="chatMessages"></div>
                <div class="chat-input">
                    <textarea id="promptInput" name="promptInput" placeholder="Ask me anything..." rows="3"></textarea>
                    <button id="sendPrompt" name="sendPrompt" class="material-btn" type="button">
                        <i class="material-icons">send</i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Resizer elements -->
    <div class="resizer" id="leftResizer"></div>
    <div class="resizer" id="rightResizer"></div>

</body>
</html>