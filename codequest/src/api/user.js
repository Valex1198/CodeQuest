import axios from "axios";

const API_URL = "http://localhost:8000/api";

export const registerUser = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      name,
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error(error.response.data);
    return { error: error.response.data };
  }
};
