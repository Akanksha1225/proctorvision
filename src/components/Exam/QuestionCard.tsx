import React from 'react';

interface Question {
    id: number;
    text: string;
    options: string[];
}

interface QuestionCardProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    selectedAnswer: number | null;
    onSelectAnswer: (index: number) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
    question,
    questionNumber,
    totalQuestions,
    selectedAnswer,
    onSelectAnswer,
}) => {
    const optionLetters = ['A', 'B', 'C', 'D'];

    return (
        <div className="question-card">
            <div className="question-number">
                Question {questionNumber} of {totalQuestions}
            </div>
            <div className="question-text">{question.text}</div>
            <div className="options-list">
                {question.options.map((option, index) => (
                    <div
                        key={index}
                        className={`option ${selectedAnswer === index ? 'selected' : ''}`}
                        onClick={() => onSelectAnswer(index)}
                    >
                        <span className="option-letter">{optionLetters[index]}</span>
                        <span>{option}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Sample questions for demo
export const DEMO_QUESTIONS: Question[] = [
    {
        id: 1,
        text: 'What is the primary purpose of a firewall in network security?',
        options: [
            'To speed up internet connection',
            'To filter incoming and outgoing network traffic',
            'To store backup data',
            'To manage email accounts',
        ],
    },
    {
        id: 2,
        text: 'Which data structure uses LIFO (Last In, First Out) principle?',
        options: ['Queue', 'Array', 'Stack', 'Linked List'],
    },
    {
        id: 3,
        text: 'What does CPU stand for?',
        options: [
            'Central Processing Unit',
            'Computer Personal Unit',
            'Central Program Utility',
            'Core Processing Unit',
        ],
    },
    {
        id: 4,
        text: 'Which of these is NOT a programming paradigm?',
        options: [
            'Object-Oriented Programming',
            'Functional Programming',
            'Structural Programming',
            'Visual Programming',
        ],
    },
    {
        id: 5,
        text: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
    },
];
