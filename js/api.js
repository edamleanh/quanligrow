// EduManager V2 - Supabase API Data Access Layer (Using dbClient & Exact 3NF Schema)

const ApiService = {
  // 1. DASHBOARD ANALYTICS
  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Revenue Today
    const { data: todayReceipts } = await dbClient
      .from('receipts')
      .select('total_amount')
      .gte('created_at', `${today}T00:00:00`);

    const revenueToday = (todayReceipts || []).reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

    // Total Students
    const { count: studentCount } = await dbClient
      .from('students')
      .select('*', { count: 'exact', head: true });

    // Total Active Classes
    const { count: classCount } = await dbClient
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Class details view for top unpaid finished classes
    const { data: classDetails } = await dbClient
      .from('v_class_details')
      .select('*');

    return {
      revenueToday,
      totalStudents: studentCount || 0,
      totalClasses: classCount || 0,
      unpaidFinishedClassesCount: 0,
      unpaidClasses: classDetails || []
    };
  },

  // 2. STUDENTS API
  async getStudents(query = '') {
    let q = dbClient
      .from('students')
      .select(`
        student_id,
        student_code,
        full_name,
        phone,
        grade,
        status,
        enrollments (
          enrollment_id,
          status,
          classes ( class_id, class_name )
        )
      `)
      .order('created_at', { ascending: false });

    if (query) {
      q = q.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,student_code.ilike.%${query}%`);
    }

    const { data, error } = await q;
    if (error) {
      console.error('getStudents error:', error);
      // Fallback simple query if joins fail
      const { data: simpleData } = await dbClient.from('students').select('*').limit(50);
      return simpleData || [];
    }
    return data || [];
  },

  async getStudentDetails(studentId) {
    // 1. Student Info
    const { data: student, error: sErr } = await dbClient
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .single();
    if (sErr) throw sErr;

    // 2. Enrollments
    const { data: enrollments } = await dbClient
      .from('enrollments')
      .select(`
        enrollment_id,
        enrolled_at,
        status,
        classes ( class_id, class_name, default_fee_rate )
      `)
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });

    // 3. Class Transfers
    const { data: transfers } = await dbClient
      .from('class_transfers')
      .select(`
        transfer_id,
        transfer_date,
        effective_batch_number,
        reason,
        from_class:classes!from_class_id ( class_name ),
        to_class:classes!to_class_id ( class_name )
      `)
      .eq('student_id', studentId)
      .order('transfer_date', { ascending: false });

    // 4. Receipts
    const { data: receipts } = await dbClient
      .from('receipts')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    return {
      student,
      enrollments: enrollments || [],
      transfers: transfers || [],
      receipts: receipts || []
    };
  },

  async createStudent(name, phone, parentName, schoolName, classId = null) {
    const randomCode = 'HS' + Math.floor(10000 + Math.random() * 90000);
    const { data: student, error } = await dbClient
      .from('students')
      .insert([{
        student_code: randomCode,
        full_name: name,
        phone: phone,
        grade: 6,
        status: 'DANG_HOC',
        notes: `Phụ huynh: ${parentName || 'N/A'}, Trường: ${schoolName || 'N/A'}`
      }])
      .select()
      .single();

    if (error) throw error;

    if (classId) {
      await dbClient
        .from('enrollments')
        .insert([{
          student_id: student.student_id,
          class_id: classId,
          status: 'ACTIVE'
        }]);
    }

    return student;
  },

  async updateStudent(studentId, updateData) {
    const { data, error } = await dbClient
      .from('students')
      .update(updateData)
      .eq('student_id', studentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async transferStudentClass(studentId, fromClassId, toClassId, reason = '') {
    // Mark old enrollment as TRANSFERRED
    await dbClient
      .from('enrollments')
      .update({ status: 'TRANSFERRED' })
      .eq('student_id', studentId)
      .eq('class_id', fromClassId)
      .eq('status', 'ACTIVE');

    // Add new ACTIVE enrollment
    await dbClient
      .from('enrollments')
      .insert([{
        student_id: studentId,
        class_id: toClassId,
        status: 'ACTIVE'
      }]);

    // Log into class_transfers
    await dbClient
      .from('class_transfers')
      .insert([{
        student_id: studentId,
        from_class_id: fromClassId,
        to_class_id: toClassId,
        effective_batch_number: 1,
        reason: reason || 'Chuyển lớp học phần'
      }]);

    return true;
  },

  // 3. CLASSES API
  async getClasses(query = '') {
    let q = dbClient.from('v_class_details').select('*');
    if (query) {
      q = q.or(`class_name.ilike.%${query}%,subject_name.ilike.%${query}%,teacher_name.ilike.%${query}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  async createClassWith12Batches(name, subjectName, gradeLevel, teacherId, feePerBatch) {
    // Map Subject Name to subject_id
    const { data: subjects } = await dbClient.from('subjects').select('subject_id, subject_name');
    let subjectId = 1;
    if (subjects && subjects.length > 0) {
      const found = subjects.find(s => s.subject_name.toLowerCase().includes(subjectName.toLowerCase()));
      if (found) subjectId = found.subject_id;
    }

    const gradeNum = parseInt(gradeLevel.replace(/\D/g, '')) || 6;

    // Create Class (PostgreSQL Trigger trg_classes_after_insert_create_batches will AUTO insert 12 batches!)
    const { data: newClass, error: cErr } = await dbClient
      .from('classes')
      .insert([{
        class_name: name,
        grade: gradeNum,
        subject_id: subjectId,
        teacher_id: teacherId,
        default_fee_rate: feePerBatch,
        is_active: true
      }])
      .select()
      .single();

    if (cErr) throw cErr;
    return newClass;
  },

  async getClassDetails(classId) {
    const { data: classObj, error: cErr } = await dbClient
      .from('v_class_details')
      .select('*')
      .eq('class_id', classId)
      .single();
    if (cErr) throw cErr;

    // Batches
    const { data: batches } = await dbClient
      .from('batches')
      .select(`
        batch_id,
        batch_number,
        batch_name,
        fee_rate,
        status,
        teachers ( full_name )
      `)
      .eq('class_id', classId)
      .order('batch_number', { ascending: true });

    // Enrolled Roster
    const { data: roster } = await dbClient
      .from('enrollments')
      .select(`
        enrollment_id,
        status,
        enrolled_at,
        students ( student_id, student_code, full_name, phone )
      `)
      .eq('class_id', classId)
      .order('enrolled_at', { ascending: false });

    return {
      classObj,
      batches: batches || [],
      roster: roster || []
    };
  },

  async enrollStudentToClass(classId, studentId) {
    const { data, error } = await dbClient
      .from('enrollments')
      .insert([{
        class_id: classId,
        student_id: studentId,
        status: 'ACTIVE'
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async withdrawStudentFromClass(enrollmentId) {
    const { data, error } = await dbClient
      .from('enrollments')
      .update({ status: 'WITHDRAWN' })
      .eq('enrollment_id', enrollmentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 4. TEACHERS API
  async getTeachers(query = '') {
    let q = dbClient.from('teachers').select('*');
    if (query) {
      q = q.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`);
    }

    const { data, error } = await q;
    if (error) throw error;

    // Count assigned classes for each teacher
    const teachersWithCount = await Promise.all((data || []).map(async (t) => {
      const { count } = await dbClient
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', t.teacher_id)
        .eq('is_active', true);
      return {
        ...t,
        assignedClassCount: count || 0
      };
    }));

    return teachersWithCount;
  },

  async getTeacherDetails(teacherId) {
    const { data: teacher, error: tErr } = await dbClient
      .from('teachers')
      .select('*')
      .eq('teacher_id', teacherId)
      .single();
    if (tErr) throw tErr;

    // Assigned Classes
    const { data: classes } = await dbClient
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId);

    // Teacher Batch Payroll View
    const { data: payroll } = await dbClient
      .from('v_teacher_batch_payroll')
      .select('*')
      .eq('teacher_id', teacherId);

    return {
      teacher,
      classes: classes || [],
      payroll: payroll || []
    };
  },

  async createTeacher(fullName, phone, email, specialty) {
    const randomCode = 'GV' + Math.floor(100 + Math.random() * 900);
    const { data, error } = await dbClient
      .from('teachers')
      .insert([{
        teacher_code: randomCode,
        full_name: fullName,
        phone: phone,
        specialization_subject_id: 1
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTeacher(teacherId, updateData) {
    const { data, error } = await dbClient
      .from('teachers')
      .update(updateData)
      .eq('teacher_id', teacherId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 5. POS & OLD CLASS DEBT RECOVERY API (Querying View v_debt_summary)
  async getStudentDebtsAndBatches(studentId) {
    // Query View v_debt_summary directly!
    const { data: debtRows, error } = await dbClient
      .from('v_debt_summary')
      .select('*')
      .eq('student_id', studentId)
      .order('batch_number', { ascending: true });

    if (error) {
      console.error('getStudentDebtsAndBatches error:', error);
      return { activeClass: null, currentBatches: [], oldClassDebts: [] };
    }

    const rows = debtRows || [];

    // Separate ACTIVE class debts vs TRANSFERRED old class debts
    const currentClassRows = rows.filter(r => r.enrollment_status === 'ACTIVE');
    const transferredClassRows = rows.filter(r => r.enrollment_status === 'TRANSFERRED');

    let activeClassInfo = null;
    if (currentClassRows.length > 0) {
      activeClassInfo = {
        class_id: currentClassRows[0].class_id,
        name: currentClassRows[0].class_name
      };
    }

    const currentBatches = currentClassRows.map(r => ({
      id: r.batch_id,
      class_id: r.class_id,
      batch_number: r.batch_number,
      name: r.batch_name,
      fee_amount: r.required_fee,
      is_paid: r.payment_status === 'PAID',
      class_name: r.class_name,
      is_old_class: false
    }));

    // Filter only UNPAID debts for transferred old classes
    const oldClassDebts = transferredClassRows
      .filter(r => r.payment_status !== 'PAID')
      .map(r => ({
        id: r.batch_id,
        class_id: r.class_id,
        batch_number: r.batch_number,
        name: `${r.class_name} - ${r.batch_name}`,
        fee_amount: r.required_fee,
        is_paid: false,
        class_name: r.class_name,
        is_old_class: true
      }));

    return {
      activeClass: activeClassInfo,
      currentBatches,
      oldClassDebts
    };
  },

  async createReceipt(studentId, batchItemsList, receiptType, manualCode, note, totalAmount) {
    let code = manualCode;
    if (receiptType === 'IN_MAY') {
      const randStr = Math.floor(1000 + Math.random() * 9000);
      code = `BL-${new Date().getFullYear()}-${randStr}`;
    }

    // Insert Receipt Header
    const { data: receipt, error: rErr } = await dbClient
      .from('receipts')
      .insert([{
        receipt_code: code,
        receipt_type: receiptType,
        manual_receipt_code: manualCode || null,
        student_id: studentId,
        total_amount: totalAmount
      }])
      .select()
      .single();

    if (rErr) throw rErr;

    // Insert Receipt Items
    for (const item of batchItemsList) {
      await dbClient
        .from('receipt_items')
        .insert([{
          receipt_id: receipt.receipt_id,
          class_id: item.class_id,
          batch_id: item.id,
          amount_paid: item.fee_amount
        }]);
    }

    return receipt;
  }
};
