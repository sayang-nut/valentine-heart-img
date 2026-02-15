import os

def rename_files(folder_path):
    # Lấy danh sách file và sắp xếp theo tên để đảm bảo thứ tự
    files = sorted([f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))])
    
    for index, filename in enumerate(files, start=1):
        # Lấy phần mở rộng của file (ví dụ: .jpg, .png)
        file_extension = os.path.splitext(filename)[1]
        
        # Tạo tên mới (ví dụ: 1.jpg, 2.jpg)
        new_name = f"{index}{file_extension}"
        
        # Đường dẫn đầy đủ
        old_path = os.path.join(folder_path, filename)
        new_path = os.path.join(folder_path, new_name)
        
        # Đổi tên
        os.rename(old_path, new_path)
        print(f"Đã đổi: {filename} -> {new_name}")

# Thay đường dẫn thư mục của bạn vào đây
path = r'D:\y4\code\1\videos'
rename_files(path)