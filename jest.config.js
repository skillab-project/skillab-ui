module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'], // if you have one
    moduleNameMapper: {
        // Handle CSS imports (if you import CSS in JS)
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        // Handle image imports
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
    },
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest', // Ensure Babel processes your JS/JSX
    },
    // Automatically clear mock calls and instances between every test
    clearMocks: true,
};