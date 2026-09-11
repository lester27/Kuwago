/* ═══════════════════════════════════════════════════════════
   mock.js — Realistic mock data generator
   Toggle with ?mock=true in URL. Generates 38 students
   with Filipino names, realistic statuses, and 2-3
   unmatched entries.
   ═══════════════════════════════════════════════════════════ */

const ROSTER_NAMES = [
  'Dela Cruz, Juan A.',
  'Santos, Maria B.',
  'Reyes, Jose C.',
  'Garcia, Ana D.',
  'Mendoza, Carlos E.',
  'Torres, Patricia F.',
  'Villanueva, Miguel G.',
  'Ramos, Sofia H.',
  'Cruz, Antonio I.',
  'Gonzales, Camille J.',
  'Bautista, Rafael K.',
  'Aquino, Isabella L.',
  'Fernandez, Diego M.',
  'Lopez, Angela N.',
  'Castillo, Luis O.',
  'Rivera, Gabriela P.',
  'Flores, Marco Q.',
  'Navarro, Bianca R.',
  'Morales, Adrian S.',
  'Domingo, Francesca T.',
  'Santiago, Kevin U.',
  'Dizon, Katrina V.',
  'Pascual, Benedict W.',
  'Soriano, Christine X.',
  'Ocampo, Paolo Y.',
  'Manalo, Denise Z.',
  'Lim, Kenneth A.',
  'Tan, Jasmine B.',
  'Chua, Raymond C.',
  'Sy, Michelle D.',
  'Ong, Victor E.',
  'Co, Stephanie F.',
  'Yu, Albert G.',
  'Ang, Rachel H.',
  'Go, Patrick I.',
  'Tiu, Nicole J.',
  'Yap, Daniel K.',
  'Lee, Samantha L.'
];

const UNMATCHED_NAMES = [
  'J. delacruz',
  'maria_santos123',
  'Carlos M.'
];

const MOCK_COURSES = [
  { sectionId: 'BSIT301-A', courseName: 'IT Capstone Project', sectionName: 'Section A' },
  { sectionId: 'BSIT301-B', courseName: 'IT Capstone Project', sectionName: 'Section B' },
  { sectionId: 'BSCS201-A', courseName: 'Data Structures', sectionName: 'Section A' }
];

