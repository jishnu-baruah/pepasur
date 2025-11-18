/**
 * Connectivity checker utility for detecting server and internet connectivity
 */

export interface ConnectivityStatus {
    isOnline: boolean;
    serverReachable: boolean;
    lastChecked: number;
}

/**
 * Check if user has internet connection
 */
export function checkInternetConnection(): boolean {
    return navigator.onLine;
}

/**
 * Check if the game server is reachable
 */
export async function checkServerConnectivity(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Cache-Control': 'no-cache',
            },
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.log('🔌 Server connectivity check failed:', error);
        return false;
    }
}

/**
 * Comprehensive connectivity check
 */
export async function checkConnectivity(): Promise<ConnectivityStatus> {
    const isOnline = checkInternetConnection();
    let serverReachable = false;

    if (isOnline) {
        serverReachable = await checkServerConnectivity();
    }

    return {
        isOnline,
        serverReachable,
        lastChecked: Date.now(),
    };
}

/**
 * Check if user can leave game (either server is reachable or user is offline)
 */
export async function canLeaveGame(): Promise<{
    canLeave: boolean;
    reason: 'server_reachable' | 'user_offline' | 'server_down_but_online';
    forceLocal: boolean;
}> {
    const connectivity = await checkConnectivity();

    if (connectivity.serverReachable) {
        // Server is reachable, normal leave process
        return {
            canLeave: true,
            reason: 'server_reachable',
            forceLocal: false,
        };
    }

    if (!connectivity.isOnline) {
        // User is offline, allow local leave
        return {
            canLeave: true,
            reason: 'user_offline',
            forceLocal: true,
        };
    }

    // User is online but server is down - allow forced local leave
    return {
        canLeave: true,
        reason: 'server_down_but_online',
        forceLocal: true,
    };
}

/**
 * Monitor connectivity changes
 */
export function createConnectivityMonitor(
    onConnectivityChange: (status: ConnectivityStatus) => void
): () => void {
    let intervalId: NodeJS.Timeout;
    let isMonitoring = true;

    const checkAndNotify = async () => {
        if (!isMonitoring) return;

        const status = await checkConnectivity();
        onConnectivityChange(status);
    };

    // Initial check
    checkAndNotify();

    // Check every 10 seconds
    intervalId = setInterval(checkAndNotify, 10000);

    // Listen for online/offline events
    const handleOnline = () => checkAndNotify();
    const handleOffline = () => checkAndNotify();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
        isMonitoring = false;
        clearInterval(intervalId);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}