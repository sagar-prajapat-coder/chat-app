import axios from "axios";

const token = JSON.parse(localStorage.getItem("user"))?.token;

const Api = axios.create({
  baseURL: "http://localhost:4001/api/v1/",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

export default Api;