const STATUSES = ['focused', 'unfocused', 'not_joined'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function minutesAgo(n) {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

function secondsAgo(n) {
  return new Date(Date.now() - n * 1000).toISOString();
}

/* Generate a single slim roster student record (matches new API shape) */
function mockStudent(name, forceLiveStatus) {
  const liveStatus = forceLiveStatus || randomChoice(['not_joined', 'on_meet', 'away']);
  const isJoined = liveStatus !== 'not_joined';

  /* Stable attendance cache */
  let attendanceStatus = 'Absent';
  if (isJoined) {
    if (!_mockAttendanceCache[name]) {
      _mockAttendanceCache[name] = Math.random() > 0.15 ? 'Present' : 'Late';
    }
    attendanceStatus = _mockAttendanceCache[name];
  }

  /* Apply mock overrides */
  const override = _mockAttendanceOverrides[name];
  if (override) {
    attendanceStatus = override.status;
    _mockAttendanceCache[name] = override.status;
  }

  /* Mock active alerts */
  const activeAlerts = [];
  if (isJoined) {
    if (liveStatus === 'away' && Math.random() < 0.3) activeAlerts.push('sustained_unfocus');
    if (Math.random() < 0.15) activeAlerts.push('missing_extension');
  }

  return {
    name,
    liveStatus,
    attendanceStatus,
    activeAlerts,
    matched: true
  };
}

/* Internal state for mock */
let _mockPrompt = null;
let _mockPromptTimer = null;
let _mockSessionActive = false;
let _mockSessionId = null;
let _mockSessionStartedAt = null;
let _mockSessionSection = null;
let _mockAttendanceCache = {}; /* Stable attendance per student, cleared on session end */
let _mockAttendanceOverrides = {}; /* Manual attendance overrides from professor */

/* Generate full dashboard payload */
export function generateMockData() {
  const students = [];

  if (!_mockSessionActive) {
    /* No session — return idle state */
    for (const name of ROSTER_NAMES) {
      students.push(mockStudent(name, 'not_joined'));
    }
    return {
      sessionActive: false,
      activePrompt: null,
      students,
      extensionHealth: generateMockHealth(students),
      session: null
    };
  }

  /* Session is active — generate realistic data */
  for (const name of ROSTER_NAMES) {
    const roll = Math.random();
    let liveStatus;
    if (roll < 0.15) liveStatus = 'not_joined';
    else if (roll < 0.35) liveStatus = 'away';
    else liveStatus = 'on_meet';
    students.push(mockStudent(name, liveStatus));
  }

  /* Unmatched entries */
  for (const name of UNMATCHED_NAMES) {
    const liveStatus = randomChoice(['on_meet', 'away']);
    const entry = {
      name,
      liveStatus,
      attendanceStatus: null,
      activeAlerts: [],
      matched: false,
      suggestions: []
    };
    if (name === 'J. delacruz') {
      entry.suggestions = [{ name: 'Dela Cruz, Juan A.', score: 0.85 }, { name: 'Cruz, Antonio I.', score: 0.45 }];
    } else if (name === 'maria_santos123') {
      entry.suggestions = [{ name: 'Santos, Maria B.', score: 0.92 }];
    } else if (name === 'Carlos M.') {
      entry.suggestions = [{ name: 'Mendoza, Carlos E.', score: 0.78 }];
    }
    students.push(entry);
  }

  /* Count joined */
  const joined = students.filter(s => s.liveStatus !== 'not_joined');
  const rosterCount = ROSTER_NAMES.length;

  /* Build prompt data */
  let activePrompt = null;
  if (_mockPrompt) {
    const now = Date.now();
    const expiresAt = new Date(_mockPrompt.expiresAt).getTime();
    if (now < expiresAt) {
      activePrompt = {
        phrase: _mockPrompt.phrase,
        issuedAt: _mockPrompt.issuedAt,
        expiresAt: _mockPrompt.expiresAt,
        responsesReceived: Math.min(
          Math.floor(joined.length * Math.random() * 0.9),
          joined.length
        ),
        rosterCount
      };
    } else {
      /* Expired — keep showing it as expired */
      activePrompt = {
        phrase: _mockPrompt.phrase,
        issuedAt: _mockPrompt.issuedAt,
        expiresAt: _mockPrompt.expiresAt,
        responsesReceived: _mockPrompt.finalTally || Math.floor(joined.length * 0.7),
        rosterCount
      };
      if (!_mockPrompt.finalTally) {
        _mockPrompt.finalTally = activePrompt.responsesReceived;
      }
    }
  }

  return {
    sessionActive: true,
    activePrompt,
    students,
    extensionHealth: generateMockHealth(students),
    session: {
      active: true,
      sessionId: _mockSessionId,
      sectionId: _mockSessionSection,
      startedAt: _mockSessionStartedAt
    }
  };
}

/* Generate mock extension health data */
function generateMockHealth(students) {
  return ROSTER_NAMES.map((name, i) => {
    const student = students.find(s => s.name === name);
    const isJoined = student && student.liveStatus !== 'not_joined';

    /* If session not active, everyone is never_connected */
    if (!_mockSessionActive) {
      return {
        name,
        connected: false,
        detectedName: null,
        extensionVersion: null,
        lastHeartbeat: null,
        status: 'never_connected'
      };
    }

    /* If joined, mostly connected; a few have issues */
    if (isJoined) {
      const hasIssue = i % 12 === 0; /* ~8% have connection issues */
      return {
        name,
        connected: !hasIssue,
        detectedName: name,
        extensionVersion: hasIssue ? '0.9.0' : '1.0.0',
        lastHeartbeat: hasIssue ? minutesAgo(3) : secondsAgo(randomInt(2, 20)),
        status: hasIssue ? 'connection_lost' : 'connected'
      };
    }

    /* Not joined — never connected */
    return {
      name,
      connected: false,
      detectedName: null,
      extensionVersion: null,
      lastHeartbeat: null,
      status: 'never_connected'
    };
  });
}

/* Handle mock prompt submission */
export function mockSendPrompt(phrase, durationSeconds) {
  const now = new Date();
  _mockPrompt = {
    phrase,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
    finalTally: null
  };
  return { success: true };
}

/* Handle mock session control */
export function mockGetCourses() {
  return { courses: MOCK_COURSES };
}

export function mockStartSession(sectionId) {
  if (_mockSessionActive) {
    return { error: 'A session is already active.' };
  }
  _mockSessionId = 'mock_' + Date.now().toString(36);
  _mockSessionStartedAt = new Date().toISOString();
  _mockSessionSection = sectionId;
  _mockSessionActive = true;
  return {
    success: true,
    sessionId: _mockSessionId,
    sectionId,
    startedAt: _mockSessionStartedAt
  };
}

export function mockEndSession() {
  _mockSessionActive = false;
  _mockPrompt = null;
  const endedAt = new Date().toISOString();

  /* Build a mock summary based on the roster */
  const sessionDuration = 60 * 60; /* pretend 60 min session */
  const summaryStudents = ROSTER_NAMES.map(name => {
    const wasPresent = Math.random() > 0.1;
    const joinedLate = wasPresent && Math.random() > 0.7;
    const awaySeconds = wasPresent ? randomInt(0, 900) : 0;
    const attPct = wasPresent ? Math.max(0, Math.round((1 - awaySeconds / sessionDuration) * 100)) : 0;
    const issued = wasPresent ? randomInt(0, 5) : 0;
    const answered = issued > 0 ? randomInt(0, issued) : 0;
    const partPct = issued > 0 ? Math.round((answered / issued) * 100) : 0;

    const override = _mockAttendanceOverrides[name];
    let attendance = 'Absent';
    if (override) {
      attendance = override.status;
    } else if (wasPresent) {
      attendance = joinedLate ? 'Late' : 'Present';
    }

    return {
      name,
      timeIn: wasPresent ? minutesAgo(randomInt(5, 70)) : null,
      timeOut: wasPresent ? endedAt : null,
      attendance,
      focusLapses: wasPresent ? randomInt(0, 3) : 0,
      awaySeconds,
      attentivenessPct: attPct,
      answered,
      issued,
      participationPct: partPct,
      identityMatched: true
    };
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const sheetName = `Session_${dateStr}_${_mockSessionSection || 'Unknown'}`;

  _mockSessionId = null;
  _mockSessionStartedAt = null;
  _mockSessionSection = null;
  _mockAttendanceCache = {};
  _mockAttendanceOverrides = {};

  return {
    success: true,
    endedAt,
    summary: { sheetName, students: summaryStudents }
  };
}

export function mockGetSessionState() {
  if (!_mockSessionActive) return { active: false };
  return {
    active: true,
    sessionId: _mockSessionId,
    sectionId: _mockSessionSection,
    startedAt: _mockSessionStartedAt
  };
}

/* ── Batch 2 Mocks ── */
let _mockAliases = {};

export function mockResolveMatch(detectedName, resolvedTo) {
  if (resolvedTo === null) {
    _mockAliases[detectedName] = 'DISMISSED';
    /* Remove from unmatched array in mock generator */
    const idx = UNMATCHED_NAMES.indexOf(detectedName);
    if (idx !== -1) UNMATCHED_NAMES.splice(idx, 1);
  } else {
    _mockAliases[detectedName] = resolvedTo;
    const idx = UNMATCHED_NAMES.indexOf(detectedName);
    if (idx !== -1) UNMATCHED_NAMES.splice(idx, 1);
  }
  return { success: true, detectedName, resolvedTo, dismissed: resolvedTo === null };
}

export function mockOverrideAttendance(sessionId, studentName, status, reason) {
  _mockAttendanceOverrides[studentName] = { status, reason, time: new Date().toISOString() };
  return {
    success: true,
    studentName,
    oldStatus: 'Absent',
    newStatus: status,
    reason,
    changedAt: new Date().toISOString()
  };
}

export function mockStudentDetail(sessionId, studentName) {
  const liveStatus = randomChoice(['on_meet', 'away']);
  const isJoined = liveStatus !== 'not_joined';

  /* Mock attendance history */
  let attendanceStatus = 'Absent';
  const overrides = [];
  if (isJoined) {
    attendanceStatus = _mockAttendanceOverrides[studentName]?.status || _mockAttendanceCache[studentName] || (Math.random() > 0.15 ? 'Present' : 'Late');
    if (_mockAttendanceOverrides[studentName]) {
      overrides.push({
        from: _mockAttendanceCache[studentName] || 'Absent',
        to: _mockAttendanceOverrides[studentName].status,
        reason: _mockAttendanceOverrides[studentName].reason,
        at: _mockAttendanceOverrides[studentName].time
      });
    }
  }

  /* Mock lapses */
  const focusLapses = { count: 0, totalSeconds: 0, lapses: [] };
  if (isJoined) {
    focusLapses.count = randomInt(0, 3);
    for (let i = 0; i < focusLapses.count; i++) {
      const dur = randomInt(65, 300);
      focusLapses.totalSeconds += dur;
      focusLapses.lapses.push({
        startedAt: new Date(Date.now() - randomInt(60, 3600) * 1000).toISOString(),
        durationSeconds: dur
      });
    }
  }

  /* Mock participation */
  const issued = isJoined ? randomInt(0, 5) : 0;
  const answered = issued > 0 ? randomInt(0, issued) : 0;
  const prompts = [];
  for (let i = 0; i < issued; i++) {
    const isMatched = i < answered;
    prompts.push({
      promptId: `prmt_${i}`,
      phrase: 'test phrase',
      issuedAt: new Date(Date.now() - randomInt(60, 3600) * 1000).toISOString(),
      submittedText: isMatched ? 'test phrase' : (Math.random() > 0.5 ? 'wrong' : null),
      matched: isMatched,
      responded: isMatched || Math.random() > 0.5,
      timestamp: new Date(Date.now() - randomInt(10, 60) * 1000).toISOString()
    });
  }

  return {
    name: studentName,
    liveStatus,
    joinedAt: isJoined ? minutesAgo(randomInt(5, 90)) : null,
    leftAt: null,
    attendance: {
      status: attendanceStatus,
      overrides
    },
    focusLapses,
    participation: {
      answered,
      issued,
      prompts
    },
    extension: {
      connected: isJoined && Math.random() > 0.1,
      version: '1.2.0',
      lastHeartbeatAt: isJoined ? secondsAgo(randomInt(5, 60)) : null,
      detectedName: studentName
    },
    identity: { matched: true }
  };
}

/* Check if mock mode is enabled */
export function isMockMode() {
  return new URLSearchParams(window.location.search).has('mock');
}
