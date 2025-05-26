import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';

export interface ChangeStreamEvent {
  operationType: 'insert' | 'update' | 'delete' | 'replace';
  documentKey: { _id: any };
  fullDocument?: any;
  updateDescription?: {
    updatedFields: any;
    removedFields: string[];
  };
  ns: {
    db: string;
    coll: string;
  };
}

export interface ClientSubscription {
  userId: string;
  collections: string[];
  callback: (event: ChangeStreamEvent) => void;
}

class ChangeStreamService {
  private static instance: ChangeStreamService;
  private subscriptions: Map<string, ClientSubscription> = new Map();
  private changeStreams: Map<string, any> = new Map(); // Using 'any' to avoid type issues
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): ChangeStreamService {
    if (!ChangeStreamService.instance) {
      ChangeStreamService.instance = new ChangeStreamService();
    }
    return ChangeStreamService.instance;
  }

  public async initialize() {
    if (this.isInitialized) return;

    try {
      // Ensure database connection first
      await connectToDatabase();
      
      // Wait a bit for models to be properly initialized
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Initialize change streams for notifications
      await this.initializeNotificationChangeStream();
      
      // Initialize change streams for features
      await this.initializeFeatureChangeStream();
      
      this.isInitialized = true;
      console.log('✅ Change Stream Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Change Stream Service:', error);
      throw error;
    }
  }

  private async initializeNotificationChangeStream() {
    try {
      // Dynamically import the model to ensure it's properly initialized
      const { default: Notification } = await import('@/models/Notification');
      
      const notificationChangeStream = Notification.watch(
        [
          {
            $match: {
              operationType: { $in: ['insert', 'update', 'delete'] }
            }
          }
        ],
        {
          fullDocument: 'updateLookup',
          fullDocumentBeforeChange: 'whenAvailable'
        }
      );

      notificationChangeStream.on('change', (change: ChangeStreamEvent) => {
        this.handleNotificationChange(change);
      });

      notificationChangeStream.on('error', (error) => {
        console.error('Notification change stream error:', error);
        // Attempt to reconnect
        setTimeout(() => this.initializeNotificationChangeStream(), 5000);
      });

      this.changeStreams.set('notifications', notificationChangeStream);
      console.log('✅ Notification change stream initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification change stream:', error);
      throw error;
    }
  }

  private async initializeFeatureChangeStream() {
    try {
      // Dynamically import the model to ensure it's properly initialized
      const { default: Feature } = await import('@/models/Feature');
      
      const featureChangeStream = Feature.watch(
        [
          {
            $match: {
              operationType: { $in: ['insert', 'update', 'delete'] }
            }
          }
        ],
        {
          fullDocument: 'updateLookup',
          fullDocumentBeforeChange: 'whenAvailable'
        }
      );

      featureChangeStream.on('change', (change: ChangeStreamEvent) => {
        this.handleFeatureChange(change);
      });

      featureChangeStream.on('error', (error) => {
        console.error('Feature change stream error:', error);
        // Attempt to reconnect
        setTimeout(() => this.initializeFeatureChangeStream(), 5000);
      });

      this.changeStreams.set('features', featureChangeStream);
      console.log('✅ Feature change stream initialized');
    } catch (error) {
      console.error('❌ Failed to initialize feature change stream:', error);
      throw error;
    }
  }

  private handleNotificationChange(change: ChangeStreamEvent) {
    try {
      const { operationType, fullDocument } = change;
      
      if (!fullDocument) return;

      // Notify all subscribed clients for this user
      const userId = fullDocument.userId?.toString();
      if (!userId) return;

      this.subscriptions.forEach((subscription, clientId) => {
        if (subscription.userId === userId && 
            subscription.collections.includes('notifications')) {
          try {
            subscription.callback({
              ...change,
              ns: { ...change.ns, coll: 'notifications' }
            });
          } catch (error) {
            console.error(`Error notifying client ${clientId}:`, error);
            // Remove failed subscription
            this.subscriptions.delete(clientId);
          }
        }
      });

      console.log(`📢 Notification ${operationType} event processed for user ${userId}`);
    } catch (error) {
      console.error('Error handling notification change:', error);
    }
  }

  private handleFeatureChange(change: ChangeStreamEvent) {
    try {
      const { operationType } = change;
      
      // Notify all subscribed clients (features are global)
      this.subscriptions.forEach((subscription, clientId) => {
        if (subscription.collections.includes('features')) {
          try {
            subscription.callback({
              ...change,
              ns: { ...change.ns, coll: 'features' }
            });
          } catch (error) {
            console.error(`Error notifying client ${clientId}:`, error);
            // Remove failed subscription
            this.subscriptions.delete(clientId);
          }
        }
      });

      console.log(`📢 Feature ${operationType} event processed`);
    } catch (error) {
      console.error('Error handling feature change:', error);
    }
  }

  public subscribe(clientId: string, userId: string, collections: string[], callback: (event: ChangeStreamEvent) => void) {
    this.subscriptions.set(clientId, {
      userId,
      collections,
      callback
    });

    console.log(`✅ Client ${clientId} subscribed to ${collections.join(', ')} for user ${userId}`);
  }

  public unsubscribe(clientId: string) {
    const removed = this.subscriptions.delete(clientId);
    if (removed) {
      console.log(`✅ Client ${clientId} unsubscribed`);
    }
  }

  public getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  public async close() {
    // Close all change streams - using Array.from to fix iteration issue
    const streamEntries = Array.from(this.changeStreams.entries());
    for (const [name, stream] of streamEntries) {
      try {
        if (stream && typeof stream.close === 'function') {
          await stream.close();
          console.log(`✅ Closed ${name} change stream`);
        }
      } catch (error) {
        console.error(`❌ Error closing ${name} change stream:`, error);
      }
    }

    // Clear subscriptions
    this.subscriptions.clear();
    this.changeStreams.clear();
    this.isInitialized = false;
    
    console.log('✅ Change Stream Service closed');
  }
}

export default ChangeStreamService; 