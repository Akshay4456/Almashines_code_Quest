// src/apiService.js
export const fetchData = async () => {
    const apiUrl = process.env.REACT_APP_BACKEND_URL;
  
    const response = await fetch(`${apiUrl}/api/your-endpoint`, {
      method: 'GET',
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
  
    return response.json();
  };
  