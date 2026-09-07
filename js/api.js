/* =============================================================================
   EDUMANAGER V2 - SUPABASE DATA SERVICE LAYER (js/api.js)
   ============================================================================= */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const api = {
  // --- ACADEMIC YEARS ---
  async getAcademicYears() {
    const { data, error } = await supabase.from('academic_years').select('*').order('year_name', { ascending: true });
    if (error) throw error;
    return data;
  },

  // --- SUBJECTS ---
  async getSubjects() {
    const { data, error } = await supabase.from('subjects').select('*').order('subject_id', { ascending: true });
    if (error) throw error;
    return data;
  },

  // --- TEACHERS ---
  async getTeachers() {
    const { data, error } = await supabase
      .from('teachers')
      .select('*, subjects(subject_name, subject_code)')
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getTeacherById(teacherId) {
    const { data, error } = await supabase
      .from('teachers')
      .select('*, subjects(subject_name, subject_code)')
      .eq('teacher_id', teacherId)
      .single();
    if (error) throw error;
    return data;
  },

  async createTeacher(teacherObj) {
    const { data, error } = await supabase.from('teachers').insert([teacherObj]).select().single();
    if (error) throw error;
    return data;
  },

  async updateTeacher(teacherId, teacherObj) {
    const { data, error } = await supabase.from('teachers').update(teacherObj).eq('teacher_id', teacherId).select().single();
    if (error) throw error;
    return data;
  },

  // --- STUDENTS ---
  async getStudents(options = {}) {
    let query = supabase.from('students').select('*', { count: 'exact' });
    if (options.grade) query = query.eq('grade', options.grade);
    if (options.status) query = query.eq('status', options.status);
    if (options.search) {
      query = query.or(`full_name.ilike.%${options.search}%,student_code.ilike.%${options.search}%,phone.ilike.%${options.search}%`);
    }
    query = query.order('created_at', { ascending: false });
    const { data, count, error } = await query;
    if (error) throw error;
    return { data, count };
  },

  async getStudentById(studentId) {
    const { data, error } = await supabase.from('students').select('*').eq('student_id', studentId).single();
    if (error) throw error;
    return data;
  },

  async createStudent(studentObj) {
    const { data, error } = await supabase.from('students').insert([studentObj]).select().single();
    if (error) throw error;
    return data;
  },

  async updateStudent(studentId, studentObj) {
    const { data, error } = await supabase.from('students').update(studentObj).eq('student_id', studentId).select().single();
    if (error) throw error;
    return data;
  },

  // --- CLASSES ---
  async getClasses(options = {}) {
    let query = supabase.from('classes').select('*, subjects(subject_name, subject_code), teachers(full_name, teacher_code)');
    if (options.academic_year) query = query.eq('academic_year', options.academic_year);
    if (options.grade) query = query.eq('grade', options.grade);
    if (options.subject_id) query = query.eq('subject_id', options.subject_id);
    if (options.search) {
      query = query.ilike('class_name', `%${options.search}%`);
    }
    query = query.order('class_name', { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getClassById(classId) {
    const { data, error } = await supabase
      .from('classes')
      .select('*, subjects(subject_name, subject_code), teachers(full_name, teacher_code, phone)')
      .eq('class_id', classId)
      .single();
    if (error) throw error;
    return data;
  },

  async createClass(classObj) {
    const { data, error } = await supabase.from('classes').insert([classObj]).select().single();
    if (error) throw error;
    return data;
  },

  async updateClass(classId, classObj) {
    const { data, error } = await supabase.from('classes').update(classObj).eq('class_id', classId).select().single();
    if (error) throw error;
    return data;
  },

  // --- BATCHES ---
  async getBatchesByClass(classId) {
    const { data, error } = await supabase
      .from('batches')
      .select('*, teachers(full_name, teacher_code)')
      .eq('class_id', classId)
      .order('batch_number', { ascending: true });
    if (error) throw error;
    return data;
  },

  async updateBatch(batchId, batchObj) {
    const { data, error } = await supabase.from('batches').update(batchObj).eq('batch_id', batchId).select().single();
    if (error) throw error;
    return data;
  },

  // --- ENROLLMENTS ---
  async getEnrollmentsByStudent(studentId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, classes(*, subjects(subject_name, subject_code), teachers(full_name))')
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getEnrollmentsByClass(classId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, students(student_id, student_code, full_name, phone, grade, status)')
      .eq('class_id', classId);
    if (error) throw error;
    return data;
  },

  async createEnrollment(enrollmentObj) {
    const { data, error } = await supabase.from('enrollments').insert([enrollmentObj]).select().single();
    if (error) throw error;
    return data;
  },

  async updateEnrollment(enrollmentId, updateObj) {
    const { data, error } = await supabase.from('enrollments').update(updateObj).eq('enrollment_id', enrollmentId).select().single();
    if (error) throw error;
    return data;
  },

  // --- RECEIPTS & PAYMENT ---
  async getReceiptsByStudent(studentId) {
    const { data, error } = await supabase
      .from('receipts')
      .select('*, receipt_items(*, classes(class_name), batches(batch_number, batch_name))')
      .eq('student_id', studentId)
      .order('receipt_date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createReceiptWithItems(receiptHeader, itemsArray) {
    const { data: receipt, error: rErr } = await supabase.from('receipts').insert([receiptHeader]).select().single();
    if (rErr) throw rErr;

    const itemsWithReceiptId = itemsArray.map(item => ({
      ...item,
      receipt_id: receipt.receipt_id
    }));

    const { data: items, error: iErr } = await supabase.from('receipt_items').insert(itemsWithReceiptId).select();
    if (iErr) throw iErr;

    return { receipt, items };
  },

  // --- DEBT SUMMARY VIEW ---
  async getDebtSummary() {
    const { data, error } = await supabase.from('v_debt_summary').select('*');
    if (error) throw error;
    return data;
  },

  // --- TEACHER PAYROLL VIEW ---
  async getTeacherPayroll(teacherId) {
    let query = supabase.from('v_teacher_batch_payroll').select('*');
    if (teacherId) query = query.eq('teacher_id', teacherId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};
