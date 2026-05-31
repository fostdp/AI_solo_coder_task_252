const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const codonTable = {
  'UUU': 'Phe', 'UUC': 'Phe', 'UUA': 'Leu', 'UUG': 'Leu',
  'UCU': 'Ser', 'UCC': 'Ser', 'UCA': 'Ser', 'UCG': 'Ser',
  'UAU': 'Tyr', 'UAC': 'Tyr', 'UAA': 'Stop', 'UAG': 'Stop',
  'UGU': 'Cys', 'UGC': 'Cys', 'UGA': 'Stop', 'UGG': 'Trp',
  'CUU': 'Leu', 'CUC': 'Leu', 'CUA': 'Leu', 'CUG': 'Leu',
  'CCU': 'Pro', 'CCC': 'Pro', 'CCA': 'Pro', 'CCG': 'Pro',
  'CAU': 'His', 'CAC': 'His', 'CAA': 'Gln', 'CAG': 'Gln',
  'CGU': 'Arg', 'CGC': 'Arg', 'CGA': 'Arg', 'CGG': 'Arg',
  'AUU': 'Ile', 'AUC': 'Ile', 'AUA': 'Ile', 'AUG': 'Met',
  'ACU': 'Thr', 'ACC': 'Thr', 'ACA': 'Thr', 'ACG': 'Thr',
  'AAU': 'Asn', 'AAC': 'Asn', 'AAA': 'Lys', 'AAG': 'Lys',
  'AGU': 'Ser', 'AGC': 'Ser', 'AGA': 'Arg', 'AGG': 'Arg',
  'GUU': 'Val', 'GUC': 'Val', 'GUA': 'Val', 'GUG': 'Val',
  'GCU': 'Ala', 'GCC': 'Ala', 'GCA': 'Ala', 'GCG': 'Ala',
  'GAU': 'Asp', 'GAC': 'Asp', 'GAA': 'Glu', 'GAG': 'Glu',
  'GGU': 'Gly', 'GGC': 'Gly', 'GGA': 'Gly', 'GGG': 'Gly'
};

const geneticDiseases = [
  {
    id: 1,
    name: '囊性纤维化',
    gene: 'CFTR',
    mutation: 'ΔF508缺失',
    chromosome: '7号染色体',
    description: '影响呼吸系统和消化系统，导致黏液积聚',
    symptoms: ['慢性咳嗽', '反复肺部感染', '消化不良', '生长迟缓'],
    frequency: '约1/3000（白种人）'
  },
  {
    id: 2,
    name: '镰状细胞贫血',
    gene: 'HBB',
    mutation: 'Glu6Val点突变',
    chromosome: '11号染色体',
    description: '血红蛋白异常导致红细胞呈镰刀状',
    symptoms: ['贫血', '疼痛危象', '感染风险增加', '器官损伤'],
    frequency: '约1/500（非洲裔）'
  },
  {
    id: 3,
    name: '亨廷顿舞蹈症',
    gene: 'HTT',
    mutation: 'CAG三核苷酸重复扩增',
    chromosome: '4号染色体',
    description: '神经退行性疾病，发病年龄通常在30-50岁',
    symptoms: ['不自主运动', '认知衰退', '精神症状', '吞咽困难'],
    frequency: '约1/10000'
  },
  {
    id: 4,
    name: '苯丙酮尿症 (PKU)',
    gene: 'PAH',
    mutation: '多种突变类型',
    chromosome: '12号染色体',
    description: '苯丙氨酸代谢障碍，需早期筛查治疗',
    symptoms: ['智力障碍', '癫痫', '皮肤色素减少', '湿疹'],
    frequency: '约1/10000'
  },
  {
    id: 5,
    name: '血友病A',
    gene: 'F8',
    mutation: '多种突变类型',
    chromosome: 'X染色体',
    description: '凝血因子VIII缺乏，X连锁隐性遗传',
    symptoms: ['出血倾向', '关节积血', '肌肉血肿', '凝血时间延长'],
    frequency: '约1/5000男性'
  }
];

