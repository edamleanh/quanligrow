import openpyxl
import sys
import json
import zipfile
import glob
import re
import os
from copy import copy

def get_vn_sort_key(text):
    text = str(text).strip().lower()
    text = text.replace('ð', 'đ') # Handle Unicode Eth which looks like Đ
    alphabet = "a á à ả ã ạ ă ắ ằ ẳ ẵ ặ â ấ ầ ẩ ẫ ậ b c d đ e é è ẻ ẽ ẹ ê ế ề ể ễ ệ f g h i í ì ỉ ĩ ị j k l m n o ó ò ỏ õ ọ ô ố ồ ổ ỗ ộ ơ ớ ờ ở ỡ ợ p q r s t u ú ù ủ ũ ụ ư ứ ừ ử ữ ự v w x y ý ỳ ỷ ỹ ỵ z"
    order = {c: f"{i+1:03d}" for i, c in enumerate(alphabet.split())}
    result = []
    for char in text:
        if char in order:
            result.append(order[char])
        elif char.isspace():
            result.append("000")
        else:
            result.append(f"999{ord(char):05d}")
    return "-".join(result)

def main():
    print("Reading firebase_data.json to extract student data...")
    try:
        with open("firebase_data.json", "r", encoding="utf-8") as f:
            students_data = json.load(f)
    except FileNotFoundError:
        print("ERROR: firebase_data.json not found. Make sure to export from web app.")
        sys.exit(1)
    except json.JSONDecodeError:
        print("ERROR: Invalid JSON in firebase_data.json.")
        sys.exit(1)
    
    target_subjects = ["TOÁN", "VĂN", "Hóa", "AV", "Lý"]
    
    template_path = "file chuẩn.xlsx"

    for subject in target_subjects:
        students_by_class = {}
        
        for row in students_data:
            ho = row.get("HỌ", "")
            ten = row.get("TÊN", "")
            
            if not ho and not ten:
                continue
                
            sub_val = row.get(subject, "")
            if not sub_val:
                continue
                
            lop = row.get("LỚP", "")
            class_name = f"{lop}{sub_val}".strip()
            
            if not class_name or len(class_name) > 4:
                continue
            
            if class_name not in students_by_class:
                students_by_class[class_name] = []
                
            students_by_class[class_name].append({
                "ho": ho or "",
                "ten": ten or "",
                "sodt": row.get("SỐ ĐT", ""),
                "thieu": row.get("THIẾU", 0)
            })

        ascii_subject = subject.replace("Á", "A").replace("Ă", "A").replace("ó", "o")
        print(f"\n--- Generating file for subject: {ascii_subject} ---")
        wb_out = openpyxl.load_workbook(template_path)
        sheet = wb_out.active
        
        def class_sort_key(c):
            m = re.match(r"^(1[0-2]|[1-9])(.*)$", str(c).strip())
            if m:
                grade = int(m.group(1))
                suffix = m.group(2).strip().upper()
            else:
                return (float('inf'), 3, str(c))
            
            if not suffix:
                priority = 0
            elif suffix[0].isdigit():
                priority = 0
            elif suffix.startswith("O"):
                priority = 1
            else:
                priority = 2
                
            return (grade, priority, suffix)

        # Đọc trạng thái lớp (nếu có) để lọc lớp không hoạt động
        class_status = {}
        try:
            with open("class_status.json", "r", encoding="utf-8") as f:
                class_status = json.load(f)
        except Exception:
            pass

        # Lọc danh sách lớp: chỉ lấy những lớp active
        active_classes = []
        for c in students_by_class.keys():
            full_class_name = f"{c} {subject}".strip()
            # Mặc định là active (true) nếu không có trong file
            if class_status.get(full_class_name, True) is not False:
                active_classes.append(c)

        # Sort classes according to custom logic: Grade -> Number suffix -> O -> A/B/C/D
        classes = sorted(active_classes, key=class_sort_key)
        
        # Chunk classes into blocks of max 26 students
        blocks = []
        for class_name in classes:
            students = students_by_class[class_name]
            # Sắp xếp học sinh theo Tên, sau đó theo Họ chuẩn tiếng Việt
            students.sort(key=lambda x: (get_vn_sort_key(x.get("ten", "")), get_vn_sort_key(x.get("ho", ""))))
            
            for chunk_idx in range(0, len(students), 25):
                chunk = students[chunk_idx:chunk_idx+25]
                blocks.append({
                    "class_name": class_name,
                    "students": chunk,
                    "start_idx": chunk_idx
                })
        
        for i, block in enumerate(blocks):
            class_name = block["class_name"]
            students = block["students"]
            stt_offset = block["start_idx"]
            
            print(f"Block {i+1}: Class {class_name} with {len(students)} students")
            
            base_row = i * 30 + 1
            
            # No format copying needed because the template is pre-drawn by the user
            
            # Change the main title if it says "DANH SÁCH HÓA" (or similar) to the current subject
            title_cell = sheet.cell(row=base_row, column=1)
            if title_cell.value and isinstance(title_cell.value, str):
                if "HÓA" in title_cell.value.upper() or "TOÁN" in title_cell.value.upper() or "VĂN" in title_cell.value.upper():
                    if type(title_cell).__name__ != 'MergedCell':
                        title_cell.value = f"DANH SÁCH {subject.upper()}"
            
            # Update class name in the header (Column I is column 9)
            if type(sheet.cell(row=base_row, column=9)).__name__ != 'MergedCell':
                sheet.cell(row=base_row, column=9).value = class_name
            
            # Start writing data at base_row + 4
            start_row = base_row + 4
            for idx, student in enumerate(students):
                current_row = start_row + idx
                
                sheet.cell(row=current_row, column=1).value = stt_offset + idx + 1
                sheet.cell(row=current_row, column=2).value = student["ho"]
                sheet.cell(row=current_row, column=3).value = student["ten"]
                sheet.cell(row=current_row, column=4).value = student["sodt"]
                
            # Clear remaining rows up to 25 so ghost names from template/copied blocks don't appear
            for idx in range(len(students), 25):
                current_row = start_row + idx
                sheet.cell(row=current_row, column=1).value = ""
                sheet.cell(row=current_row, column=2).value = ""
                sheet.cell(row=current_row, column=3).value = ""
                sheet.cell(row=current_row, column=4).value = ""
        # Clear out the class names for unused blocks if there are any remaining in the pre-drawn template
        for i in range(len(blocks), 150): # Clear up to 150 blocks just to be safe
            base_row = i * 30 + 1
            if type(sheet.cell(row=base_row, column=9)).__name__ != 'MergedCell':
                sheet.cell(row=base_row, column=9).value = ""
            # Also clear the title for unused blocks so they appear truly empty
            title_cell = sheet.cell(row=base_row, column=1)
            if type(title_cell).__name__ != 'MergedCell':
                title_cell.value = ""
                
        out_name = f"DanhSach_{subject.upper()}_TatCaLop.xlsx"
        try:
            wb_out.save(out_name)
            safe_out_name = f"DanhSach_{ascii_subject.upper()}_TatCaLop.xlsx"
            print(f"Saved {ascii_subject} to {safe_out_name}")
        except PermissionError:
            print(f"ERROR: Cannot save '{out_name}'. Please close it in Excel first.")
            sys.exit(1)
        except Exception as e:
            print(f"ERROR: Failed to save '{out_name}'. {str(e)}")
            sys.exit(1)

    print("Zipping all generated files...")
    zip_filename = "DanhSachTruatXuat.zip"
    try:
        with zipfile.ZipFile(zip_filename, 'w') as zipf:
            for subject in target_subjects:
                file_to_zip = f"DanhSach_{subject.upper()}_TatCaLop.xlsx"
                if os.path.exists(file_to_zip):
                    zipf.write(file_to_zip)
        print(f"Successfully created {zip_filename}")
        
        # Clean up temporary subject xlsx files
        import os
        for subject in target_subjects:
            file_to_remove = f"DanhSach_{subject.upper()}_TatCaLop.xlsx"
            if os.path.exists(file_to_remove):
                try:
                    os.remove(file_to_remove)
                except Exception:
                    pass
    except Exception as e:
        print(f"ERROR: Failed to create zip file. {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()


