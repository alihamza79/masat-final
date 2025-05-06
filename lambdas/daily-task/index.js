/**
 * Daily task Lambda function
 * Triggered at 00:05 (5 minutes after midnight) every day
 */

exports.handler = async (event, context) => {
  try {
    console.log('Daily task Lambda function executed at:', new Date().toISOString());
    
    // Add your daily task logic here
    // For example:
    // - Data processing
    // - Cleanup operations
    // - Scheduled notifications
    // - Database maintenance
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Daily task executed successfully',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error executing daily task:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error executing daily task',
        error: error.message
      })
    };
  }
};