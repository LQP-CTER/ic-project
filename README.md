# IC Platform

IC Platform hỗ trợ đội truyền thông nội bộ quản lý dự án, hoạt động, workflow mẫu và nội dung được AI tạo. Ứng dụng có thể chạy bằng dữ liệu demo; khi cấu hình Google Apps Script, Projects, Activities và Contents được lưu trong Google Sheets.

## Chạy local

Yêu cầu Node.js 20+.

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

Điền hai biến trong `.env`. Sau mỗi lần thay đổi `.env`, khởi động lại Vite.

```env
VITE_GOOGLE_SHEETS_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_CEREBRAS_API_KEY=your_cerebras_api_key_here
```

Nếu `VITE_GOOGLE_SHEETS_API_URL` để trống, ứng dụng cố ý chạy bằng mock data và không ghi gì vào Google Sheets.

## Thiết lập Google Sheets

1. Tạo một Google Sheet dành riêng cho IC Platform.
2. Chọn **Extensions → Apps Script**.
3. Dán toàn bộ nội dung từ [google-apps-script.js](google-apps-script.js), lưu project.
4. Trong danh sách hàm, chạy `setupSheets` một lần và cấp quyền Google khi được hỏi. Hàm này tạo bốn sheet (`Projects`, `Activities`, `Contents`, `Users`) và thêm cột còn thiếu mà không xóa dữ liệu cũ.
5. Mở sheet `Users`, thêm ít nhất một hàng theo mẫu:

   | email | name | role |
   | --- | --- | --- |
   | your-email@company.com | Tên của bạn | admin |

6. Chọn **Deploy → New deployment → Web app**. Chọn **Execute as: Me** và, cho MVP nội bộ, **Who has access: Anyone**.
7. Sao chép URL Web app kết thúc bằng `/exec` vào `VITE_GOOGLE_SHEETS_API_URL`.

Để kiểm tra API trước khi chạy app, mở URL sau trên trình duyệt. Kết quả đúng là JSON có `projects`, `activities`, `contents`.

```text
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getAll
```

Mỗi khi chỉnh `google-apps-script.js`, tạo version mới và chọn **Manage deployments → Edit → New version → Deploy**. URL `/exec` vẫn giữ nguyên.

## Deploy Vercel

1. Đẩy source lên GitHub và import repository vào Vercel.
2. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
3. Trong **Settings → Environment Variables**, thêm `VITE_GOOGLE_SHEETS_API_URL` và `VITE_CEREBRAS_API_KEY` cho Production (và Preview nếu cần).
4. Redeploy. Đăng nhập bằng email đã thêm vào sheet `Users`, tạo thử một project, một activity và kiểm tra các hàng tương ứng xuất hiện trong Sheet.

## Kiểm tra nhanh khi có lỗi

- App vẫn hiện dữ liệu EES/GTalk Mail: URL Sheets trống, sai, hoặc chưa restart app sau khi đổi `.env`.
- Không đăng nhập được: kiểm tra URL `/exec`, sheet `Users`, và email phải khớp không phân biệt hoa/thường.
- App báo không thể lưu: mở URL `?action=getAll`; nếu lỗi, redeploy Apps Script và kiểm tra quyền truy cập Web app.
- Tạo mới nhưng sau đó không sửa/xóa được: chạy lại `setupSheets()` để bổ sung cột mới, sau đó redeploy Apps Script mới nhất.

## Lưu ý bảo mật

Đây là cách triển khai nhanh cho MVP nội bộ. Google Apps Script Web app để `Anyone` và mọi biến `VITE_*` đều được gửi xuống trình duyệt. Do đó không nên lưu dữ liệu nhạy cảm hay dùng API key Cerebras production không giới hạn. Nếu cần đưa vào production rộng rãi, bước tiếp theo là thêm backend/proxy có xác thực thật (Google Workspace SSO hoặc Firebase/Auth0) và giữ secret AI ở server.