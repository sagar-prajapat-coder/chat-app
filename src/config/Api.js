import axios from "axios";

const userData = JSON.parse(localStorage.getItem("user"));

const Api = axios.create({
  baseURL: "http://localhost:4001/api/v1/",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${userData?.token}`,
  },
});

export default Api;
