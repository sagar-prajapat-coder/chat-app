import axios from "axios";

// const userData = JSON.parse(localStorage.getItem("user"));

const Api = axios.create({
  baseURL: "https://whatsapp-node-z2fc.onrender.com/api/v1/",
  headers: {
    "Content-Type": "application/json",
    // Authorization: `Bearer ${userData?.token}`,
  },
});


Api.interceptors.request.use(
  (config) => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData?.token) {
      config.headers.Authorization = `Bearer ${userData.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default Api;

