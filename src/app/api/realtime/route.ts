import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// Keep track of active connections
const activeConnections = new Map<string, ReadableStreamDefaultController>();
const connectionsByUserId = new Map<string, Set<string>>(); // Track connections per user

// Security constants
const MAX_CONNECTIONS_PER_USER = 5; // Prevent connection spam

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Validate collections parameter
    const collectionsParam = url.searchParams.get('collections');
    const allowedCollections = ['notifications', 'features'];
    const collections = collectionsParam?.split(',').filter(c => allowedCollections.includes(c)) || ['notifications', 'features'];
    
    if (collections.length === 0) {
      return new NextResponse('Invalid collections parameter', { status: 400 });
    }
    
    // Try to get session from cookies first (normal flow)
    let session = await getServerSession(authOptions);
    let userId: string | null = null;
    let isValidated = false;
    
    // Primary authentication: Session cookies
    if (session?.user?.id) {
      userId = session.user.id;
      isValidated = true;
    } 
    // Fallback authentication: userId parameter with database validation
    else {
      const userIdParam = url.searchParams.get('userId');
      
      if (!userIdParam) {
        return new NextResponse('Authentication required', { status: 401 });
      }
      
      // Validate userId format (MongoDB ObjectId)
      if (!/^[0-9a-fA-F]{24}$/.test(userIdParam)) {
        return new NextResponse('Invalid user ID format', { status: 400 });
      }
      
      try {
        const { connectToDatabase } = await import('@/lib/db/mongodb');
        await connectToDatabase();
        
        // Import User model dynamically to avoid issues
        const { default: User } = await import('@/models/User');
        const user = await User.findById(userIdParam).select('_id email');
        
        if (!user) {
          console.warn(`🚫 Invalid user ID attempted: ${userIdParam} from IP: ${clientIP}`);
          return new NextResponse('Invalid user ID', { status: 401 });
        }
        
        userId = (user._id as any).toString();
        isValidated = true;
      } catch (error) {
        console.error('Error validating userId parameter:', error);
        return new NextResponse('Authentication error', { status: 401 });
      }
    }
    
    if (!userId || !isValidated) {
      return new NextResponse('Authentication failed', { status: 401 });
    }
    
    // Check connection limits per user
    const userConnections = connectionsByUserId.get(userId) || new Set();
    if (userConnections.size >= MAX_CONNECTIONS_PER_USER) {
      console.warn(`🚫 Connection limit exceeded for user: ${userId}`);
      return new NextResponse('Too many connections', { status: 429 });
    }
    
    // Generate unique client ID
    const clientId = uuidv4();
    
    // Track this connection for the user
    userConnections.add(clientId);
    connectionsByUserId.set(userId, userConnections);
    
    console.log(`🔐 Authenticated connection for user ${userId} from IP ${clientIP}`);
    
    // Initialize change stream service only when needed
    let changeStreamService: any = null;
    try {
      const { default: ChangeStreamService } = await import('@/lib/services/changeStreamService');
      changeStreamService = ChangeStreamService.getInstance();
      await changeStreamService.initialize();
    } catch (error) {
      console.error('Failed to initialize change stream service:', error);
      // Continue without real-time updates - graceful degradation
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Store the controller for this connection
        activeConnections.set(clientId, controller);
        
        // Send initial connection message (without sensitive data)
        const initialMessage = {
          type: 'connection',
          data: {
            clientId,
            message: changeStreamService ? 'Connected to real-time updates' : 'Connected (real-time disabled)',
            timestamp: new Date().toISOString(),
            collections: collections // Only send allowed collections
          }
        };
        
        try {
          controller.enqueue(`data: ${JSON.stringify(initialMessage)}\n\n`);
        } catch (error) {
          console.error('Error sending initial message:', error);
        }
        
        // Subscribe to change stream events only if service is available
        if (changeStreamService) {
          try {
            changeStreamService.subscribe(
              clientId,
              userId!,
              collections,
              (event: any) => {
                try {
                  // Sanitize the data before sending
                  const sanitizedData = event.fullDocument ? {
                    _id: event.fullDocument._id,
                    // Only include safe fields, exclude sensitive data
                    ...Object.fromEntries(
                      Object.entries(event.fullDocument).filter(([key]) => 
                        !['password', 'token', 'secret', 'key'].some(sensitive => 
                          key.toLowerCase().includes(sensitive)
                        )
                      )
                    )
                  } : null;
                  
                  const message = {
                    type: 'change',
                    collection: event.ns.coll,
                    operation: event.operationType,
                    data: sanitizedData,
                    timestamp: new Date().toISOString()
                  };
                  
                  controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
                } catch (error) {
                  console.error('Error sending SSE message:', error);
                }
              }
            );
          } catch (error) {
            console.error('Error subscribing client:', error);
          }
        }

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = {
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            };
            controller.enqueue(`data: ${JSON.stringify(heartbeat)}\n\n`);
          } catch (error) {
            console.error('Error sending heartbeat:', error);
            clearInterval(heartbeatInterval);
          }
        }, 30000);

        // Handle connection cleanup
        const cleanup = () => {
          clearInterval(heartbeatInterval);
          if (changeStreamService) {
            changeStreamService.unsubscribe(clientId);
          }
          activeConnections.delete(clientId);
          
          // Remove from user connections tracking
          const userConnections = connectionsByUserId.get(userId!);
          if (userConnections) {
            userConnections.delete(clientId);
            if (userConnections.size === 0) {
              connectionsByUserId.delete(userId!);
            }
          }
          
          console.log(`🔌 Connection ${clientId} cleaned up for user ${userId}`);
        };

        request.signal.addEventListener('abort', cleanup);
        
        // Also cleanup on controller close
        const originalClose = controller.close.bind(controller);
        controller.close = () => {
          cleanup();
          try {
            originalClose();
          } catch (error) {
            // Connection already closed
          }
        };
      },
      
      cancel() {
        if (changeStreamService) {
          changeStreamService.unsubscribe(clientId);
        }
        activeConnections.delete(clientId);
        
        // Remove from user connections tracking
        const userConnections = connectionsByUserId.get(userId!);
        if (userConnections) {
          userConnections.delete(clientId);
          if (userConnections.size === 0) {
            connectionsByUserId.delete(userId!);
          }
        }
      }
    });

    // Return SSE response with security headers
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'Access-Control-Allow-Origin': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'Access-Control-Allow-Credentials': 'true',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      },
    });

  } catch (error) {
    console.error('Error in realtime SSE endpoint:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Health check endpoint with authentication
export async function POST(request: NextRequest) {
  try {
    // Require authentication for health check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    let subscriptionCount = 0;
    
    try {
      const { default: ChangeStreamService } = await import('@/lib/services/changeStreamService');
      const changeStreamService = ChangeStreamService.getInstance();
      subscriptionCount = changeStreamService.getSubscriptionCount();
    } catch (error) {
      console.error('Change stream service not available for health check');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        activeConnections: activeConnections.size,
        subscriptions: subscriptionCount,
        timestamp: new Date().toISOString(),
        // Don't expose sensitive connection details
        userCount: connectionsByUserId.size
      }
    });
  } catch (error) {
    console.error('Error in realtime health check:', error);
    return NextResponse.json(
      { success: false, error: 'Health check failed' },
      { status: 500 }
    );
  }
} 