// Upload functionality
let selectedFiles = [];
let isUploading = false; // Thêm flag để tránh upload nhiều lần

document.addEventListener("DOMContentLoaded", function () {
  // Kiểm tra đăng nhập
  checkAuthAndLoad();

  // Xử lý file input
  const fileInput = document.getElementById("fileInput");
  const uploadArea = document.querySelector(".upload-area");
  const uploadBtn = document.getElementById("uploadBtn");

  // Xóa event listener cũ trước khi thêm mới
  fileInput.removeEventListener("change", handleFileSelect);
  uploadArea.removeEventListener("dragover", handleDragOver);
  uploadArea.removeEventListener("dragleave", handleDragLeave);
  uploadArea.removeEventListener("drop", handleDrop);
  uploadBtn.removeEventListener("click", uploadImages);

  fileInput.addEventListener("change", handleFileSelect);

  // Drag and drop functionality
  uploadArea.addEventListener("dragover", handleDragOver);
  uploadArea.addEventListener("dragleave", handleDragLeave);
  uploadArea.addEventListener("drop", handleDrop);

  // Upload button click với debounce
  uploadBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadImages();
  });

  // Thêm event listener để xử lý click trên upload area
  uploadArea.addEventListener("click", function (e) {
    // Nếu click vào nút xóa file hoặc xóa tất cả, không làm gì
    if (e.target.tagName === "BUTTON") {
      return;
    }

    // Nếu click vào vùng upload (không phải nút), mở file dialog
    document.getElementById("fileInput").click();
  });
});

// Kiểm tra đăng nhập và tải ảnh
async function checkAuthAndLoad() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Load user's images
  await loadUserImages();
}

// Xử lý chọn file
function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  addFiles(files);
}

// Xử lý drag over
function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("dragover");
}

// Xử lý drag leave
function handleDragLeave(event) {
  event.currentTarget.classList.remove("dragover");
}

// Xử lý drop
function handleDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.remove("dragover");

  const files = Array.from(event.dataTransfer.files);
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));
  addFiles(imageFiles);
}

// Thêm files vào danh sách
function addFiles(files) {
  const validFiles = files.filter((file) => {
    if (!file.type.startsWith("image/")) {
      showMessage("Chỉ chấp nhận file ảnh!", "error");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      showMessage("File quá lớn! Kích thước tối đa 10MB.", "error");
      return false;
    }
    return true;
  });

  selectedFiles = [...selectedFiles, ...validFiles];
  updateUploadButton();
  updateUploadArea();
}

// Cập nhật nút upload
function updateUploadButton() {
  const uploadBtn = document.getElementById("uploadBtn");
  uploadBtn.disabled = selectedFiles.length === 0;
  uploadBtn.textContent =
    selectedFiles.length > 0
      ? `Upload ${selectedFiles.length} ảnh`
      : "Upload ảnh";
}

// Cập nhật vùng upload
function updateUploadArea() {
  const uploadArea = document.querySelector(".upload-area");
  const uploadText = uploadArea.querySelector(".upload-text");

  if (selectedFiles.length > 0) {
    uploadText.innerHTML = `
      <div>Đã chọn ${selectedFiles.length} ảnh:</div>
      <div style="font-size: 0.9rem; margin-top: 10px; max-height: 100px; overflow-y: auto;">
        ${selectedFiles
          .map(
            (file, index) =>
              `<div style="margin: 2px 0; color: #666; display: flex; justify-content: space-between; align-items: center;">
            <span>${index + 1}. ${file.name} (${(
                file.size /
                1024 /
                1024
              ).toFixed(2)}MB)</span>
            <button onclick="removeFile(${index}, event)" style="background: #e74c3c; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">×</button>
          </div>`
          )
          .join("")}
      </div>
      <div style="margin-top: 10px;">
        <button onclick="clearAllFiles(event)" style="background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Xóa tất cả</button>
      </div>
    `;
    uploadArea.style.borderColor = "#27ae60";
    uploadArea.style.backgroundColor = "#f0f9f0";
  } else {
    uploadText.textContent = "Nhấp để chọn ảnh hoặc kéo thả vào đây";
    uploadArea.style.borderColor = "#667eea";
    uploadArea.style.backgroundColor = "white";
  }
}

