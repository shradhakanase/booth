// Candidate to Party lookup and normalization dictionary
export const KNOWN_PARTY_MAP = {
  // Agra / Fatehpur Sikri
  'RAJKUMAR CHAHAR': 'BJP',
  'RAMNATH SINGH SIKARWAR': 'INC',
  'PT. RAMNIWAS SHARMA': 'BSP',
  'PROF S P SINGH BAGHEL': 'BJP',
  'POOJA AMROHI': 'SP',
  'SURESH CHAND KARDAM': 'BSP',
  'DR. DHARMPAL SINGH': 'BJP',
  'RAM PRATAP SINGH': 'BJP',
  
  // Aligarh
  'ANOOP PRADHAN BALMIKI': 'BJP',
  'ANOOP SINGH URF ANOOP PRADHAN VALMEEKI': 'BJP',
  'SATISH KUMAR GAUTAM': 'BJP',
  'BIJENDRA SINGH': 'SP',
  'HITESH KUMAR BAGHEL': 'BSP',
  'JASVEER VALMIKI': 'SP',
  'HEMBABOO DHANGAR': 'BSP',

  // Ambedkar Nagar
  'RITESH PANDEY': 'BJP',
  'LALJI VERMA': 'SP',
  'QAMAR HAYAT': 'BSP',

  // Amethi
  'KISHORI LAL': 'INC',
  'SMRITI ZUBIN IRANI': 'BJP',
  'NANHE SINGH CHAUHAN': 'BSP',

  // Azamgarh
  'DINESH LAL YADAV "NIRAHUA"': 'BJP',
  'DHARMENDRA YADAV': 'SP',
  'SABEHA ANSARI': 'BSP',

  // Balrampur / Shravasti / Gonda
  'SAKET MISRA': 'BJP',
  'RAM SHIROMANI VERMA': 'SP',
  'MUINUDDIN AHMAD KHAN': 'BSP',

  // Banda
  'R. K. SINGH PATEL': 'BJP',
  'KRISHNA DEVI SHIVSHANKER PATEL': 'SP',
  'MAYANK DWIVEDI': 'BSP',

  // Barabanki
  'TANUJ PUNIA': 'INC',
  'RAJRANI RAWAT': 'BJP',
  'SHIV KUMAR DOHARE': 'BSP',

  // Bareilly / Aonla
  'CHHATRA PAL SINGH GANGWAR': 'BJP',
  'PRAVEEN SINGH ARON': 'SP',
  'NEERAJ MAURYA': 'SP',
  'DHARMENDRA KASHYAP': 'BJP',

  // Gautam Buddha Nagar / Ghaziabad
  'DR. MAHESH SHARMA': 'BJP',
  'DR. MAHENDRA SINGH NAGAR': 'SP',
  'RAJENDRA SINGH SOLANKI': 'BSP',
  'ATUL GARG': 'BJP',
  'DOLLY SHARMA': 'INC',
  'NAND KISHOR PUNDIR': 'BSP',

  // Gorakhpur
  'RAVI KISHAN': 'BJP',
  'KAJAL NISHAD': 'SP',
  'JAVED SIMNANI': 'BSP',
  'KAMLESH PASWAN': 'BJP',
  'SADAL PRASAD': 'SP',
  'RAMSAMUJH': 'BSP',

  // Jaunpur / Machhlishahr
  'KRIPASHANKAR SINGH': 'BJP',
  'BABU SINGH KUSHWAHA': 'SP',
  'SHYAM SINGH YADAV': 'BSP',
  'B.P. SAROJ': 'BJP',
  'BHOLANATH (B.P. SAROJ)': 'BJP',
  'PRIYA SAROJ': 'SP',

  // Jhansi / Jalaun
  'ANURAG SHARMA': 'BJP',
  'PRADEEP JAIN ADITYA': 'INC',
  'RAVI PRAKASH': 'BSP',
  'BHANU PRATAP SINGH VERMA': 'BJP',
  'AJAY SINGH (PANKAJ)': 'SP',

  // Kannauj
  'AKHILESH YADAV': 'SP',
  'SUBRAT PATHAK': 'BJP',
  'IMRAN BIN ZAFAR': 'BSP',

  // Kanpur Nagar / Akbarpur
  'RAMESH AWASTHI': 'BJP',
  'ALOK MISHRA': 'INC',
  'KULDEEP BHADAURIA': 'BSP',
  'DEVENDRA SINGH BHOLE': 'BJP',
  'RAJARAM PAL': 'SP',

  // Lucknow
  'RAJNATH SINGH': 'BJP',
  'RAVIDAS MEHROTRA': 'SP',
  'SARWAR MALIK': 'BSP',
  'KAUSHAL KISHORE': 'BJP',
  'JAIDEVI': 'BJP',
  'JAI DEVI': 'BJP',
  'SURESH KUMAR SRIVASTAVA': 'BJP',
  'PROF. REETA BAHUGUNA JOSHI': 'BJP',

  // Mainpuri
  'DIMPLE YADAV': 'SP',
  'JAIVEER SINGH': 'BJP',
  'SHIV PRASAD YADAV': 'BSP',

  // Varanasi
  'NARENDRA MODI': 'BJP',
  'AJAY RAI': 'INC',
  'ATHER JAMAL LARI': 'BSP',
  'SURENDRA NARAYAN SINGH': 'BJP',
  'MAHENDRA SINGH PATEL': 'SP',
  'DR. AWADHESH SINGH': 'BJP',
  'NEEL RATAN SINGH PATEL \'NEELU\'': 'AD(S)',
  'BHOLANATH': 'BJP',
  'TRIBHUVAN RAM': 'BSP',

  // Prayagraj / Allahabad / Phulpur
  'UJJWAL RAMAN SINGH': 'INC',
  'NEERAJ TRIPATHI': 'BJP',
  'RAMESH KUMAR PATEL': 'BSP',
  'PRAVEEN PATEL': 'BJP',
  'AMARNATH SINGH MAURYA': 'SP',

  // Unnao (2017, 2019, 2022, 2024)
  'KULDEEP SINGH SENGAR': 'BJP',
  'DQYNHI FLAG LSAXJ': 'BJP',
  'BADLU KHAN': 'BSP',
  'CNYW [KAKWA': 'BSP',
  'CNYW [KHA': 'BSP',
  'MOHD IRSHAD KHAN': 'SP',
  "EKS0 BJ'KKN [KKWA": 'SP',
  "EKS0 BJ'KKN [KHA": 'SP',
  'BAMBA LAL': 'BJP',
  'बम्बा लाल': 'BJP',
  'RAM BARAN': 'BSP',
  'राम बरन': 'BSP',
  'SUDHIR KUMAR': 'SP',
  'सुधीर कुमार': 'SP',
  'BRIJESH KUMAR': 'BJP',
  'बृजेश कुमार': 'BJP',
  'BRIJESH RAWAT': 'BJP',
  'RADHEY LAL RAWAT': 'BSP',
  'राधे लाल रावत पुत्र मुन्नू': 'BSP',
  'राधे लाल रावत': 'BSP',
  'BHAGWAN DAS KATHERIA': 'SP',
  'भगवान दास कठेरिया': 'SP',
  'PANKAJ GUPTA': 'BJP',
  'पंकज गुप्‍ता': 'BJP',
  'पंकज गुप्ता': 'BJP',
  'MANISHA DEEPAK': 'SP',
  'मनीषा दीपक': 'SP',
  'PANKAJ TRIPATHI': 'BSP',
  'पंकज त्रिपाठी': 'BSP',
  'HRIDAY NARAYAN DIKSHIT': 'BJP',
  'हृदय नारायण दीक्षित': 'BJP',
  'SHASHANK SHEKHAR SINGH': 'BSP',
  'शशांक शेखर सिंह': 'BSP',
  'ANKIT PARIHAR': 'INC',
  'अंकित परिहार': 'INC',
  'ANIL SINGH': 'BSP',
  'अनिल सिंह': 'BSP',
  'UTTAM CHANDRA': 'BJP',
  'उत्तम चन्द्र उर्फ़ राकेश लोधी': 'BJP',
  'उत्तम चन्द्र': 'BJP',
  'UDAY RAJ': 'SP',
  'उदय राज': 'SP',
  'SAKSHI MAHARAJ': 'BJP',
  'SWAMI PRASAD MAURYA': 'BJP',
  'ANNU TANDON': 'SP',
  'POOJA PAL': 'SP',
};

