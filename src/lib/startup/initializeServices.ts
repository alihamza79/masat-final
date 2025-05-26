import ChangeStreamService from '@/lib/services/changeStreamService';
import { closeConnection } from '@/lib/db/mongodb';

let isInitialized = false;
let shutdownHandlersRegistered = false;

export async function initializeServices() {
  if (isInitialized) {
    console.log('✅ Services already initialized');
    return;
  }

  try {
    console.log('🚀 Initializing application services...');
    
    // Initialize Change Stream Service
    const changeStreamService = ChangeStreamService.getInstance();
    await changeStreamService.initialize();
    
    isInitialized = true;
    console.log('✅ All services initialized successfully');
    
    // Register shutdown handlers only once and only in server environment
    if (!shutdownHandlersRegistered && typeof process !== 'undefined' && typeof process.on === 'function') {
      registerShutdownHandlers(changeStreamService);
      shutdownHandlersRegistered = true;
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    throw error;
  }
}

function registerShutdownHandlers(changeStreamService: ChangeStreamService) {
  // Handle graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`🛑 Graceful shutdown initiated (${signal})...`);
    try {
      await changeStreamService.close();
      await closeConnection();
      console.log('✅ Services shut down gracefully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon restarts
  
  console.log('✅ Shutdown handlers registered');
}

export function getInitializationStatus() {
  return isInitialized;
} 