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

/* Generate a single student record */
function mockStudent(name, forceStatus) {
  const status = forceStatus || randomChoice(STATUSES);
  const isJoined = status !== 'not_joined';

  return {
    name,
    status,
    joinedAt: isJoined ? minutesAgo(randomInt(5, 90)) : null,
    lastActivityAt: isJoined ? secondsAgo(randomInt(2, 300)) : null,
    attentivenessPct: isJoined ? randomInt(40, 100) : 0,
    participationRate: isJoined ? randomInt(20, 100) : 0,
    matched: true
  };
}

/* Internal prompt state for mock */
let _mockPrompt = null;
let _mockPromptTimer = null;

/* Generate full dashboard payload */
export function generateMockData() {
  const students = [];

  /* Matched students from the roster */
  for (const name of ROSTER_NAMES) {
    /* ~15% chance of not_joined, ~20% unfocused, rest focused */
    const roll = Math.random();
    let status;
    if (roll < 0.15) status = 'not_joined';
    else if (roll < 0.35) status = 'unfocused';
    else status = 'focused';
    students.push(mockStudent(name, status));
  }

  /* Unmatched entries */
  for (const name of UNMATCHED_NAMES) {
    const entry = mockStudent(name, randomChoice(['focused', 'unfocused']));
    entry.matched = false;
    students.push(entry);
  }

  /* Count joined */
  const joined = students.filter(s => s.status !== 'not_joined');
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
    students
  };
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

/* Check if mock mode is enabled */
export function isMockMode() {
  return new URLSearchParams(window.location.search).has('mock');
}
