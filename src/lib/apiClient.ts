import axios from "axios";

/** Single client: always send cookies (needed for cross-origin in some setups). */
const apiClient = axios.create({
  withCredentials: true,
});

export default apiClient;