export function normalizePartyName(party) {
  if (!party) return 'IND';
  const clean = String(party).trim().toUpperCase();

  if (clean.includes('BHARATIYA JANATA') || clean.includes('BHARTIYA JANTA') || clean.includes('BHARTIYA JANATA') || clean.includes('BHARATIYA JANTA') || clean.includes('B.J.P') || clean === 'BJP') {
    return 'BJP';
  }
  if (clean.includes('SAMAJWADI') || clean.includes('S.P.') || clean === 'SP') {
    return 'SP';
  }
  if (clean.includes('BAHUJAN SAMAJ') || clean.includes('B.S.P') || clean === 'BSP') {
    return 'BSP';
  }
  if (clean.includes('INDIAN NATIONAL CONGRESS') || clean.includes('CONGRESS') || clean.includes('I.N.C') || clean === 'INC') {
    return 'INC';
  }
  if (clean.includes('AAM AADMI') || clean.includes('A.A.P') || clean === 'AAP') {
    return 'AAP';
  }
  if (clean.includes('APNA DAL') || clean.includes('AD(S)') || clean.includes('ADS')) {
    return 'AD(S)';
  }
  if (clean.includes('RASHTRIYA LOK DAL') || clean.includes('R.L.D') || clean === 'RLD') {
    return 'RLD';
  }
  if (clean.includes('SUHELDEV') || clean.includes('SBSP')) {
    return 'SBSP';
  }
  if (clean.includes('AZAD SAMAJ') || clean.includes('ASPKR')) {
    return 'ASPKR';
  }
  if (clean.includes('INDEPENDENT') || clean.includes('NIRDL') || clean === 'IND') {
    return 'IND';
  }

  return clean;
}

