import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
	dir: './',
});

const config: Config = {
	roots: ['<rootDir>/src'],
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	testEnvironment: 'jest-environment-jsdom',
	testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	transformIgnorePatterns: ['node_modules/(?!(next-auth|@mui|lodash-es)/)'],
	moduleDirectories: ['node_modules', '<rootDir>/'],
	collectCoverage: true,
	coverageReporters: ['text-summary', 'lcov', ['cobertura', { file: 'cobertura-coverage.xml' }]],
	coverageProvider: 'v8',
	coveragePathIgnorePatterns: ['\\\\node_modules\\\\'],
	collectCoverageFrom: [
		// include only source files
		'src/**/*.{js,jsx,ts,tsx}',
		// exclude type definitions
		'!src/**/*.d.ts',
		'!src/types/*',
		// exclude providers
		'!src/app/providers/*',
		// exclude barrel index files
		'!src/**/index.{js,ts}',
		// exclude files ending with .test.*
		'!src/**/*.test.{js,jsx,ts,tsx}',
	],
};

export default createJestConfig(config);
