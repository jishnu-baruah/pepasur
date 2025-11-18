/**
 * Fullscreen manager utility for enhanced gaming experience
 */

export interface FullscreenState {
    isFullscreen: boolean;
    isSupported: boolean;
}

/**
 * Check if fullscreen API is supported
 */
export function isFullscreenSupported(): boolean {
    return !!(
        document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled
    );
}

/**
 * Check if currently in fullscreen mode
 */
export function isFullscreen(): boolean {
    return !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
    );
}

/**
 * Request fullscreen mode
 */
export async function requestFullscreen(element?: HTMLElement): Promise<boolean> {
    try {
        const targetElement = element || document.documentElement;

        if (targetElement.requestFullscreen) {
            await targetElement.requestFullscreen();
        } else if ((targetElement as any).webkitRequestFullscreen) {
            await (targetElement as any).webkitRequestFullscreen();
        } else if ((targetElement as any).mozRequestFullScreen) {
            await (targetElement as any).mozRequestFullScreen();
        } else if ((targetElement as any).msRequestFullscreen) {
            await (targetElement as any).msRequestFullscreen();
        } else {
            return false;
        }

        return true;
    } catch (error) {
        console.log('🖥️ Fullscreen request failed:', error);
        return false;
    }
}

/**
 * Exit fullscreen mode
 */
export async function exitFullscreen(): Promise<boolean> {
    try {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
        } else {
            return false;
        }

        return true;
    } catch (error) {
        console.log('🖥️ Exit fullscreen failed:', error);
        return false;
    }
}

/**
 * Toggle fullscreen mode
 */
export async function toggleFullscreen(element?: HTMLElement): Promise<boolean> {
    if (isFullscreen()) {
        return await exitFullscreen();
    } else {
        return await requestFullscreen(element);
    }
}

/**
 * Create fullscreen state monitor
 */
export function createFullscreenMonitor(
    onFullscreenChange: (state: FullscreenState) => void
): () => void {
    const handleFullscreenChange = () => {
        const state: FullscreenState = {
            isFullscreen: isFullscreen(),
            isSupported: isFullscreenSupported(),
        };
        onFullscreenChange(state);
    };

    // Listen for fullscreen change events across browsers
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Initial state
    handleFullscreenChange();

    // Return cleanup function
    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
}

/**
 * Auto-request fullscreen when user interacts with the game
 * (browsers require user interaction to request fullscreen)
 */
export function createAutoFullscreenTrigger(
    shouldTrigger: () => boolean,
    element?: HTMLElement
): () => void {
    let hasTriggered = false;

    const handleUserInteraction = async () => {
        if (hasTriggered || !shouldTrigger() || isFullscreen()) {
            return;
        }

        // Only trigger on significant interactions (not just mouse movement)
        const success = await requestFullscreen(element);
        if (success) {
            hasTriggered = true;
            console.log('🖥️ Auto-triggered fullscreen mode');
        }
    };

    // Listen for user interactions that can trigger fullscreen
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
        document.addEventListener(event, handleUserInteraction, { once: false });
    });

    // Return cleanup function
    return () => {
        events.forEach(event => {
            document.removeEventListener(event, handleUserInteraction);
        });
    };
}

/**
 * Request fullscreen with user-friendly prompt
 */
export async function requestFullscreenWithPrompt(
    message: string = "Press F11 or click to enter fullscreen for the best gaming experience"
): Promise<boolean> {
    if (!isFullscreenSupported()) {
        console.log('🖥️ Fullscreen not supported');
        return false;
    }

    if (isFullscreen()) {
        console.log('🖥️ Already in fullscreen');
        return true;
    }

    // Show a subtle prompt
    const shouldRequest = confirm(message);
    if (shouldRequest) {
        return await requestFullscreen();
    }

    return false;
}