const mutationChallengeTypes = [
  { type: 'substitution', name: '碱基置换', description: '找出序列中被替换的碱基' },
  { type: 'deletion', name: '碱基缺失', description: '找出序列中缺失的碱基' },
  { type: 'insertion', name: '碱基插入', description: '找出序列中额外插入的碱基' }
];

let playerRecords = [];
let currentQuestion = null;
let dailyChallenge = null;
let dailyChallengeDate = null;

const getComplement = (base) => {
  const complements = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
  return complements[base];
};

const transcribeDNAtoRNA = (dna) => {
  let rna = '';
  for (let i = 0; i < dna.length; i++) {
    if (dna[i] === 'T') {
      rna += 'U';
    } else {
      rna += dna[i];
    }
  }
  return rna;
};

const translateRNAtoProtein = (rna) => {
  const protein = [];
  for (let i = 0; i < rna.length - 2; i += 3) {
    const codon = rna.substring(i, i + 3);
    const aminoAcid = codonTable[codon] || '???';
    if (aminoAcid === 'Stop') break;
    protein.push(aminoAcid);
  }
  return protein;
};

const generateRandomSequence = (length) => {
  const bases = ['A', 'T', 'C', 'G'];
  let sequence = '';
  for (let i = 0; i < length; i++) {
    sequence += bases[Math.floor(Math.random() * 4)];
  }
  return sequence;
};

const generateDailyChallenge = () => {
  const today = new Date().toDateString();
  if (dailyChallengeDate === today) return dailyChallenge;
  
  const challenges = [];
  for (let i = 0; i < 3; i++) {
    const type = mutationChallengeTypes[Math.floor(Math.random() * 3)];
    const originalSequence = generateRandomSequence(12);
    let mutatedSequence = originalSequence;
    let correctAnswer = '';
    const position = Math.floor(Math.random() * originalSequence.length);
    const bases = ['A', 'T', 'C', 'G'];
    
    switch (type.type) {
      case 'substitution':
        const wrongBase = bases.filter(b => b !== originalSequence[position])[Math.floor(Math.random() * 3)];
        mutatedSequence = originalSequence.substring(0, position) + wrongBase + originalSequence.substring(position + 1);
        correctAnswer = `${position + 1}位: ${originalSequence[position]} → ${wrongBase}`;
        break;
      case 'deletion':
        mutatedSequence = originalSequence.substring(0, position) + originalSequence.substring(position + 1);
        correctAnswer = `${position + 1}位缺失: ${originalSequence[position]}`;
        break;
      case 'insertion':
        const insertBase = bases[Math.floor(Math.random() * 4)];
        mutatedSequence = originalSequence.substring(0, position) + insertBase + originalSequence.substring(position);
        correctAnswer = `${position + 1}位插入: ${insertBase}`;
        break;
    }
    
    challenges.push({
      original: originalSequence,
      mutated: mutatedSequence,
      type: type.type,
      typeName: type.name,
      correctAnswer,
      position,
      description: type.description
    });
  }
  
  dailyChallenge = {
    date: today,
    challenges,
    targetSequence: generateRandomSequence(15)
  };
  dailyChallengeDate = today;
  return dailyChallenge;
};

app.get('/api/question', (req, res) => {
  const { difficulty = 1 } = req.query;
  const len = Math.min(6 + parseInt(difficulty) * 3, 24);
  const sequence = generateRandomSequence(len);
  currentQuestion = { sequence, difficulty: parseInt(difficulty) };
  res.json(currentQuestion);
});

app.post('/api/check', (req, res) => {
  const { base, position } = req.body;
  if (!currentQuestion || position >= currentQuestion.sequence.length) {
    return res.json({ correct: false, message: '无效请求' });
  }
  const expected = getComplement(currentQuestion.sequence[position]);
  const correct = base === expected;
  res.json({ correct, expected, base });
});

