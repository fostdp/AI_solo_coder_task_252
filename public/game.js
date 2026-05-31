class DNAGame {
    constructor() {
        this.score = 0;
        this.mutations = 0;
        this.lives = 3;
        this.level = 1;
        this.currentSequence = '';
        this.currentPosition = 0;
        this.pairedBases = [];
        this.isPlaying = false;
        this.isProcessing = false;
        this.isPaused = false;
        this.rotationOffset = 0;
        
        this.correctMutations = 0;
        this.totalMutations = 0;
        
        this.diseases = [];
        this.dailyChallenge = null;
        
        this.initElements();
        this.initEventListeners();
        this.loadInitialData();
    }

    initElements() {
        this.helixElement = document.getElementById('helix');
        this.targetSequenceElement = document.getElementById('target-sequence');
        this.progressText = document.getElementById('progress-text');
        this.progressFill = document.getElementById('progress-fill');
        this.scoreElement = document.getElementById('score');
        this.mutationsElement = document.getElementById('mutations');
        this.livesElement = document.getElementById('lives');
        this.levelElement = document.getElementById('level');
        this.baseButtons = document.querySelectorAll('.base-btn');
        
        this.gameOverModal = document.getElementById('game-over-modal');
        this.diseaseDetailModal = document.getElementById('disease-detail');
    }

    initEventListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.switchTab(item.dataset.tab));
        });

        this.baseButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isPlaying && !this.isPaused) {
                    this.selectBase(e.target.closest('.base-btn').dataset.base);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (!this.isPlaying || this.isPaused) return;
            const key = e.key.toUpperCase();
            if (['A', 'T', 'C', 'G'].includes(key)) {
                this.selectBase(key);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isPaused = true;
            } else {
                this.isPaused = false;
            }
        });

        document.getElementById('generate-dna')?.addEventListener('click', () => {
            const sequence = this.generateRandomSequence(24);
            document.getElementById('dna-input').value = sequence;
        });

        document.getElementById('translate-btn')?.addEventListener('click', () => {
            const dna = document.getElementById('dna-input').value.toUpperCase();
            this.translateDNA(dna);
        });

        document.getElementById('new-challenge')?.addEventListener('click', () => {
            this.loadMutationChallenge();
        });

        document.getElementById('submit-mutation')?.addEventListener('click', () => {
            this.checkMutationAnswer();
        });

        document.querySelectorAll('.ranking-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.ranking-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadRanking(btn.dataset.rank);
            });
        });

        document.getElementById('submit-score-btn')?.addEventListener('click', () => {
            this.submitPlayerScore();
        });

        document.getElementById('start-daily')?.addEventListener('click', () => {
            this.startDailyChallenge();
        });

        document.getElementById('restart-game')?.addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('save-game-score')?.addEventListener('click', () => {
            this.saveGameScore();
        });

        document.getElementById('close-detail')?.addEventListener('click', () => {
            this.diseaseDetailModal.style.display = 'none';
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterDiseases(btn.dataset.filter);
            });
        });
    }

    async loadInitialData() {
        await this.loadDiseases();
        await this.loadDailyChallenge();
        await this.loadRanking('daily');
        await this.startGame();
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        if (tabName === 'mutation' && !this.currentMutationChallenge) {
            this.loadMutationChallenge();
        }
    }

    async startGame() {
        this.isPlaying = true;
        await this.loadNewSequence();
    }

    restartGame() {
        this.score = 0;
        this.mutations = 0;
        this.lives = 3;
        this.level = 1;
        this.currentPosition = 0;
        this.pairedBases = [];
        this.isProcessing = false;
        this.gameOverModal.style.display = 'none';
        this.updateStats();
        this.isPlaying = true;
        this.loadNewSequence();
    }

    async loadNewSequence() {
        try {
            const response = await fetch(`/api/question?difficulty=${this.level}`);
            const data = await response.json();
            this.currentSequence = data.sequence;
            this.currentPosition = 0;
            this.pairedBases = [];
            this.renderSequence();
            this.renderHelix();
        } catch (error) {
            console.error('加载题目失败:', error);
            const sequence = this.generateRandomSequence(Math.min(6 + this.level * 2, 24));
            this.currentSequence = sequence;
            this.currentPosition = 0;
            this.pairedBases = [];
            this.renderSequence();
            this.renderHelix();
        }
    }

    generateRandomSequence(length) {
        const bases = ['A', 'T', 'C', 'G'];
        let sequence = '';
        for (let i = 0; i < length; i++) {
            sequence += bases[Math.floor(Math.random() * 4)];
        }
        return sequence;
    }

    renderSequence() {
        if (!this.targetSequenceElement) return;
        
        this.targetSequenceElement.innerHTML = '';
        for (let i = 0; i < this.currentSequence.length; i++) {
            const base = this.currentSequence[i];
            const baseElement = document.createElement('div');
            baseElement.className = `base ${this.getBaseClass(base)}`;
            if (i === this.currentPosition) {
                baseElement.classList.add('current');
            } else if (i < this.currentPosition) {
                baseElement.classList.add('matched');
            }
            baseElement.textContent = base;
            this.targetSequenceElement.appendChild(baseElement);
        }
        
        const progress = (this.currentPosition / this.currentSequence.length) * 100;
        this.progressText.textContent = `进度: ${this.currentPosition}/${this.currentSequence.length}`;
        this.progressFill.style.width = `${progress}%`;
    }

    renderHelix() {
        if (!this.helixElement) return;
        
        this.helixElement.innerHTML = '';
        const totalPairs = Math.max(this.currentSequence.length, this.pairedBases.length + 4);
        const spacing = 380 / totalPairs;
        
        for (let i = 0; i < totalPairs; i++) {
            const pairElement = document.createElement('div');
            pairElement.className = 'base-pair';
            pairElement.style.top = `${i * spacing}px`;
            
            const rotation = (i * 36 + this.rotationOffset) % 360;
            const zOffset = Math.sin(rotation * Math.PI / 180) * 60;
            pairElement.style.transform = `rotateY(${rotation}deg) translateZ(${zOffset}px)`;
            
            let leftBase, rightBase;
            if (i < this.pairedBases.length) {
                leftBase = this.currentSequence[i];
                rightBase = this.pairedBases[i];
            } else {
                const bases = ['A', 'T', 'C', 'G'];
                leftBase = bases[Math.floor(Math.random() * 4)];
                rightBase = this.getComplement(leftBase);
            }
            
            pairElement.innerHTML = `
                <div class="base-left ${this.getBaseClass(leftBase)}">${leftBase}</div>
                <div class="base-connector"></div>
                <div class="base-right ${this.getBaseClass(rightBase)}">${rightBase}</div>
            `;
            
            this.helixElement.appendChild(pairElement);
        }
    }

    getComplement(base) {
        const complements = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
        return complements[base];
    }

    getBaseClass(base) {
        const classes = {
            'A': 'adenine',
            'T': 'thymine',
            'C': 'cytosine',
            'G': 'guanine'
        };
        return classes[base];
    }

    async selectBase(base) {
        if (!this.isPlaying || this.isPaused || this.isProcessing || this.currentPosition >= this.currentSequence.length) return;
        
        this.isProcessing = true;
        
        const expected = this.getComplement(this.currentSequence[this.currentPosition]);
        const correct = base === expected;
        
        if (correct) {
            this.handleCorrect(base);
        } else {
            this.handleIncorrect();
        }
        
        setTimeout(() => {
            this.isProcessing = false;
        }, 300);
    }

    handleCorrect(base) {
        this.pairedBases.push(base);
        this.currentPosition++;
        this.score += 10 * this.level;
        this.updateStats();
        this.renderSequence();
        this.triggerRiseAnimation();
        
        if (this.currentPosition >= this.currentSequence.length) {
            setTimeout(() => this.levelUp(), 600);
        }
    }

    handleIncorrect() {
        if (this.isPaused) return;
        this.mutations++;
        this.lives--;
        this.updateStats();
        this.triggerShakeAnimation();
        
        if (this.lives <= 0) {
            setTimeout(() => this.gameOver(), 600);
        }
    }

    triggerRiseAnimation() {
        this.helixElement.classList.remove('shake');
        this.helixElement.classList.add('rise');
        this.rotationOffset = (this.rotationOffset + 180) % 360;
        setTimeout(() => {
            this.helixElement.classList.remove('rise');
            this.rotationOffset = 0;
            this.renderHelix();
        }, 600);
    }

    triggerShakeAnimation() {
        this.helixElement.classList.remove('rise');
        this.helixElement.classList.add('shake');
        setTimeout(() => {
            this.helixElement.classList.remove('shake');
        }, 600);
    }

    levelUp() {
        this.level++;
        this.currentPosition = 0;
        this.pairedBases = [];
        this.updateStats();
        this.loadNewSequence();
    }

    gameOver() {
        this.isPlaying = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-mutations').textContent = this.mutations;
        document.getElementById('final-level').textContent = this.level;
        this.gameOverModal.style.display = 'flex';
    }

    async saveGameScore() {
        const playerName = document.getElementById('game-over-name').value.trim() || '匿名玩家';
        try {
            await fetch('/api/daily-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    score: this.score,
                    mutations: this.mutations
                })
            });
            document.getElementById('save-game-score').textContent = '已保存!';
            document.getElementById('save-game-score').disabled = true;
        } catch (error) {
            console.error('保存成绩失败:', error);
        }
    }

    updateStats() {
        if (this.scoreElement) this.scoreElement.textContent = this.score;
        if (this.mutationsElement) this.mutationsElement.textContent = this.mutations;
        if (this.livesElement) this.livesElement.textContent = '❤️'.repeat(this.lives) + '🖤'.repeat(Math.max(0, 3 - this.lives));
        if (this.levelElement) this.levelElement.textContent = this.level;
    }

    translateDNA(dna) {
        const purified = dna.replace(/[^ATCG]/g, '');
        let rna = '';
        for (let i = 0; i < purified.length; i++) {
            if (purified[i] === 'T') {
                rna += 'U';
            } else {
                rna += purified[i];
            }
        }

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

        const protein = [];
        for (let i = 0; i < rna.length - 2; i += 3) {
            const codon = rna.substring(i, i + 3);
            const aminoAcid = codonTable[codon] || '???';
            if (aminoAcid === 'Stop') break;
            protein.push({ codon, aminoAcid });
        }

        document.getElementById('rna-output').textContent = rna || '-';
        
        const proteinOutput = document.getElementById('protein-output');
        if (protein.length === 0) {
            proteinOutput.innerHTML = '<span style="color: #888;">无有效氨基酸序列</span>';
        } else {
            proteinOutput.innerHTML = protein.map(p => 
                `<div class="amino-acid">${p.aminoAcid}<br><small>${p.codon}</small></div>`
            ).join('');
        }

        document.getElementById('amino-count').textContent = protein.length;
        document.getElementById('codon-count').textContent = Math.floor(rna.length / 3);

        const codonList = document.getElementById('codon-table');
        if (protein.length > 0) {
            codonList.innerHTML = Object.entries(codonTable)
                .filter(([k]) => k.length === 3)
                .slice(0, 16)
                .map(([codon, aa]) => `
                    <div class="codon-item">
                        <span class="codon">${codon}</span> → ${aa}
                    </div>
                `).join('');
        }
    }

    async loadMutationChallenge() {
        try {
            const response = await fetch('/api/mutation-challenge');
            const challenge = await response.json();
            this.currentMutationChallenge = challenge;
            this.renderMutationChallenge(challenge);
        } catch (error) {
            console.error('加载突变挑战失败:', error);
        }
    }

    renderMutationChallenge(challenge) {
        const typeMap = {
            'substitution': '碱基置换',
            'deletion': '碱基缺失',
            'insertion': '碱基插入'
        };
        const hintMap = {
            'substitution': '找出被替换的碱基位置',
            'deletion': '找出缺失的碱基位置',
            'insertion': '找出插入的碱基位置'
        };

        document.getElementById('challenge-type').textContent = typeMap[challenge.type];
        document.getElementById('challenge-hint').textContent = hintMap[challenge.type];
        
        const originalEl = document.getElementById('original-sequence');
        originalEl.innerHTML = challenge.original.split('').map((b, i) => 
            `<span class="base ${this.getBaseClass(b)}">${b}</span>`
        ).join('');

        const mutatedEl = document.getElementById('mutated-sequence');
        mutatedEl.innerHTML = challenge.mutated.split('').map((b, i) => 
            `<span class="base ${this.getBaseClass(b)}">${b}</span>`
        ).join('');

        document.getElementById('mutation-position').value = '';
        document.getElementById('mutation-type-select').value = challenge.type;
        document.getElementById('mutation-result').className = 'result-feedback';
        document.getElementById('mutation-result').textContent = '';
    }

    checkMutationAnswer() {
        const userPosition = parseInt(document.getElementById('mutation-position').value);
        const userType = document.getElementById('mutation-type-select').value;
        const challenge = this.currentMutationChallenge;

        if (!userPosition) {
            this.showMutationResult(false, '请输入位置');
            return;
        }

        const correctPosition = challenge.position + 1;
        const correctType = challenge.type;
        
        const isCorrect = userPosition === correctPosition && userType === correctType;

        this.totalMutations++;
        if (isCorrect) {
            this.correctMutations++;
        }

        this.updateMutationStats();
        
        if (isCorrect) {
            this.showMutationResult(true, `正确! 突变发生在位置 ${correctPosition}`);
            setTimeout(() => this.loadMutationChallenge(), 2000);
        } else {
            this.showMutationResult(false, `错误! 正确答案是位置 ${correctPosition} 的 ${correctType === 'substitution' ? '碱基置换' : correctType === 'deletion' ? '碱基缺失' : '碱基插入'}`);
        }
    }

    showMutationResult(correct, message) {
        const resultEl = document.getElementById('mutation-result');
        resultEl.className = `result-feedback ${correct ? 'correct' : 'incorrect'}`;
        resultEl.textContent = message;
    }

    updateMutationStats() {
        document.getElementById('correct-mutations').textContent = this.correctMutations;
        document.getElementById('total-mutations').textContent = this.totalMutations;
        const accuracy = this.totalMutations > 0 ? Math.round((this.correctMutations / this.totalMutations) * 100) : 0;
        document.getElementById('mutation-accuracy').textContent = `${accuracy}%`;
    }

    async loadDiseases() {
        try {
            const response = await fetch('/api/diseases');
            this.diseases = await response.json();
            this.renderDiseases(this.diseases);
        } catch (error) {
            console.error('加载疾病数据失败:', error);
        }
    }

    renderDiseases(diseaseList) {
        const container = document.getElementById('disease-list');
        if (!container) return;

        container.innerHTML = diseaseList.map(disease => `
            <div class="disease-card" data-id="${disease.id}">
                <h3>${disease.name}</h3>
                <div class="gene">🧬 ${disease.gene}</div>
                <div class="chromosome">📍 ${disease.chromosome}</div>
                <div class="desc">${disease.description}</div>
            </div>
        `).join('');

        container.querySelectorAll('.disease-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showDiseaseDetail(parseInt(card.dataset.id));
            });
        });
    }

    filterDiseases(filter) {
        let filtered = this.diseases;
        if (filter === 'autosomal') {
            filtered = this.diseases.filter(d => d.chromosome.includes('号染色体') && !d.chromosome.includes('X'));
        } else if (filter === 'x-linked') {
            filtered = this.diseases.filter(d => d.chromosome.includes('X'));
        }
        this.renderDiseases(filtered);
    }

    showDiseaseDetail(id) {
        const disease = this.diseases.find(d => d.id === id);
        if (!disease) return;

        document.getElementById('detail-name').textContent = disease.name;
        document.getElementById('detail-gene').textContent = disease.gene;
        document.getElementById('detail-chromosome').textContent = disease.chromosome;
        document.getElementById('detail-mutation').textContent = disease.mutation;
        document.getElementById('detail-frequency').textContent = disease.frequency;
        document.getElementById('detail-description').textContent = disease.description;
        
        const symptomsList = document.getElementById('detail-symptoms');
        symptomsList.innerHTML = disease.symptoms.map(s => `<li>${s}</li>`).join('');

        this.diseaseDetailModal.style.display = 'flex';
    }

    async loadDailyChallenge() {
        try {
            const response = await fetch('/api/daily-challenge');
            const challenge = await response.json();
            this.dailyChallenge = challenge;
            document.getElementById('daily-target').textContent = challenge.targetSequence;
        } catch (error) {
            console.error('加载每日挑战失败:', error);
        }
    }

    startDailyChallenge() {
        if (this.dailyChallenge) {
            this.currentSequence = this.dailyChallenge.targetSequence;
            this.currentPosition = 0;
            this.pairedBases = [];
            this.level = 5;
            this.isPlaying = true;
            this.renderSequence();
            this.renderHelix();
            document.querySelectorAll('.nav-item')[0].click();
        }
    }

    async loadRanking(type = 'daily') {
        try {
            const endpoint = type === 'daily' ? '/api/daily-ranking' : '/api/all-ranking';
            const response = await fetch(endpoint);
            const records = await response.json();
            this.renderRanking(records);
        } catch (error) {
            console.error('加载排行榜失败:', error);
            this.renderRanking([]);
        }
    }

    renderRanking(records) {
        const body = document.getElementById('ranking-body');
        if (!body) return;

        if (records.length === 0) {
            body.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">暂无记录</div>';
            return;
        }

        body.innerHTML = records.map((record, index) => `
            <div class="ranking-row">
                <span class="rank rank-${index + 1}">${index + 1}</span>
                <span class="player-name">${record.playerName}</span>
                <span class="score">${record.score}</span>
                <span class="mutation-count">${record.mutations || 0}</span>
            </div>
        `).join('');
    }

    async submitPlayerScore() {
        const playerName = document.getElementById('player-name-input').value.trim() || '匿名玩家';
        try {
            await fetch('/api/daily-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    score: this.score,
                    mutations: this.mutations
                })
            });
            document.getElementById('player-name-input').value = '';
            this.loadRanking('daily');
        } catch (error) {
            console.error('提交成绩失败:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DNAGame();
});
