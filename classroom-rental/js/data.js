// ===================================
// 강의실 대여 시스템 - 데이터베이스 (Mock)
// 실제 환경에서는 PostgreSQL/Supabase 등 연동
// 스키마: 강의실_대여_시스템_DB.xlsx 기반
// ===================================

// ─── 로컬 날짜 헬퍼 (YYYY-MM-DD 및 YYYY-MM-DDTHH:mm:ss) ──────────────────────────
function getLocalDateString(d) {
  const date = (d instanceof Date) ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLocalISOString(d) {
  const date = (d instanceof Date) ? d : new Date(d);
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// ─── 테이블: Users (사용자) ───────────────────────────────
// id | student_id | password_hash | name | role | created_at
const DEFAULT_USERS = [
  { id: 'u001', student_id: '20210001', password_hash: btoa('1234'), name: '김민준', role: 'student', created_at: '2024-03-01T09:00:00' },
  { id: 'u002', student_id: '20210002', password_hash: btoa('1234'), name: '이서연', role: 'student', created_at: '2024-03-01T09:10:00' },
  { id: 'u003', student_id: '20200050', password_hash: btoa('admin1234'), name: '박조교', role: 'admin', created_at: '2023-09-01T08:00:00' },
  { id: 'u004', student_id: '20220015', password_hash: btoa('1234'), name: '최예나', role: 'student', created_at: '2024-03-05T10:00:00' },
  { id: 'u005', student_id: '20230033', password_hash: btoa('1234'), name: '정하윤', role: 'student', created_at: '2024-09-01T09:00:00' },
];

function loadStoredUsers() {
  try {
    const raw = localStorage.getItem('custom_users');
    if (!raw) return DEFAULT_USERS;
    const custom = JSON.parse(raw);
    const map = new Map();
    DEFAULT_USERS.forEach(u => map.set(u.student_id, u));
    custom.forEach(u => map.set(u.student_id, u));
    return Array.from(map.values());
  } catch (e) {
    return DEFAULT_USERS;
  }
}

function saveUsersToStorage(users) {
  try {
    localStorage.setItem('custom_users', JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users', e);
  }
}

// ─── 테이블: Reservations (예약출입 기본값 및 스토리지 연동) ─────
const DEFAULT_RESERVATIONS = [
  {
    reservation_id: 'rv001',
    user_id: 'u001',
    room_id: 'r001',
    start_time: '2026-11-13T10:00:00',
    end_time: '2026-11-13T11:30:00',
    used_equipments: ['업라이트 피아노', '보면대'],
    status: 'in_use',
    purpose: '개인 연습',
    instrument_use: true,
    created_at: '2026-11-13T09:30:00'
  },
  {
    reservation_id: 'rv002',
    user_id: 'u002',
    room_id: 'r002',
    start_time: '2026-11-14T14:00:00',
    end_time: '2026-11-14T17:00:00',
    used_equipments: ['그랜드 피아노', '무선 마이크'],
    status: 'pending',
    purpose: '동아리 발표',
    instrument_use: true,
    created_at: '2026-11-13T10:00:00'
  },
  {
    reservation_id: 'rv003',
    user_id: 'u004',
    room_id: 'r004',
    start_time: '2026-11-14T13:00:00',
    end_time: '2026-11-14T14:30:00',
    used_equipments: ['디지털 피아노', '헤드폰'],
    status: 'pending',
    purpose: '피아노 연습',
    instrument_use: true,
    created_at: '2026-11-13T11:00:00'
  },
  {
    reservation_id: 'rv004',
    user_id: 'u005',
    room_id: 'r008',
    start_time: '2026-11-13T13:00:00',
    end_time: '2026-11-13T14:00:00',
    used_equipments: ['업라이트 피아노'],
    status: 'reserved',
    purpose: '개인 연습',
    instrument_use: true,
    created_at: '2026-11-13T08:00:00'
  },
];

function loadStoredReservations() {
  try {
    const raw = localStorage.getItem('custom_reservations');
    let list = raw ? JSON.parse(raw) : DEFAULT_RESERVATIONS;
    // 현재 시각 기준 status 갱신
    const now = Date.now();
    let updated = false;
    list = list.map(r => {
      const s = new Date(r.start_time).getTime();
      const e = new Date(r.end_time).getTime();
      if (r.status === 'reserved' && now >= s && now < e) {
        updated = true;
        return { ...r, status: 'in_use' };
      }
      if ((r.status === 'in_use' || r.status === 'reserved') && now >= e) {
        updated = true;
        return { ...r, status: 'completed' };
      }
      return r;
    });
    if (updated || !raw) {
      localStorage.setItem('custom_reservations', JSON.stringify(list));
    }
    return list;
  } catch (e) {
    return DEFAULT_RESERVATIONS;
  }
}

function saveReservationsToStorage(reservations) {
  try {
    localStorage.setItem('custom_reservations', JSON.stringify(reservations));
  } catch (e) {
    console.error('Failed to save reservations', e);
  }
}

// ─── 강의실 기본 데이터 및 스토리지 연동 ──────────────────────
const DEFAULT_ROOMS = [
  {
    room_id: 'r001', room_name: '합주실', location: '1층', floor: 1,
    is_active: true, requires_approval: false,
    icon: '🎵', description: '일반 합주 연습을 위한 공간입니다. 피아노, 보면대 등이 구비되어 있습니다.',
    capacity: 20
  },
  {
    room_id: 'r002', room_name: '콘서트홀', location: '1층', floor: 1,
    is_active: true, requires_approval: true,
    icon: '🎭', description: '공연 및 발표를 위한 대형 홀입니다. 사전 조교 승인이 필요합니다.',
    capacity: 200
  },
  {
    room_id: 'r003', room_name: '210호', location: '2층', floor: 2,
    is_active: true, requires_approval: false,
    icon: '📚', description: '일반 강의실로 대여 가능합니다.',
    capacity: 40
  },
  {
    room_id: 'r004', room_name: '디지털 피아노실', location: '2층', floor: 2,
    is_active: true, requires_approval: true,
    icon: '🎹', description: '디지털 피아노 개인 연습실입니다. 사전 조교 승인이 필요합니다.',
    capacity: 10
  },
  {
    room_id: 'r005', room_name: '311호', location: '3층', floor: 3,
    is_active: true, requires_approval: false,
    icon: '🏫', description: '일반 강의실입니다.',
    capacity: 35
  },
  {
    room_id: 'r006', room_name: '국악 합주실', location: '4층', floor: 4,
    is_active: true, requires_approval: false,
    icon: '🥁', description: '국악 합주 연습을 위한 공간입니다.',
    capacity: 15
  },
  {
    room_id: 'r007', room_name: '국악 강의실', location: '4층', floor: 4,
    is_active: true, requires_approval: false,
    icon: '🎶', description: '국악 관련 강의 및 연습 공간입니다.',
    capacity: 25
  },
  {
    room_id: 'r008', room_name: '연습실', location: '5층', floor: 5,
    is_active: true, requires_approval: false,
    icon: '🎼', description: '개인 악기 연습을 위한 공간입니다.',
    capacity: 5
  },
  {
    room_id: 'r009', room_name: '국악 연습실', location: '5층', floor: 5,
    is_active: true, requires_approval: false,
    icon: '🪘', description: '국악 개인 연습 공간입니다.',
    capacity: 5
  },
  {
    room_id: 'r010', room_name: '연습실', location: '6층', floor: 6,
    is_active: false, requires_approval: false,
    icon: '🎼', description: '현재 수리 중입니다.',
    capacity: 30
  },
];

function loadStoredRooms() {
  try {
    const raw = localStorage.getItem('custom_rooms');
    return raw ? JSON.parse(raw) : DEFAULT_ROOMS;
  } catch (e) {
    return DEFAULT_ROOMS;
  }
}

function saveRoomsToStorage(rooms) {
  try {
    localStorage.setItem('custom_rooms', JSON.stringify(rooms));
  } catch (e) {
    console.error('Failed to save rooms', e);
  }
}

// ─── 수업 시간표 기본값 및 스토리지 연동 ──────────────────────
const DEFAULT_SCHEDULES = [
  { schedule_id: 'cs001', room_id: 'r003', day_of_week: 1, start_time: '09:00', end_time: '11:00', course_name: '음악이론' },
  { schedule_id: 'cs002', room_id: 'r003', day_of_week: 3, start_time: '13:00', end_time: '15:00', course_name: '화성학' },
  { schedule_id: 'cs003', room_id: 'r005', day_of_week: 2, start_time: '10:00', end_time: '12:00', course_name: '국악개론' },
  { schedule_id: 'cs004', room_id: 'r005', day_of_week: 4, start_time: '14:00', end_time: '16:00', course_name: '합창' },
  { schedule_id: 'cs005', room_id: 'r007', day_of_week: 1, start_time: '11:00', end_time: '13:00', course_name: '국악실기' },
  { schedule_id: 'cs006', room_id: 'r007', day_of_week: 3, start_time: '10:00', end_time: '12:00', course_name: '가야금 기초' },
  { schedule_id: 'cs007', room_id: 'r001', day_of_week: 5, start_time: '09:00', end_time: '11:00', course_name: '오케스트라 실습' },
];

function loadStoredSchedules() {
  try {
    const raw = localStorage.getItem('custom_schedules');
    return raw ? JSON.parse(raw) : DEFAULT_SCHEDULES;
  } catch (e) {
    return DEFAULT_SCHEDULES;
  }
}

function saveSchedulesToStorage(schedules) {
  try {
    localStorage.setItem('custom_schedules', JSON.stringify(schedules));
  } catch (e) {
    console.error('Failed to save schedules', e);
  }
}

const DB = {
  users: loadStoredUsers(),
  rooms: loadStoredRooms(),

  // ─── 테이블: Equipment (교구비품) ───────────────────────
  // equipment_id | room_id(FK) | name | quantity | status
  equipment: [
    // 합주실 (r001)
    { equipment_id: 'e001', room_id: 'r001', name: '업라이트 피아노', quantity: 1, status: 'good' },
    { equipment_id: 'e002', room_id: 'r001', name: '보면대', quantity: 10, status: 'good' },
    { equipment_id: 'e003', room_id: 'r001', name: '의자', quantity: 20, status: 'good' },
    { equipment_id: 'e004', room_id: 'r001', name: '칠판', quantity: 1, status: 'good' },
    // 콘서트홀 (r002)
    { equipment_id: 'e005', room_id: 'r002', name: '그랜드 피아노', quantity: 1, status: 'good' },
    { equipment_id: 'e006', room_id: 'r002', name: '무선 마이크', quantity: 4, status: 'good' },
    { equipment_id: 'e007', room_id: 'r002', name: '빔 프로젝터', quantity: 1, status: 'good' },
    { equipment_id: 'e008', room_id: 'r002', name: '음향 시스템', quantity: 1, status: 'good' },
    { equipment_id: 'e009', room_id: 'r002', name: '조명 장비', quantity: 1, status: 'good' },
    // 210호 (r003)
    { equipment_id: 'e010', room_id: 'r003', name: '칠판', quantity: 1, status: 'good' },
    { equipment_id: 'e011', room_id: 'r003', name: '빔 프로젝터', quantity: 1, status: 'good' },
    { equipment_id: 'e012', room_id: 'r003', name: '의자', quantity: 40, status: 'good' },
    // 디지털 피아노실 (r004)
    { equipment_id: 'e013', room_id: 'r004', name: '디지털 피아노', quantity: 8, status: 'good' },
    { equipment_id: 'e014', room_id: 'r004', name: '헤드폰', quantity: 8, status: 'good' },
    // 311호 (r005)
    { equipment_id: 'e015', room_id: 'r005', name: '칠판', quantity: 1, status: 'good' },
    { equipment_id: 'e016', room_id: 'r005', name: '빔 프로젝터', quantity: 1, status: 'good' },
    // 국악 합주실 (r006)
    { equipment_id: 'e017', room_id: 'r006', name: '장구', quantity: 5, status: 'good' },
    { equipment_id: 'e018', room_id: 'r006', name: '북', quantity: 3, status: 'good' },
    { equipment_id: 'e019', room_id: 'r006', name: '칠판', quantity: 1, status: 'good' },
    // 국악 강의실 (r007)
    { equipment_id: 'e020', room_id: 'r007', name: '칠판', quantity: 1, status: 'good' },
    { equipment_id: 'e021', room_id: 'r007', name: '보면대', quantity: 8, status: 'good' },
    // 연습실 (r008)
    { equipment_id: 'e022', room_id: 'r008', name: '업라이트 피아노', quantity: 1, status: 'good' },
    { equipment_id: 'e023', room_id: 'r008', name: '보면대', quantity: 2, status: 'good' },
    // 국악 연습실 (r009)
    { equipment_id: 'e024', room_id: 'r009', name: '장구', quantity: 1, status: 'good' },
    { equipment_id: 'e025', room_id: 'r009', name: '보면대', quantity: 2, status: 'good' },
  ],

  // ─── 테이블: Reservations (예약출입) ────────────────────
  reservations: loadStoredReservations(),

  // ─── 수업 시간표 ─────────────────────────────────────────
  class_schedules: loadStoredSchedules(),
};

// ─── 세션 관리 ─────────────────────────────────────────────
const Session = {
  get currentUser() {
    const raw = sessionStorage.getItem('current_user');
    return raw ? JSON.parse(raw) : null;
  },
  set currentUser(user) {
    if (user) sessionStorage.setItem('current_user', JSON.stringify(user));
    else sessionStorage.removeItem('current_user');
  },
  isLoggedIn() { return !!this.currentUser; },
  isAdmin() { return this.currentUser?.role === 'admin'; },
  logout() {
    this.currentUser = null;
    const isPages = window.location.pathname.includes('/pages/') || window.location.pathname.includes('\\pages\\');
    window.location.href = isPages ? '../index.html' : 'index.html';
  }
};

// ─── 인증 ───────────────────────────────────────────────────
const Auth = {
  register(name, student_id, password) {
    if (!name || !student_id || !password) {
      return { success: false, error: '모든 항목을 입력해 주세요.' };
    }
    const trimmedId = student_id.trim();
    const existing = DB.users.find(u => u.student_id === trimmedId);
    if (existing) {
      return { success: false, error: '이미 등록된 학번(ID)입니다.' };
    }
    const newUser = {
      id: 'u' + Date.now(),
      student_id: trimmedId,
      password_hash: btoa(password),
      name: name.trim(),
      role: 'student',
      created_at: new Date().toISOString()
    };
    DB.users.push(newUser);
    saveUsersToStorage(DB.users);
    return { success: true, user: newUser };
  },
  login(student_id, password) {
    const user = DB.users.find(u => u.student_id === student_id);
    if (!user) return { success: false, error: '등록되지 않은 학번입니다.' };
    if (user.password_hash !== btoa(password)) return { success: false, error: '비밀번호가 올바르지 않습니다.' };
    Session.currentUser = user;
    return { success: true, user };
  },
  requireLogin() {
    if (!Session.isLoggedIn()) {
      window.location.href = '../index.html';
      return false;
    }
    return true;
  },
  requireAdmin() {
    if (!Session.isAdmin()) {
      showToast('관리자만 접근할 수 있습니다.', 'error');
      window.location.href = 'home.html';
      return false;
    }
    return true;
  }
};

// ─── 예약 로직 ──────────────────────────────────────────────
const Reservation = {
  // 특정 방의 특정 날짜 예약 현황 조회 (로컬 날짜 기준)
  getReservationsForRoom(room_id, date) {
    const targetDateStr = getLocalDateString(date);
    return DB.reservations.filter(r =>
      r.room_id === room_id &&
      getLocalDateString(r.start_time) === targetDateStr &&
      !['canceled'].includes(r.status)
    );
  },

  // 수업 시간표 조회
  getClassSchedules(room_id, date) {
    const d = (date instanceof Date) ? date : new Date(date);
    const dow = d.getDay(); // 0=일, 1=월 ... 6=토
    return DB.class_schedules.filter(s => s.room_id === room_id && s.day_of_week === dow);
  },

  // 슬롯 상태 계산 (30분 단위)
  getSlotStatus(room_id, datetime) {
    const dt = (datetime instanceof Date) ? datetime : new Date(datetime);
    const slotStart = dt.getTime();
    const slotEnd = slotStart + 30 * 60000;
    const timeStr = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
    const dtEnd = new Date(slotEnd);
    const timeEndStr = `${String(dtEnd.getHours()).padStart(2, '0')}:${String(dtEnd.getMinutes()).padStart(2, '0')}`;

    // 1. 수업 시간 확인
    const classSchedules = this.getClassSchedules(room_id, dt);
    for (const cs of classSchedules) {
      if (timeStr < cs.end_time && timeEndStr > cs.start_time) {
        return 'class';
      }
    }

    // 2. 예약 확인 (시간 밀리초 겹침 판정)
    for (const rv of DB.reservations) {
      if (rv.room_id !== room_id || ['canceled', 'completed'].includes(rv.status)) continue;
      const rvStart = new Date(rv.start_time).getTime();
      const rvEnd = new Date(rv.end_time).getTime();
      if (slotStart < rvEnd && slotEnd > rvStart) {
        return 'rented';
      }
    }

    return 'available';
  },

  // 현재 사용자의 활성 예약 조회 (진행 중이거나 종료되지 않은 미래 예약)
  getActiveReservation(user_id) {
    const now = Date.now();
    return DB.reservations.find(r =>
      r.user_id === user_id &&
      ['reserved', 'in_use', 'pending'].includes(r.status) &&
      new Date(r.end_time).getTime() > now
    );
  },

  // 예약 생성
  create({ user_id, room_id, start_time, end_time, used_equipments, purpose, instrument_use }) {
    // 보안: 동시 여러 강의실 대여 불가
    const existing = this.getActiveReservation(user_id);
    if (existing) {
      return {
        success: false,
        error: '이미 대여(예약) 중인 강의실이 있습니다.\n동시에 여러 강의실을 대여할 수 없으며, 기존 예약을 취소하거나 이용 종료 후 다시 시도하세요.'
      };
    }

    const startDt = new Date(start_time);
    const endDt = new Date(end_time);

    // 시간 슬롯 가용성 확인
    let checkDt = new Date(startDt);
    while (checkDt < endDt) {
      const status = this.getSlotStatus(room_id, checkDt);
      if (status !== 'available') {
        return { success: false, error: '이 시간대는 사용할 수 없습니다.' };
      }
      checkDt = new Date(checkDt.getTime() + 30 * 60000);
    }

    // 오후 6시 이후 승인 필요 방은 반려
    const hour = startDt.getHours();
    const room = DB.rooms.find(r => r.room_id === room_id);
    if (room && room.requires_approval && hour >= 18) {
      return { success: false, error: '오후 6시 이후 신청은 반려됩니다.\n(승인 필요 강의실)' };
    }

    const reservation = {
      reservation_id: 'rv' + Date.now(),
      user_id,
      room_id,
      start_time: toLocalISOString(startDt),
      end_time: toLocalISOString(endDt),
      used_equipments: used_equipments || [],
      status: (room && room.requires_approval) ? 'pending' : 'reserved',
      purpose: purpose || '',
      instrument_use: instrument_use || false,
      created_at: toLocalISOString(new Date())
    };

    // 최신 예약이 가장 먼저 오도록 unshift
    DB.reservations.unshift(reservation);
    saveReservationsToStorage(DB.reservations);

    return { success: true, reservation };
  },

  // 예약 취소
  cancel(reservation_id, user_id) {
    const rv = DB.reservations.find(r => r.reservation_id === reservation_id);
    if (!rv) return { success: false, error: '예약을 찾을 수 없습니다.' };
    if (rv.user_id !== user_id && Session.currentUser?.role !== 'admin') {
      return { success: false, error: '본인의 예약만 취소할 수 있습니다.' };
    }
    rv.status = 'canceled';
    saveReservationsToStorage(DB.reservations);
    return { success: true };
  },

  // 예약 승인 (관리자)
  approve(reservation_id) {
    const rv = DB.reservations.find(r => r.reservation_id === reservation_id);
    if (!rv) return { success: false, error: '예약을 찾을 수 없습니다.' };
    rv.status = 'reserved';
    saveReservationsToStorage(DB.reservations);
    return { success: true };
  },

  // 예약 반려 (관리자)
  reject(reservation_id) {
    const rv = DB.reservations.find(r => r.reservation_id === reservation_id);
    if (!rv) return { success: false, error: '예약을 찾을 수 없습니다.' };
    rv.status = 'canceled';
    saveReservationsToStorage(DB.reservations);
    return { success: true };
  }
};

// ─── 강의실 로직 ─────────────────────────────────────────────
const Room = {
  getAll() { return DB.rooms; },
  getById(id) { return DB.rooms.find(r => r.room_id === id); },
  getEquipment(room_id) { return DB.equipment.filter(e => e.room_id === room_id); },

  // 강의실 현재 상태 계산 (대여 가능 / 다른 사람이 대여 중 / 수업시간 / 사용 불가)
  getCurrentStatus(room_id) {
    const room = this.getById(room_id);
    if (!room || !room.is_active) return 'unavailable';

    const now = new Date();
    const nowTime = now.getTime();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. 현재 진행 중인 수업 확인
    const classSchedules = Reservation.getClassSchedules(room_id, now);
    for (const cs of classSchedules) {
      if (timeStr >= cs.start_time && timeStr < cs.end_time) {
        return 'class';
      }
    }

    // 2. 현재 진행 중인 대여 확인
    for (const rv of DB.reservations) {
      if (rv.room_id !== room_id || ['canceled', 'completed'].includes(rv.status)) continue;
      const s = new Date(rv.start_time).getTime();
      const e = new Date(rv.end_time).getTime();
      if (nowTime >= s && nowTime < e && ['reserved', 'in_use'].includes(rv.status)) {
        return 'rented';
      }
    }

    return 'available';
  },

  getStatusLabel(status) {
    const map = {
      available: '대여 가능',
      rented: '대여 중',
      class: '수업 시간',
      unavailable: '사용 불가'
    };
    return map[status] || status;
  },

  getRoomStatus(room_id) {
    return this.getCurrentStatus(room_id);
  }
};

// ─── 유틸리티 ───────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-20px)'; setTimeout(() => toast.remove(), 300); }, duration);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function formatDatetime(dateStr) {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

function maskName(name) {
  if (!name) return '';
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

function getDayName(dow) {
  return ['일','월','화','수','목','금','토'][dow];
}

// 현재 활성 nav 표시
function setActiveNav(pageId) {
  document.querySelectorAll('.bottom-nav a, .sidebar-nav a, .sidebar-nav button').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });
}

// 페이지 초기화 공통
function initPage(pageId) {
  if (!Auth.requireLogin()) return false;
  setActiveNav(pageId);

  // 사용자 이름 표시
  const user = Session.currentUser;
  document.querySelectorAll('.user-name-display').forEach(el => {
    el.textContent = maskName(user.name);
  });
  document.querySelectorAll('.user-id-display').forEach(el => {
    el.textContent = user.student_id;
  });
  document.querySelectorAll('.user-role-display').forEach(el => {
    el.textContent = user.role === 'admin' ? '관리자' : '학생';
  });

  // 로그아웃 버튼
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('로그아웃 하시겠습니까?')) Session.logout();
    });
  });

  // 관리자 메뉴 표시 여부
  if (Session.isAdmin()) {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
  } else {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }

  return true;
}

// 공통 HTML 조각 삽입
function insertCommonHTML() {
  // Toast 컨테이너
  if (!document.getElementById('toast-container')) {
    const tc = document.createElement('div');
    tc.id = 'toast-container';
    document.body.appendChild(tc);
  }
}

document.addEventListener('DOMContentLoaded', insertCommonHTML);

