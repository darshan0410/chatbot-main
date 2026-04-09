const axios = require('axios');
const FormData = require('form-data');

async function test() {
  try {
    const formData = new FormData();
    formData.append('resume', Buffer.from('test text content'), { filename: 'test.txt', contentType: 'text/plain' });

    console.log("Sending request...");
    const res = await axios.post("http://localhost:5000/api/interview/upload-resume", formData, {
      headers: formData.getHeaders()
    });
    console.log("Response:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("Error Response:", err.response.status, err.response.data);
    } else {
      console.log("Error:", err.message);
    }
  }
}

test();
