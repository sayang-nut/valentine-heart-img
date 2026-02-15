import os
from PIL import Image

def process_images(folder_path, start_number=21):
    # Tạo thư mục output để tránh ghi đè làm mất ảnh gốc nếu lỗi
    output_folder = os.path.join(folder_path, "Processed")
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Lấy danh sách file ảnh
    valid_extensions = ('.jpg', '.jpeg', '.png')
    files = sorted([f for f in os.listdir(folder_path) if f.lower().endswith(valid_extensions)])
    
    target_width = 1080
    target_height = 1350
    target_ratio = target_width / target_height

    for index, filename in enumerate(files):
        try:
            old_path = os.path.join(folder_path, filename)
            with Image.open(old_path) as img:
                # --- LOGIC CROP 4:5 TỪ TÂM ---
                width, height = img.size
                current_ratio = width / height

                if current_ratio > target_ratio:
                    # Ảnh quá rộng -> cắt bớt chiều rộng
                    new_width = height * target_ratio
                    left = (width - new_width) / 2
                    top = 0
                    right = (width + new_width) / 2
                    bottom = height
                else:
                    # Ảnh quá cao -> cắt bớt chiều cao
                    new_height = width / target_ratio
                    left = 0
                    top = (height - new_height) / 2
                    right = width
                    bottom = (height + new_height) / 2

                # Thực hiện Crop và Resize
                img_cropped = img.crop((left, top, right, bottom))
                img_final = img_cropped.resize((target_width, target_height), Image.LANCZOS)

                # --- ĐỔI TÊN THEO SỐ THỨ TỰ (Bắt đầu từ 21) ---
                new_name = f"{start_number + index}.jpg"
                new_path = os.path.join(output_folder, new_name)

                # Lưu ảnh (ép về định dạng RGB để lưu dưới dạng .jpg)
                img_final.convert('RGB').save(new_path, "JPEG", quality=95)
                print(f"Thành công: {filename} -> {new_name}")

        except Exception as e:
            print(f"Lỗi khi xử lý {filename}: {e}")

# Đường dẫn của bạn
path = r'D:\y4\code\img\New folder' # Sửa lại đường dẫn (bỏ chữ D thừa ở đầu)
process_images(path, start_number=21)