app.post('/api/translate', (req, res) => {
  const { dnaSequence } = req.body;
  const rna = transcribeDNAtoRNA(dnaSequence);
  const protein = translateRNAtoProtein(rna);
  res.json({
    dna: dnaSequence,
    rna,
    protein,
    proteinLength: protein.length
  });
});

app.get('/api/diseases', (req, res) => {
  res.json(geneticDiseases);
});

app.get('/api/disease/:id', (req, res) => {
  const disease = geneticDiseases.find(d => d.id === parseInt(req.params.id));
  if (disease) {
    res.json(disease);
  } else {
    res.status(404).json({ error: '疾病信息未找到' });
  }
});

app.get('/api/mutation-challenge', (req, res) => {
  const typeIndex = Math.floor(Math.random() * 3);
  const type = mutationChallengeTypes[typeIndex];
  const originalSequence = generateRandomSequence(12);
  let mutatedSequence = originalSequence;
  let correctAnswer = '';
  const position = Math.floor(Math.random() * originalSequence.length);
  const bases = ['A', 'T', 'C', 'G'];
  
  switch (type.type) {
    case 'substitution':
      const wrongBase = bases.filter(b => b !== originalSequence[position])[Math.floor(Math.random() * 3)];
      mutatedSequence = originalSequence.substring(0, position) + wrongBase + originalSequence.substring(position + 1);
      correctAnswer = JSON.stringify({ position, original: originalSequence[position], mutated: wrongBase });
      break;
    case 'deletion':
      mutatedSequence = originalSequence.substring(0, position) + originalSequence.substring(position + 1);
      correctAnswer = JSON.stringify({ position, deleted: originalSequence[position] });
      break;
    case 'insertion':
      const insertBase = bases[Math.floor(Math.random() * 4)];
      mutatedSequence = originalSequence.substring(0, position) + insertBase + originalSequence.substring(position);
      correctAnswer = JSON.stringify({ position, inserted: insertBase });
      break;
  }
  
  res.json({
    original: originalSequence,
    mutated: mutatedSequence,
    type: type.type,
    typeName: type.name,
    position,
    correctAnswer,
    description: type.description
  });
});

app.post('/api/check-mutation', (req, res) => {
  const { userAnswer, correctAnswer } = req.body;
  const correct = JSON.stringify(userAnswer) === JSON.stringify(JSON.parse(correctAnswer));
  res.json({ correct, correctAnswer: JSON.parse(correctAnswer) });
});

app.get('/api/daily-challenge', (req, res) => {
  const challenge = generateDailyChallenge();
  res.json(challenge);
});

app.post('/api/daily-score', (req, res) => {
  const { playerName, score, completedAt, mutations } = req.body;
  const today = new Date().toDateString();
  const record = {
    id: playerRecords.length + 1,
    playerName,
    score,
    mutations,
    completedAt: completedAt || new Date().toISOString(),
    date: today
  };
  playerRecords.push(record);
  res.json({ success: true, record });
});

app.get('/api/daily-ranking', (req, res) => {
  const today = new Date().toDateString();
  const todayRecords = playerRecords
    .filter(r => r.date === today)
    .sort((a, b) => b.score - a.score || a.mutations - b.mutations)
    .slice(0, 20);
  res.json(todayRecords);
});

app.get('/api/all-ranking', (req, res) => {
  const ranking = playerRecords
    .sort((a, b) => b.score - a.score || a.mutations - b.mutations)
    .slice(0, 50);
  res.json(ranking);
});

app.post('/api/record', (req, res) => {
  const { playerName, score, mutations, level } = req.body;
  const record = {
    id: playerRecords.length + 1,
    playerName,
    score,
    mutations,
    level,
    date: new Date().toISOString()
  };
  playerRecords.push(record);
  res.json({ success: true, record });
});

app.get('/api/records', (req, res) => {
  res.json(playerRecords.sort((a, b) => b.score - a.score).slice(0, 10));
});

app.get('/api/codon-table', (req, res) => {
  res.json(codonTable);
});

app.listen(PORT, () => {
  console.log(`DNA游戏服务器运行在 http://localhost:${PORT}`);
});