export function cleanCandidateName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/\r?\n+/g, ' ')
    .replace(/^Candidate\s*Name\s*[-–:]*\s*\d*\s*[-–:]*\s*/i, '')
    .replace(/^\d+[\s.)-]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getPartyForCandidate(candidateName) {
  if (!candidateName) return 'IND';
  const clean = cleanCandidateName(candidateName).toUpperCase();
  
  if (KNOWN_PARTY_MAP[clean]) {
    return KNOWN_PARTY_MAP[clean];
  }

  // Substring match
  for (const [name, party] of Object.entries(KNOWN_PARTY_MAP)) {
    if (clean.includes(name) || name.includes(clean)) {
      return party;
    }
  }

  // Keywords heuristics
  return normalizePartyName(clean);
}

export const PARTY_COLORS = {
  BJP: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', hex: '#f97316' },
  SP: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', hex: '#ef4444' },
  INC: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', hex: '#3b82f6' },
  BSP: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', hex: '#06b6d4' },
  AAP: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', hex: '#10b981' },
  'AD(S)': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', hex: '#f59e0b' },
  RLD: { bg: 'bg-lime-500/15', text: 'text-lime-400', border: 'border-lime-500/30', hex: '#84cc16' },
  SBSP: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', hex: '#eab308' },
  ASPKR: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', hex: '#a855f7' },
  IND: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30', hex: '#94a3b8' },
  OTHERS: { bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30', hex: '#71717a' },
};

export function getPartyColor(party) {
  const norm = normalizePartyName(party);
  return PARTY_COLORS[norm] || PARTY_COLORS.IND;
}

