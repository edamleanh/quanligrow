---
name: web-development
description: Guidelines, task breakdown workflow, design system, API integration, and documentation integrity rules for EduManager V2 Web Application.
---

# EduManager V2 Web Application Development Skill

This skill defines the workflow, architectural guidelines, design system tokens, and documentation maintenance rules for developing the **Trung Tâm Ngoại Ngữ Grow (EduManager V2)** web application.

---

## 🎨 1. Design System & Theme Specifications

- **Brand Name**: Trung Tâm Ngoại Ngữ Grow
- **Theme Mode**: Light Mode (Sáng thanh lịch, tối giản)
- **Primary Color Palette (Emerald)**:
  - `--primary`: `#059669` (Emerald 600)
  - `--primary-hover`: `#047857` (Emerald 700)
  - `--primary-light`: `#ecfdf5` (Emerald 50)
  - `--primary-border`: `#a7f3d0` (Emerald 200)
- **Neutral Colors**:
  - `--bg-app`: `#f8fafc` (Slate 50)
  - `--bg-surface`: `#ffffff` (White)
  - `--text-primary`: `#0f172a` (Slate 900)
  - `--text-secondary`: `#475569` (Slate 600)
  - `--border-color`: `#e2e8f0` (Slate 200)
- **Status Badges**:
  - `DANG_HOC` / `PAID`: `#059669` (Emerald Green)
  - `UPCOMING` / `PARTIAL`: `#d97706` (Amber/Yellow)
  - `COMPLETED` / `UNPAID`: `#dc2626` (Red)

---

## 🔐 2. Role-Based Access Control (RBAC) & Landing Views

1. **👑 ADMIN (Chủ trung tâm)**:
   - *Default View*: Dashboard Analytics (Doanh thu hôm nay, Biểu đồ sĩ số, Danh sách lớp có nhiều học sinh nợ đợt đã xong).
   - *Permissions*: Full access (Quản lý Lớp, Đợt, Học sinh, Học phí, Báo cáo).
2. **💵 THU NGÂN (Cashier)**:
   - *Default View*: POS Màn hình Thu tiền & Tra cứu Học sinh.
   - *Permissions*: Lập biên lai (`IN_MAY`, `NHAP_TAY`), đóng gộp nhiều đợt/lớp, tra cứu công nợ, in phiếu thu.
3. **👨‍🏫 GIÁO VIÊN (Teacher)**:
   - *Default View*: Danh sách Lớp phụ trách.
   - *Permissions*: View-only sĩ số, danh sách học sinh và đợt học của lớp mình dạy.

- **Quick Role Switcher**: Interactive 1-click role switcher bar on top header for instant testing between Admin, Cashier, and Teacher views.

---

## 🛠️ 3. Task Breakdown Workflow & Documentation Integrity Rules

### Rule 1: Task-by-Task Implementation
Execution MUST proceed modularly in isolated, testable tasks:
- **Task 1**: Core HTML structure, Design System CSS (`index.css`), Icons & Layout Base.
- **Task 2**: Supabase API Service Layer (`js/supabase-client.js` & `js/api.js`).
- **Task 3**: Auth & 1-Click Role Switcher Component.
- **Task 4**: Cashier POS & Smart Receipt Generation + Print Modal (`js/pos.js`).
- **Task 5**: Admin Analytics & Reports Dashboard (`js/dashboard.js`).
- **Task 6**: Student & Class Management Views (`js/students.js`, `js/classes.js`).
- **Task 7**: Teacher Class Roster View (`js/teacher.js`).

### Rule 2: Documentation Maintenance
Whenever code or features are modified or updated:
1. Update [requirements.md](file:///c:/Users/ACER/Desktop/grow/requirements.md) if business rules or UI flows change.
2. Update [docs/erd_design.md](file:///c:/Users/ACER/Desktop/grow/docs/erd_design.md) & [docs/relational_model.md](file:///c:/Users/ACER/Desktop/grow/docs/relational_model.md) if database schemas evolve.
3. Update [walkthrough.md](file:///C:/Users/ACER/.gemini/antigravity-ide/brain/8d88f7d8-0098-4db0-950f-1f2dff6a37f1/walkthrough.md) after completing tasks to document verified behavior.
