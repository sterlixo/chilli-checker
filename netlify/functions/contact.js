exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse form data
    const params = new URLSearchParams(event.body);
    // You can add logic here to process the form data, e.g., send an email or save to a database.
    // For now, this returns a success response.

    return {
      statusCode: 200,
      body: JSON.stringify({ success: 'Your message has been sent successfully.' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ code: false, err: 'Server error occurred.' })
    };
  }
};