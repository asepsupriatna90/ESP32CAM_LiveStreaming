// File access and management functions for SAVE-CAM
document.addEventListener("DOMContentLoaded", function () {
    // Initialize variables
    let fileList = [];
    let currentPage = 1;
    let filesPerPage = 10;
    let totalPages = 1;
    let currentFilter = 'all';
    let currentSort = 'date-desc';
    let selectedFiles = new Set();
    
    // Get DOM elements
    const fileListElement = document.getElementById("file-list");
    const loadingIndicator = document.getElementById("loading-indicator");
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
    const pageInfoElement = document.getElementById("page-info");
    const refreshBtn = document.getElementById("refresh-btn");
    const filterSelect = document.getElementById("file-type");
    const sortSelect = document.getElementById("file-sort");
    const selectAllBtn = document.getElementById("select-all-btn");
    const deselectAllBtn = document.getElementById("deselect-all-btn");
    const deleteSelectedBtn = document.getElementById("delete-selected-btn");
    
    // Preview elements
    const noPreviewElement = document.getElementById("no-preview");
    const imagePreview = document.getElementById("image-preview");
    const videoPreview = document.getElementById("video-preview");
    const audioPreview = document.getElementById("audio-preview");
    const fileNameElement = document.getElementById("file-name");
    const fileSizeElement = document.getElementById("file-size");
    const fileDateElement = document.getElementById("file-date");
    const fileTypeElement = document.getElementById("file-type-info");
    
    // Storage info elements
    const storageUsed = document.getElementById("storage-used");
    const storageStats = document.getElementById("storage-stats");
    
    // Check if we're on the SD card page
    if (!fileListElement) return;
    
    // Initial file load
    loadFiles();
    
    // Load SD card storage info
    loadStorageInfo();
    
    // Event listeners
    if (refreshBtn) {
        refreshBtn.addEventListener("click", function() {
            loadFiles();
            loadStorageInfo();
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener("change", function() {
            currentFilter = this.value;
            currentPage = 1;
            renderFileList();
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener("change", function() {
            currentSort = this.value;
            sortFiles();
            renderFileList();
        });
    }
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", function() {
            if (currentPage > 1) {
                currentPage--;
                renderFileList();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", function() {
            if (currentPage < totalPages) {
                currentPage++;
                renderFileList();
            }
        });
    }
    
    if (selectAllBtn) {
        selectAllBtn.addEventListener("click", selectAllFiles);
    }
    
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener("click", deselectAllFiles);
    }
    
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener("click", deleteSelectedFiles);
    }
    
    // Load files from ESP32-CAM
    function loadFiles() {
        if (!fileListElement || !loadingIndicator) return;
        
        // Show loading indicator
        loadingIndicator.style.display = "block";
        fileListElement.innerHTML = "";
        
        // Reset selected files
        selectedFiles.clear();
        
        // Get files from server
        fetch(SAVE_CAM_CONFIG.getUrl('fileList'), {
            headers: SAVE_CAM_AUTH.getAuthHeaders()
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            fileList = Array.isArray(data.files) ? data.files : [];
            
            // Add file details if available
            fileList = fileList.map(file => {
                return typeof file === 'string' 
                    ? { name: file, size: 0, date: new Date(0), type: getFileType(file) }
                    : { ...file, type: getFileType(file.name) };
            });
            
            sortFiles();
            renderFileList();
        })
        .catch(error => {
            console.error('Error fetching file list:', error);
            fileListElement.innerHTML = `<li class="error">Error loading files: ${error.message}</li>`;
            loadingIndicator.style.display = "none";
        });
    }
    
    // Load SD card storage information
    function loadStorageInfo() {
        if (!storageUsed || !storageStats) return;
        
        fetch(SAVE_CAM_CONFIG.getUrl('storageInfo'), {
            headers: SAVE_CAM_AUTH.getAuthHeaders()
        })
        .then(response => response.json())
        .then(data => {
            // Update storage meter
            const usedPercentage = data.usedPercentage || 0;
            storageUsed.style.width = `${usedPercentage}%`;
            
            // Change color based on usage
            if (usedPercentage > 90) {
                storageUsed.style.backgroundColor = '#dc3545'; // Red for critical
            } else if (usedPercentage > 70) {
                storageUsed.style.backgroundColor = '#ffc107'; // Yellow for warning
            } else {
                storageUsed.style.backgroundColor = '#28a745'; // Green for good
            }
            
            // Update storage stats text
            const usedSpace = formatFileSize(data.usedBytes || 0);
            const totalSpace = formatFileSize(data.totalBytes || 0);
            storageStats.textContent = `${usedSpace} used of ${totalSpace} (${usedPercentage}%)`;
        })
        .catch(error => {
            console.error('Error loading storage info:', error);
            storageStats.textContent = 'Error loading storage information';
        });
    }
    
    // Sort files based on current sort setting
    function sortFiles() {
        if (!fileList) return;
        
        switch (currentSort) {
            case 'date-desc':
                fileList.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'date-asc':
                fileList.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'name-asc':
                fileList.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                fileList.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'size-desc':
                fileList.sort((a, b) => b.size - a.size);
                break;
            case 'size-asc':
                fileList.sort((a, b) => a.size - b.size);
                break;
        }
    }
    
    // Render the file list with pagination
    function renderFileList() {
        if (!fileListElement || !loadingIndicator) return;
        
        // Filter files
        const filteredFiles = fileList.filter(file => {
            if (currentFilter === 'all') return true;
            return file.type === currentFilter;
        });
        
        // Calculate pagination
        totalPages = Math.ceil(filteredFiles.length / filesPerPage);
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        
        // Update pagination buttons
        if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
        if (pageInfoElement) {
            pageInfoElement.textContent = totalPages > 0 
                ? `Page ${currentPage} of ${totalPages}` 
                : 'No files';
        }
        
        // Clear the list
        fileListElement.innerHTML = '';
        
        // Hide loading indicator
        loadingIndicator.style.display = "none";
        
        // Show message if no files
        if (filteredFiles.length === 0) {
            fileListElement.innerHTML = '<li class="no-files">No files found on SD Card</li>';
            return;
        }
        
        // Get current page files
        const startIndex = (currentPage - 1) * filesPerPage;
        const endIndex = startIndex + filesPerPage;
        const pageFiles = filteredFiles.slice(startIndex, endIndex);
        
        // Render each file
        pageFiles.forEach(file => {
            const li = document.createElement('li');
            li.className = 'file-item';
            if (selectedFiles.has(file.name)) {
                li.classList.add('selected');
            }
            
            // Create file icon based on type
            const fileIcon = document.createElement('span');
            fileIcon.className = 'file-icon';
            
            switch (file.type) {
                case 'video':
                    fileIcon.innerHTML = '🎬';
                    break;
                case 'image':
                    fileIcon.innerHTML = '🖼️';
                    break;
                case 'audio':
                    fileIcon.innerHTML = '🔊';
                    break;
                default:
                    fileIcon.innerHTML = '📄';
            }
            
            // File checkbox for selection
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'file-select';
            checkbox.checked = selectedFiles.has(file.name);
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    selectedFiles.add(file.name);
                } else {
                    selectedFiles.delete(file.name);
                }
                li.classList.toggle('selected', this.checked);
                updateDeleteButton();
            });
            
            // File info container
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-meta">
                    <span class="file-size">${formatFileSize(file.size)}</span>
                    <span class="file-date">${formatDate(file.date)}</span>
                </span>
            `;
            
            // File actions
            const actions = document.createElement('div');
            actions.className = 'file-actions';
            
            // View button
            const viewBtn = document.createElement('button');
            viewBtn.className = 'button small';
            viewBtn.textContent = 'Preview';
            viewBtn.addEventListener('click', () => previewFile(file));
            
            // Download button
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'button small';
            downloadBtn.textContent = 'Download';
            downloadBtn.addEventListener('click', () => downloadFile(file));
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'button small danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteFile(file.name));
            
            // Assemble actions
            actions.appendChild(viewBtn);
            actions.appendChild(downloadBtn);
            actions.appendChild(deleteBtn);
            
            // Assemble list item
            li.appendChild(checkbox);
            li.appendChild(fileIcon);
            li.appendChild(fileInfo);
            li.appendChild(actions);
            
            // Add click event for preview
            fileInfo.addEventListener('click', () => previewFile(file));
            
            fileListElement.appendChild(li);
        });
        
        updateDeleteButton();
    }
    
    // Preview a file
    function previewFile(file) {
        if (!imagePreview || !videoPreview || !audioPreview || !noPreviewElement) return;
        
        // Hide all preview elements
        noPreviewElement.style.display = 'none';
        imagePreview.style.display = 'none';
        videoPreview.style.display = 'none';
        audioPreview.style.display = 'none';
        
        // Reset sources
        videoPreview.src = '';
        audioPreview.src = '';
        imagePreview.src = '';
        
        // Update file details
        if (fileNameElement) fileNameElement.textContent = file.name;
        if (fileSizeElement) fileSizeElement.textContent = formatFileSize(file.size);
        if (fileDateElement) fileDateElement.textContent = formatDate(file.date);
        if (fileTypeElement) fileTypeElement.textContent = getReadableFileType(file);
        
        // Get the file URL
        const fileUrl = `${SAVE_CAM_CONFIG.getUrl('fileAccess')}/${encodeURIComponent(file.name)}`;
        
        // Show appropriate preview based on file type
        switch (file.type) {
            case 'image':
                imagePreview.src = fileUrl;
                imagePreview.style.display = 'block';
                break;
                
            case 'video':
                videoPreview.src = fileUrl;
                videoPreview.style.display = 'block';
                break;
                
            case 'audio':
                audioPreview.src = fileUrl;
                audioPreview.style.display = 'block';
                break;
                
            default:
                noPreviewElement.textContent = 'Preview not available for this file type';
                noPreviewElement.style.display = 'block';
        }
    }
    
    // Download a file
    function downloadFile(file) {
        const fileUrl = `${SAVE_CAM_CONFIG.getUrl('fileAccess')}/${encodeURIComponent(file.name)}`;
        
        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Delete a file
    function deleteFile(fileName) {
        if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
            return;
        }
        
        fetch(`${SAVE_CAM_CONFIG.getUrl('fileDelete')}/${encodeURIComponent(fileName)}`, {
            method: 'DELETE',
            headers: SAVE_CAM_AUTH.getAuthHeaders()
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove from selected files
                selectedFiles.delete(fileName);
                
                // Remove from file list
                fileList = fileList.filter(file => file.name !== fileName);
                
                // Re-render
                renderFileList();
                
                // Refresh storage info
                loadStorageInfo();
            } else {
                alert(`Failed to delete ${fileName}: ${data.message || 'Unknown error'}`);
            }
        })
        .catch(error => {
            console.error('Error deleting file:', error);
            alert(`Error deleting file: ${error.message}`);
        });
    }
    
    // Delete selected files
    function deleteSelectedFiles() {
        if (selectedFiles.size === 0) {
            alert('No files selected');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)?`)) {
            return;
        }
        
        // Convert Set to Array
        const filesToDelete = Array.from(selectedFiles);
        
        // Create delete requests
        const deletePromises = filesToDelete.map(fileName => 
            fetch(`${SAVE_CAM_CONFIG.getUrl('fileDelete')}/${encodeURIComponent(fileName)}`, {
                method: 'DELETE',
                headers: SAVE_CAM_AUTH.getAuthHeaders()
            })
            .then(response => response.json())
        );
        
        // Process all delete requests
        Promise.all(deletePromises)
            .then(results => {
                const successCount = results.filter(result => result.success).length;
                
                if (successCount > 0) {
                    // Remove deleted files from list
                    fileList = fileList.filter(file => !selectedFiles.has(file.name));
                    
                    // Clear selected files
                    selectedFiles.clear();
                    
                    // Update UI
                    renderFileList();
                    loadStorageInfo();
                }
                
                alert(`${successCount} of ${filesToDelete.length} files deleted successfully`);
            })
            .catch(error => {
                console.error('Error deleting files:', error);
                alert(`Error deleting files: ${error.message}`);
            });
    }
    
    // Select all files
    function selectAllFiles() {
        // Filter files based on current filter and page
        const filteredFiles = fileList.filter(file => {
            if (currentFilter === 'all') return true;
            return file.type === currentFilter;
        });
        
        // Get current page files
        const startIndex = (currentPage - 1) * filesPerPage;
        const endIndex = startIndex + filesPerPage;
        const pageFiles = filteredFiles.slice(startIndex, endIndex);
        
        // Add all file names to selected set
        pageFiles.forEach(file => {
            selectedFiles.add(file.name);
        });
        
        // Update UI
        renderFileList();
    }
    
    // Deselect all files
    function deselectAllFiles() {
        selectedFiles.clear();
        renderFileList();
                
                const data = await response.json();
                
                if (data.success && data.token) {
                    this.setLoggedIn(data.token);
                    return { success: true };
                }
            }
            
            // Fallback to local authentication
            if (username === SAVE_CAM_CONFIG.auth.localUser && 
                password === SAVE_CAM_CONFIG.auth.localPass) {
                this.setLoggedIn('local_auth_token');
                return { success: true };
            }
            
            return { 
                success: false, 
                message: 'Invalid username or password.'
        } catch (error) {
            console.error('Login error:', error);
            
            // If server authentication fails, try local auth as last resort
            if (SAVE_CAM_CONFIG.auth.useServerAuth && 
                username === SAVE_CAM_CONFIG.auth.localUser && 
                password === SAVE_CAM_CONFIG.auth.localPass) {
                this.setLoggedIn('local_auth_token_fallback');
                return { 
                    success: true, 
                    message: 'Warning: Using local authentication because server is unavailable.'
                };
            }
            
            return { 
                success: false, 
                message: 'Connection error. Please try again.'
            };
        }
    },
    
    // Set logged in state
    setLoggedIn: function(token) {
        this.authToken = token;
        this.isLoggedIn = true;
        localStorage.setItem(SAVE_CAM_CONFIG.storage.sessionTokenName, token);
    },
    
    // Perform logout
    logout: function() {
        // Try to notify server about logout
        try {
            fetch(SAVE_CAM_CONFIG.getUrl('logout'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                }
            }).catch(e => console.log('Server logout notification failed:', e));
        } catch (e) {
            console.log('Error during logout:', e);
        }
        
        // Clear local session either way
        this.authToken = '';
        this.isLoggedIn = false;
        localStorage.removeItem(SAVE_CAM_CONFIG.storage.sessionTokenName);
        
        // Redirect to login page
        window.location.href = 'login.html';
    },
    
    // Get authorization headers for API requests
    getAuthHeaders: function() {
        return {
            'Authorization': `Bearer ${this.authToken}`
        };
    }
};

// Automatically initialize authentication on every page
document.addEventListener('DOMContentLoaded', function() {
    SAVE_CAM_AUTH.init();
});