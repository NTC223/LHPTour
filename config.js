// Supabase Configuration
// Thay thế các giá trị này bằng thông tin project Supabase của bạn
const SUPABASE_URL = "https://xvotaskvbcajxcwqvfyg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2b3Rhc2t2YmNhanhjd3F2ZnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5Mjg2NTMsImV4cCI6MjA3MzUwNDY1M30.tGfRx3845-2qw6p5VQXS7d9PJPBd1gXOSuB7dsqNBG8";

// Đợi Supabase library load xong rồi mới khởi tạo client
function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    const supabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
    window.supabase = supabase;
  } else {
    // Nếu chưa load xong, thử lại sau 100ms
    setTimeout(initSupabase, 100);
  }
}

// Khởi tạo ngay lập tức
initSupabase();
