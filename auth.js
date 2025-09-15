// Authentication functions
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const loginText = document.getElementById("loginText");
  const loadingText = document.getElementById("loadingText");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");

  // Kiểm tra xem user đã đăng nhập chưa
  checkAuthStatus();

  // Xử lý form đăng nhập
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    hideMessages();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        showSuccess("Đăng nhập thành công!");
        setTimeout(() => {
          window.location.href = "profile.html";
        }, 1500);
      }
    } catch (error) {
      console.error("Login error:", error);
      showError("Đăng nhập thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  });
});

// Hàm đăng ký
async function register(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Register error:", error);
    return { success: false, error: error.message };
  }
}

// Hàm đăng xuất
async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout error:", error);
    alert("Có lỗi xảy ra khi đăng xuất: " + error.message);
  }
}

// Hàm kiểm tra trạng thái đăng nhập
async function checkAuthStatus() {
  try {
    // Chỉ kiểm tra nếu đang ở trang login
    if (window.location.pathname.includes("login.html")) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Nếu đã đăng nhập, chuyển đến trang profile
        window.location.href = "profile.html";
      }
    }
  } catch (error) {
    console.error("Auth check error:", error);
  }
}

// Hàm lấy thông tin user hiện tại
async function getCurrentUser() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}

// Hàm hiển thị loading
function setLoading(loading) {
  const loginBtn = document.getElementById("loginBtn");
  const loginText = document.getElementById("loginText");
  const loadingText = document.getElementById("loadingText");

  if (loading) {
    loginBtn.disabled = true;
    loginText.style.display = "none";
    loadingText.style.display = "inline";
  } else {
    loginBtn.disabled = false;
    loginText.style.display = "inline";
    loadingText.style.display = "none";
  }
}

// Hàm hiển thị lỗi
function showError(message) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}

// Hàm hiển thị thành công
function showSuccess(message) {
  const successMessage = document.getElementById("successMessage");
  successMessage.textContent = message;
  successMessage.style.display = "block";
}

// Hàm ẩn tất cả thông báo
function hideMessages() {
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");
  errorMessage.style.display = "none";
  successMessage.style.display = "none";
}

// Hàm hiển thị form đăng ký (có thể mở rộng sau)
function showRegister() {
  alert(
    "Tính năng đăng ký sẽ được thêm vào sau. Vui lòng liên hệ admin để tạo tài khoản."
  );
}

// Export functions để sử dụng trong các file khác
window.register = register;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
