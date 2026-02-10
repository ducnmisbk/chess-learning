# 🎯 Simple Offline Chess Web Game (For Kids 5–10)

## 1. Mục tiêu sản phẩm

Xây dựng một **game cờ vua chạy offline trên web**, tập trung vào:
- Trải nghiệm **đơn giản – trực quan – thân thiện với trẻ em (5–10 tuổi)**
- Có thể **chơi 2 người, chơi với máy**, và **chế độ hướng dẫn có AI đồng hành**
- Cho phép **tạo tài khoản để lưu lịch sử và phần thưởng**
- Dễ mở rộng, phù hợp để phát triển tiếp với **Codex 5.2 trong IDE**

Không hướng tới game cờ vua chuyên nghiệp, mà là **công cụ học + luyện tập + tạo hứng thú**.

---

## 2. Đối tượng người dùng

### Nhóm chính
- Trẻ em 5–10 tuổi
- Mới làm quen hoặc đã biết luật cờ vua cơ bản

### Nhóm phụ
- Phụ huynh muốn con học tư duy logic
- Giáo viên / người hướng dẫn

### Nguyên tắc UX cho trẻ em
- Ít chữ, nhiều biểu tượng
- Màu sắc sáng, tương phản cao
- Không có menu phức tạp / nested menu
- Một màn hình = một nhiệm vụ

---

## 3. Core Features

### 3.1 Chế độ chơi

#### 🧑‍🤝‍🧑 Offline 2 người (Local Multiplayer)
- Chơi trên cùng một thiết bị
- Không cần mạng
- Lượt đi rõ ràng, highlight quân có thể đi

#### 🤖 Chơi với máy (AI)
- 3 cấp độ:
  - **Easy**: random + tránh nước đi sai luật
  - **Medium**: minimax độ sâu thấp, ưu tiên ăn quân
  - **Hard**: minimax + heuristic cơ bản (material, center control)

> ⚠️ AI không cần quá mạnh, ưu tiên **dễ hiểu – dễ thắng** với trẻ nhỏ.

#### 🎓 Chế độ Hướng dẫn (Guided Play)

Chơi cờ **kết hợp học** với bot đồng hành:
- Vừa chơi vừa được giải thích
- Cho phép:
  - Đi lại (undo / redo)
  - Nghe lại hướng dẫn
  - Thử nước đi khác để xem phản ứng

##### Các giai đoạn hướng dẫn

1. **Khai cuộc (Opening)**
   - Vì sao nên chiếm trung tâm
   - Phát triển quân nhẹ
   - Không đưa hậu ra sớm

2. **Trung cuộc (Middlegame)**
   - Phối hợp quân
   - Tấn công – phòng thủ
   - Bẫy đơn giản

3. **Tàn cuộc (Endgame)**
   - Vua hoạt động
   - Phong cấp tốt
   - Checkmate cơ bản (Vua + Xe, Vua + Hậu)

##### AI Bot Đồng Hành
- Hiển thị dưới dạng:
  - Nhân vật hoạt hình nhỏ (mascot)
  - Bong bóng chat
- Ngôn ngữ đơn giản, ví dụ:
  > “Con thử đưa mã ra ô này xem sao nhé 🐴”

- Có thể tích hợp AI qua **API key**:
  - Phân tích nước đi của người chơi
  - Giải thích bằng ngôn ngữ tự nhiên

---

## 4. UI / UX Design

### 4.1 Phong cách giao diện (Themes)

Người chơi có thể chọn 2–3 giao diện:

1. **Classic**
   - Bàn cờ gỗ
   - Quân cờ truyền thống

2. **Minimalist**
   - Flat design
   - Màu pastel
   - Ít chi tiết

3. **Kids / Fun (optional)**
   - Quân cờ dạng icon / cartoon
   - Animation nhẹ khi ăn quân

---

### 4.2 Nguyên tắc UI
- Button to, bo tròn
- Icon thay cho text khi có thể
- Highlight:
  - Ô có thể đi
  - Ô vừa đi
  - Ô đang bị chiếu

---

## 5. Account & Data

### 5.1 Tài khoản người dùng

- Đăng ký đơn giản:
  - Username + avatar
  - Không bắt buộc email (phù hợp trẻ em)

### 5.2 Lưu trữ dữ liệu

- Lưu local (IndexedDB / LocalStorage) + sync khi online
- Lưu:
  - Lịch sử ván đấu
  - Chế độ đã chơi
  - Badge đã đạt

---

## 6. Reward System (Gamification)

### 6.1 Badge / Achievement

Dạng **archive badge**, sưu tập được:

- ♟️ First Win
- 🧠 Learn Opening
- 🔁 Use Undo Properly
- 👑 First Checkmate
- 🔥 5 Days Practice Streak

### 6.2 Mục tiêu
- Không tạo áp lực
- Tạo động lực luyện tập đều đặn

---

## 7. Technical Overview (Web)

### 7.1 Tech Stack đề xuất

- **Frontend**: HTML5 + CSS + TypeScript
- **Chess Logic**:
  - Custom logic đơn giản hoặc dùng chess.js (đã simplify)
- **AI**:
  - Local minimax
  - Optional: AI API cho chế độ hướng dẫn

### 7.2 Offline-first
- Service Worker
- Cache assets + logic
- Game vẫn chạy khi không có mạng

---

## 8. Codex 5.2 – Cách tận dụng

### Prompting Strategy trong IDE

- Tách nhỏ task:
  - Board rendering
  - Move validation
  - AI engine
  - Tutorial logic

- Dùng Codex để:
  - Sinh logic minimax
  - Refactor code đơn giản cho dễ đọc
  - Viết comment giải thích (rất hợp cho project giáo dục)

---

## 9. Future Extensions

- Online play (sau)
- Parent dashboard
- Daily puzzle cho trẻ em
- Voice bot giải thích nước đi

---

## 10. Giá trị cốt lõi

> **Dạy trẻ tư duy thông qua trải nghiệm vui vẻ, không áp lực, không phức tạp.**

Game không chỉ là cờ vua,
> mà là một người bạn đồng hành giúp trẻ học cách suy nghĩ. ♟️✨

