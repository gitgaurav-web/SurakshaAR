import { Preferences } from '@capacitor/preferences';

const STORAGE_KEYS = {
  WORKERS_ROSTER: 'suraksha_workers_roster'
};

const INITIAL_ROSTER = [
  {
    id: "JHK-MN-2026-081",
    name: "Budhan Manjhi",
    language: "sat",
    mineSector: "Jharia Coalfield, Dhanbad Cluster",
    orientationDays: 14,
    modulesCompleted: ["Fire Response", "Gas Protocol"],
    score: 92,
    certified: true,
    certHash: "0x8F9A7B3C2D1E4F5A",
    certDate: "2026-09-15"
  },
  {
    id: "JHK-ST-2026-142",
    name: "Rameshwar Singh",
    language: "hi",
    mineSector: "Bokaro Steel Plant Unit 4",
    orientationDays: 8,
    modulesCompleted: ["Fire Response"],
    score: 65,
    certified: false,
    certHash: null,
    certDate: null
  },
  {
    id: "JHK-MC-2026-049",
    name: "Sombari Tudu",
    language: "sat",
    mineSector: "Giridih Mica Processing Hub",
    orientationDays: 22,
    modulesCompleted: ["Fire Response", "Gas Protocol", "Machinery LOTO"],
    score: 88,
    certified: true,
    certHash: "0x3C4D5E6F7A8B9C0D",
    certDate: "2026-09-18"
  },
  {
    id: "JHK-ST-2026-304",
    name: "Vikram Kumar Mahato",
    language: "hi",
    mineSector: "Tata Steel Colliery, Digwadih",
    orientationDays: 29,
    modulesCompleted: ["Fire Response", "Gas Protocol"],
    score: 95,
    certified: true,
    certHash: "0x9E8D7C6B5A4F3E2D",
    certDate: "2026-09-20"
  }
];

export const getWorkerRoster = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WORKERS_ROSTER);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.WORKERS_ROSTER, JSON.stringify(INITIAL_ROSTER));
      Preferences.set({ key: STORAGE_KEYS.WORKERS_ROSTER, value: JSON.stringify(INITIAL_ROSTER) });
      return INITIAL_ROSTER;
    }
    return JSON.parse(data);
  } catch (err) {
    console.warn('LocalStorage error, using fallback roster:', err);
    return INITIAL_ROSTER;
  }
};

export const saveWorkerEvaluation = (workerData, certHash = null) => {
  const roster = getWorkerRoster();
  const existingIndex = roster.findIndex(w => w.id === workerData.id);
  
  const updatedWorker = {
    ...workerData,
    certified: workerData.score >= 75,
    certHash: certHash || (workerData.score >= 75 ? generateCertHash(workerData.id) : null),
    certDate: new Date().toISOString().split('T')[0]
  };

  if (existingIndex >= 0) {
    roster[existingIndex] = updatedWorker;
  } else {
    roster.unshift(updatedWorker);
  }

  const jsonStr = JSON.stringify(roster);
  localStorage.setItem(STORAGE_KEYS.WORKERS_ROSTER, jsonStr);
  Preferences.set({ key: STORAGE_KEYS.WORKERS_ROSTER, value: jsonStr });
  
  return updatedWorker;
};

export const generateCertHash = (workerId) => {
  const str = workerId + '_' + Date.now() + '_DGMS_JHK';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return '0x' + Math.abs(hash).toString(16).toUpperCase().padStart(12, '8F');
};

export const verifyCertByHash = (hashOrId) => {
  const roster = getWorkerRoster();
  const cleanInput = hashOrId.trim().toUpperCase();
  return roster.find(w => 
    (w.certHash && w.certHash.toUpperCase() === cleanInput) || 
    w.id.toUpperCase() === cleanInput
  );
};
