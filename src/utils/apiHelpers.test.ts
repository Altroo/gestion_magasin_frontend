import axios from 'axios';
import { cookiesPoster, cookiesDeleter, fetchFileBlob, postApi } from './apiHelpers';

jest.mock('axios', () => {
	const mockPost = jest.fn();
	const mockDelete = jest.fn();
	const mockGet = jest.fn();
	const instance = {
		post: mockPost,
		delete: mockDelete,
		get: mockGet,
	};
	return {
		create: jest.fn(() => instance),
		__mockPost: mockPost,
		__mockDelete: mockDelete,
		__mockGet: mockGet,
	};
});

const mockedAxios = axios as jest.Mocked<typeof axios> & {
	__mockPost: jest.Mock;
	__mockDelete: jest.Mock;
	__mockGet: jest.Mock;
};

describe('cookiesPoster', () => {
	it('posts to the given URL and returns status', async () => {
		(mockedAxios as unknown as { __mockPost: jest.Mock }).__mockPost.mockResolvedValueOnce({ status: 200 });

		const result = await cookiesPoster('/api/cookies', { key: 'token', value: 'abc' });
		expect(result).toEqual({ status: 200 });
		expect((mockedAxios as unknown as { __mockPost: jest.Mock }).__mockPost).toHaveBeenCalledWith(
			'/api/cookies',
			{ key: 'token', value: 'abc', maxAge: 86400 },
			{ headers: { 'Content-Type': 'application/json' } },
		);
	});
});

describe('cookiesDeleter', () => {
	it('sends DELETE to the given URL and returns status', async () => {
		(mockedAxios as unknown as { __mockDelete: jest.Mock }).__mockDelete.mockResolvedValueOnce({ status: 204 });

		const result = await cookiesDeleter('/api/cookies', { key: 'token' });
		expect(result).toEqual({ status: 204 });
		expect((mockedAxios as unknown as { __mockDelete: jest.Mock }).__mockDelete).toHaveBeenCalledWith(
			'/api/cookies',
			{ data: { key: 'token' } },
		);
	});
});

describe('fetchFileBlob', () => {
	it('sends a GET with Bearer authorization and returns blob data', async () => {
		const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
		(mockedAxios as unknown as { __mockGet: jest.Mock }).__mockGet.mockResolvedValueOnce({ data: mockBlob });

		const result = await fetchFileBlob('https://example.com/file.pdf', 'my-token');
		expect(result).toBe(mockBlob);
		expect((mockedAxios as unknown as { __mockGet: jest.Mock }).__mockGet).toHaveBeenCalledWith(
			'https://example.com/file.pdf',
			{ headers: { Authorization: 'Bearer my-token' }, responseType: 'blob' },
		);
	});
});

describe('postApi', () => {
	it('calls instance.post and returns status and data', async () => {
		const mockInstance = {
			post: jest.fn().mockResolvedValueOnce({ status: 201, data: { id: 1 } }),
		} as unknown as ReturnType<typeof axios.create>;

		const result = await postApi('https://example.com/api/', mockInstance, { name: 'test' });
		expect(result).toEqual({ status: 201, data: { id: 1 } });
		expect(mockInstance.post).toHaveBeenCalledWith('https://example.com/api/', { name: 'test' });
	});

	it('works with undefined body', async () => {
		const mockInstance = {
			post: jest.fn().mockResolvedValueOnce({ status: 200, data: {} }),
		} as unknown as ReturnType<typeof axios.create>;

		const result = await postApi('https://example.com/api/', mockInstance);
		expect(result).toEqual({ status: 200, data: {} });
		expect(mockInstance.post).toHaveBeenCalledWith('https://example.com/api/', undefined);
	});
});
