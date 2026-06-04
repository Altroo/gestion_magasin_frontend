import axios, { type AxiosInstance } from 'axios';

// POST Next api/cookies
export const cookiesPoster = async (url: string, body: object) => {
	const instance = axios.create();
	const response = await instance.post(
		url,
		{ ...body, maxAge: 86400 },
		{ headers: { 'Content-Type': 'application/json' } },
	);
	return { status: response.status };
};

// DELETE Next api/cookies
export const cookiesDeleter = async (url: string, body: object) => {
	const instance = axios.create();
	const response = await instance.delete(url, { data: body });
	return { status: response.status };
};

/*** Fetch a PDF or DOCX blob via GET with Bearer auth token */
export const fetchFileBlob = async (url: string, accessToken: string): Promise<Blob> => {
	const instance = axios.create();
	const response = await instance.get<Blob>(url, {
		headers: { Authorization: `Bearer ${accessToken}` },
		responseType: 'blob',
	});
	return response.data;
};

/*** Base Axios JSON API call [POST] */
export const postApi = async (url: string | undefined, instance: AxiosInstance, body?: object) => {
	const response = await instance.post(`${url}`, body);
	return {
		status: response.status,
		data: response.data,
	};
};

/*** Base Axios JSON API call [GET] */
export const getApi = async (url: string | undefined, instance: AxiosInstance, queryParams?: object) => {
	const response = await instance.get(`${url}`, { params: queryParams });
	return {
		status: response.status,
		data: response.data,
	};
};
