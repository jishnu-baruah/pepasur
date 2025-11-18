class TaskManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
    }

    generateTask() {
        const taskTypes = ['memory_words', 'memory_number', 'captcha', 'math'];
        const type = taskTypes[Math.floor(Math.random() * taskTypes.length)];

        switch (type) {
            case 'memory_words':
                return {
                    type: 'memory_words',
                    data: this.generateMemoryWordsTask(),
                    submissions: {}
                };
            case 'memory_number':
                return {
                    type: 'memory_number',
                    data: this.generateMemoryNumberTask(),
                    submissions: {}
                };
            case 'captcha':
                return {
                    type: 'captcha',
                    data: this.generateCaptchaTask(),
                    submissions: {}
                };
            case 'math':
                return {
                    type: 'math',
                    data: this.generateMathTask(),
                    submissions: {}
                };
        }
    }

    generateMemoryWordsTask() {
        const wordList = [
            'apple', 'banana', 'cherry', 'dragon', 'elephant', 'fire', 'green', 'house',
            'ice', 'jungle', 'king', 'lion', 'moon', 'ninja', 'ocean', 'pizza',
            'queen', 'robot', 'star', 'tiger', 'unicorn', 'volcano', 'wizard', 'xray'
        ];

        const words = [];
        const usedIndices = new Set();

        // Get 3 unique random words
        while (words.length < 3) {
            const randomIndex = Math.floor(Math.random() * wordList.length);
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex);
                words.push(wordList[randomIndex]);
            }
        }

        return { words };
    }

    generateMemoryNumberTask() {
        const number = Math.floor(10000 + Math.random() * 90000).toString();
        return { number };
    }

    generateCaptchaTask() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let captcha = '';

        for (let i = 0; i < 5; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return { captcha };
    }

    generateMathTask() {
        const num1 = Math.floor(Math.random() * 50) + 1;
        const num2 = Math.floor(Math.random() * 50) + 1;
        const operators = ['+', '-', '*'];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        const equation = `${num1} ${operator} ${num2}`;

        return { equation };
    }

    submitTaskAnswer(gameId, data) {
        const game = this.gameManager.getGame(gameId);
        if (!game || game.phase !== 'task') {
            throw new Error('Invalid game phase');
        }

        const { playerAddress, answer } = data;

        // Check if this player has already submitted for this task
        if (game.task.submissions[playerAddress] !== undefined) {
            console.log(`⚠️ Player ${playerAddress} already submitted for task ${game.task.id}`);
            return { correct: this.validateTaskAnswer(game.task, answer) };
        }

        game.task.submissions[playerAddress] = answer;

        // Check if answer is correct
        const correct = this.validateTaskAnswer(game.task, answer);

        // Initialize task counts if not exists
        if (!game.taskCounts) {
            game.taskCounts = {};
        }
        if (!game.taskCounts[playerAddress]) {
            game.taskCounts[playerAddress] = 0;
        }

        // Update task count based on result
        if (correct) {
            game.taskCounts[playerAddress] += 1;
        } else {
            game.taskCounts[playerAddress] = Math.max(0, game.taskCounts[playerAddress] - 1);
        }

        // Send task result announcement via socket
        if (this.gameManager.socketManager) {
            // Emit task result update (for task count updates)
            this.gameManager.socketManager.emitTaskResult(gameId, {
                playerAddress,
                isSuccess: correct,
                taskCount: game.taskCounts[playerAddress]
            });

            // Send task announcement to chat
            this.gameManager.socketManager.sendTaskAnnouncement(gameId, playerAddress, correct, game);
        }

        console.log(`📊 Task result for ${playerAddress}: ${correct ? 'SUCCESS' : 'FAILURE'}, count: ${game.taskCounts[playerAddress]}`);

        // Check win conditions after task completion (task-based wins should be immediate)
        if (this.gameManager.phaseManager.checkWinConditions(game)) {
            console.log(`🎯 Game ending due to task completion win condition`);
            // End game immediately - don't transition to voting
            setTimeout(() => this.gameManager.endGame(gameId), 1000); // Small delay to let frontend update
            return { correct, gameComplete: true };
        }

        // Check if all players submitted
        const activePlayers = game.players.filter(p => !game.eliminated.includes(p));
        const submittedCount = Object.keys(game.task.submissions).length;

        if (submittedCount >= activePlayers.length) {
            // Move to voting phase
            this.gameManager.resolveTaskPhase(gameId);
        }

        return { correct, gameComplete: false };
    }

    validateTaskAnswer(task, answer) {
        switch (task.type) {
            case 'memory_words':
                // Answer should be space-separated words in correct order
                const expectedWords = task.data.words.join(' ').toLowerCase();
                const userAnswer = answer.toLowerCase().trim();
                return expectedWords === userAnswer;

            case 'memory_number':
                // Answer should be exact 5-digit number
                return task.data.number === answer.trim();

            case 'captcha':
                // Answer should match captcha (case-insensitive)
                return task.data.captcha.toLowerCase() === answer.toLowerCase().trim();

            case 'math':
                // Evaluate the equation and check if answer matches
                try {
                    const equation = task.data.equation;
                    const expectedResult = eval(equation); // Safe since we control the equation format
                    const userAnswer = parseInt(answer.trim());
                    return expectedResult === userAnswer;
                } catch (error) {
                    console.error('Error evaluating math equation:', error);
                    return false;
                }

            default:
                return false;
        }
    }
}

module.exports = TaskManager;


