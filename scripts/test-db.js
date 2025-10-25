const mongoose = require('mongoose');
require('dotenv').config();

// Test MongoDB connection
async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    
    // Test creating a sample log
    const ContractCheckLog = mongoose.model('ContractCheckLog', {
      userId: 'test@example.com',
      promptVersion: 'v1.0',
      contractTypeDetected: 'Test Contract',
      inputContract: 'This is a test contract for database testing.',
      outputIssues: [
        { title: 'Missing Payment Terms', explanation: 'No clear payment schedule defined' }
      ],
      outputRecommendations: [
        { name: 'Payment Terms', reason: 'Clarify payment schedule', draft: 'Payment shall be made within 30 days of invoice.' }
      ],
      outputImprovedContract: 'IMPROVED CONTRACT\n\nThis is an improved version of the test contract.',
      createdAt: new Date()
    });
    
    const sampleLog = await ContractCheckLog.create({
      userId: 'test@example.com',
      promptVersion: 'v1.0',
      contractTypeDetected: 'Test Contract',
      inputContract: 'This is a test contract for database testing.',
      outputIssues: [
        { title: 'Missing Payment Terms', explanation: 'No clear payment schedule defined' }
      ],
      outputRecommendations: [
        { name: 'Payment Terms', reason: 'Clarify payment schedule', draft: 'Payment shall be made within 30 days of invoice.' }
      ],
      outputImprovedContract: 'IMPROVED CONTRACT\n\nThis is an improved version of the test contract.'
    });
    
    console.log('✅ Sample log created successfully!');
    console.log('Sample log ID:', sampleLog._id);
    
    // Clean up
    await ContractCheckLog.findByIdAndDelete(sampleLog._id);
    console.log('✅ Sample log cleaned up');
    
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

testConnection(); 