import axios from 'axios';

const axiosServices = axios.create();

// interceptor for http
axiosServices.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log auth errors
        if (error.response && error.response.status === 401) {
            console.error('Authentication error:', error.response.data);
            // Don't redirect automatically
        }
        return Promise.reject((error.response && error.response.data) || 'Wrong Services');
    }
);

export default axiosServices;
 