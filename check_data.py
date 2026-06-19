import openpyxl

def main():
    print("Reading HE.xlsx...")
    wb_data = openpyxl.load_workbook("HÈ.xlsx", data_only=True)
    sheet_data = wb_data["DS TỔNG"]
    
    # Read headers from row 3 (1-indexed)
    headers = [cell.value for cell in sheet_data[3]]
    
    try:
        idx_ho = headers.index("HỌ")
        idx_ten = headers.index("TÊN")
        idx_sodt = headers.index("SỐ ĐT")
        idx_thieu = headers.index("THIẾU")
        idx_lop = headers.index("LỚP")
        idx_hoa = headers.index("Hóa")
    except ValueError as e:
        print("Missing header:", e)
        return

    students_by_class = {}
    
    for row in sheet_data.iter_rows(min_row=5, values_only=True):
        ho = row[idx_ho]
        ten = row[idx_ten]
        
        if not ho and not ten:
            continue
            
        hoa_val = row[idx_hoa]
        if not hoa_val:
            continue
            
        lop = row[idx_lop] if row[idx_lop] is not None else ""
        class_name = f"{lop}{hoa_val}".strip()
        
        if not class_name:
            continue
            
        if class_name not in students_by_class:
            students_by_class[class_name] = []
            
        students_by_class[class_name].append({
            "ho": ho or "",
            "ten": ten or "",
            "sodt": row[idx_sodt] or "",
            "thieu": row[idx_thieu] or 0
        })
        
    print(f"Found {len(students_by_class)} chemistry classes: {list(students_by_class.keys())}")

if __name__ == "__main__":
    main()