// Upload ảnh lên Supabase Storage
async function uploadImages() {
  console.log("Upload function called, selectedFiles:", selectedFiles.length);

  if (selectedFiles.length === 0) return;

  // Kiểm tra xem đang upload chưa
  if (isUploading) {
    console.log("Đang upload, vui lòng đợi...");
    return;
  }

  console.log("Starting upload process...");
  isUploading = true;

  const uploadBtn = document.getElementById("uploadBtn");
  const progressBar = document.getElementById("progressBar");
  const progressFill = document.getElementById("progressFill");

  uploadBtn.disabled = true;
  uploadBtn.textContent = "Đang upload...";
  progressBar.style.display = "block";

  let uploadedCount = 0;
  const totalFiles = selectedFiles.length;

  try {
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      // Tạo filename an toàn cho tiếng Việt
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substr(2, 9);
      const fileExtension = file.name.split(".").pop();
      const baseName = file.name.replace(/\.[^/.]+$/, "");

      // Chuyển đổi tên file tiếng Việt thành ASCII
      const safeBaseName = baseName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
        .replace(/[^a-zA-Z0-9]/g, "_") // Thay thế ký tự đặc biệt bằng _
        .substring(0, 50); // Giới hạn độ dài

      const fileName = `${timestamp}_${randomString}_${safeBaseName}.${fileExtension}`;

      console.log(
        `Uploading file ${i + 1}/${totalFiles}: ${fileName} (original: ${
          file.name
        })`
      );

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (error) {
        console.error(`Upload error for file ${i + 1}:`, error);
        throw error;
      }

      console.log(`File ${i + 1} uploaded successfully:`, data.path);

      // Lưu thông tin ảnh vào database
      const { error: dbError } = await supabase.from("user_images").insert({
        user_id: (await getCurrentUser()).id,
        file_name: fileName,
        original_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: data.path,
        created_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error("Database error:", dbError);
      }

      uploadedCount++;
      const progress = (uploadedCount / totalFiles) * 100;
      progressFill.style.width = `${progress}%`;
    }

    showMessage(`Upload thành công ${uploadedCount} ảnh!`, "success");
    selectedFiles = [];
    updateUploadButton();
    updateUploadArea();

    // Reset file input
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.value = "";
    }

    // Reload gallery
    await loadUserImages();
  } catch (error) {
    console.error("Upload error:", error);
    showMessage("Upload thất bại: " + error.message, "error");
  } finally {
    isUploading = false; // Reset flag
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload ảnh";
    progressBar.style.display = "none";
    progressFill.style.width = "0%";
  }
}

// Tải ảnh của user
async function loadUserImages() {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = '<div class="loading">Đang tải ảnh...</div>';

  try {
    const user = await getCurrentUser();
    if (!user) return;

    const { data: images, error } = await supabase
      .from("user_images")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (images && images.length > 0) {
      displayImages(images);
    } else {
      gallery.innerHTML = '<div class="loading">Chưa có ảnh nào</div>';
    }
  } catch (error) {
    console.error("Load images error:", error);
    gallery.innerHTML = '<div class="loading">Lỗi khi tải ảnh</div>';
  }
}

// Hiển thị ảnh trong gallery
function displayImages(images) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  images.forEach((image) => {
    const imageCard = document.createElement("div");
    imageCard.className = "image-card";

    // Tạo URL public cho ảnh
    const { data: publicURL } = supabase.storage
      .from("images")
      .getPublicUrl(image.storage_path);

    imageCard.innerHTML = `
            <img src="${publicURL.publicUrl}" alt="${
      image.original_name
    }" loading="lazy">
            <div class="image-info">
                <div class="image-name" title="${image.original_name}">${
      image.original_name
    }</div>
                <div class="image-date">${new Date(
                  image.created_at
                ).toLocaleDateString("vi-VN")}</div>
                <div class="image-size">${(
                  image.file_size /
                  1024 /
                  1024
                ).toFixed(2)} MB</div>
                <button class="delete-btn" onclick="deleteImage('${
                  image.id
                }')">Xóa</button>
            </div>
        `;

    gallery.appendChild(imageCard);
  });
}

// Xóa ảnh
async function deleteImage(imageId) {
  if (!confirm("Bạn có chắc chắn muốn xóa ảnh này?")) return;

  try {
    // Lấy thông tin ảnh trước khi xóa
    const { data: image, error: fetchError } = await supabase
      .from("user_images")
      .select("storage_path")
      .eq("id", imageId)
      .single();

    if (fetchError) throw fetchError;

    // Xóa từ storage
    const { error: storageError } = await supabase.storage
      .from("images")
      .remove([image.storage_path]);

    if (storageError) throw storageError;

    // Xóa từ database
    const { error: dbError } = await supabase
      .from("user_images")
      .delete()
      .eq("id", imageId);

    if (dbError) throw dbError;

    showMessage("Xóa ảnh thành công!", "success");
    await loadUserImages();
  } catch (error) {
    console.error("Delete error:", error);
    showMessage("Xóa ảnh thất bại: " + error.message, "error");
  }
}

// Hiển thị thông báo
function showMessage(message, type) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = "block";

  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 5000);
}

// Xóa file khỏi danh sách đã chọn
function removeFile(index, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  selectedFiles.splice(index, 1);
  updateUploadButton();
  updateUploadArea();
  showMessage("Đã xóa file khỏi danh sách", "success");
}

// Xóa tất cả file đã chọn
function clearAllFiles(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  selectedFiles = [];
  updateUploadButton();
  updateUploadArea();
  showMessage("Đã xóa tất cả file", "success");
}

// Export functions
window.deleteImage = deleteImage;
window.removeFile = removeFile;
window.clearAllFiles = clearAllFiles;
