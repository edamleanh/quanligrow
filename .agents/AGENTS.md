# Database Design & Architecture Workspace Guidelines

## 1. Project Scope & Purpose
This workspace is dedicated to **Database Systems Design & Architecture** (Thiết kế Hệ thống Cơ sở Dữ liệu Quan hệ) based on academic Database Theory (DBMS Fundamentals).

## 2. Supabase Connection Credentials
- **Supabase URL**: `https://pvlyaubewwhgzhirmwgi.supabase.co`
- **Publishable Key**: `sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw`
- **Config Document**: See [database/config.md](file:///c:/Users/ACER/Desktop/grow/database/config.md).

## 3. Core Workflow Pipeline
Whenever processing requirements or database updates, ALWAYS follow the 5-step pipeline:
1. **Requirements Analysis**: Extract Entities, Attributes, Data Types, and Implicit Business Rules.
2. **Conceptual ERD Diagram**: Create visual Mermaid ERD diagrams identifying Strong/Weak Entities, Keys, and Cardinalities (`1-1`, `1-N`, `N-M`).
3. **Relational Data Model**: Convert ERD using formal notation `Table(<u>PK</u>, Attribute, FK -> Parent(PK))` and apply 7 transformation rules.
4. **Normalization Proof**: Verify 1NF, 2NF, 3NF, and BCNF compliance.
5. **Supabase DDL Schema**: Generate PostgreSQL production DDL with `CHECK` constraints, Indexes, `updated_at` Triggers, Views, and Row-Level Security (RLS) policies.

## 4. Repository Structure
- `requirements.md`: Software & System Requirements Specification.
- `docs/erd_design.md`: Conceptual ERD Diagrams & Entity Analyses.
- `docs/relational_model.md`: Logical Relational Schema & 3NF Normalization Proofs.
- `database/config.md`: Supabase Connection Credentials & API Keys.
- `database/schema.sql`: Physical Supabase DDL SQL Schema, Triggers, Views, and RLS.
- `database/migration.sql`: Data Migration Scripts.
- `.agents/skills/database-design/SKILL.md`: Core Database Design Skill.
