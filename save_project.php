<?php
header('Content-Type: application/json');

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['projectDir']) || !isset($data['files'])) {
        throw new Exception('Missing required data');
    }

    $projectDir = 'project_' . preg_replace('/[^a-zA-Z0-9_-]/', '', $data['projectDir']);
    $isUpdate = isset($data['isUpdate']) && $data['isUpdate'];
    
    // Create projects directory if it doesn't exist
    $projectsPath = __DIR__ . '/projects';
    if (!file_exists($projectsPath)) {
        if (!mkdir($projectsPath, 0777, true)) {
            throw new Exception('Failed to create projects directory');
        }
    }

    // Create or verify project directory
    $projectPath = $projectsPath . '/' . $projectDir;
    if (!file_exists($projectPath)) {
        if (!mkdir($projectPath, 0777, true)) {
            throw new Exception('Failed to create project directory');
        }
    } else if (!$isUpdate) {
        // If it's not an update and directory exists, create a new one
        $timestamp = time();
        $projectDir = "project_{$data['projectDir']}_{$timestamp}";
        $projectPath = $projectsPath . '/' . $projectDir;
        if (!mkdir($projectPath, 0777, true)) {
            throw new Exception('Failed to create new project directory');
        }
    }

    $savedFiles = [];
    $errors = [];

    // Save each file
    foreach ($data['files'] as $filename => $content) {
        $filepath = $projectPath . '/' . basename($filename);
        
        // Create subdirectories if needed
        $dirpath = dirname($filepath);
        if (!file_exists($dirpath)) {
            if (!mkdir($dirpath, 0777, true)) {
                $errors[] = "Failed to create directory for: $filename";
                continue;
            }
        }

        // Write file content
        if (file_put_contents($filepath, $content) !== false) {
            $savedFiles[] = $filename;
        } else {
            $errors[] = "Failed to save: $filename";
        }
    }

    // Prepare response
    $response = [
        'success' => count($savedFiles) > 0,
        'url' => 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/projects/' . $projectDir,
        'saved_files' => $savedFiles
    ];

    if (!empty($errors)) {
        $response['errors'] = $errors;
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
