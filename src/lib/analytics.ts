export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

class Analytics {
  private enabled: boolean = true;
  private userId: string | null = null;

  init(userId: string) {
    this.userId = userId;
    this.track('app_initialized');
  }

  identify(userId: string, traits?: Record<string, any>) {
    this.userId = userId;

    if (!this.enabled) return;

    console.log('[Analytics] Identify:', { userId, traits });
  }

  track(eventName: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        userId: this.userId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      timestamp: Date.now(),
    };

    console.log('[Analytics] Track:', event);

    this.sendToBackend(event);
  }

  page(pageName: string, properties?: Record<string, any>) {
    this.track('page_view', {
      page: pageName,
      ...properties,
    });
  }

  private async sendToBackend(event: AnalyticsEvent) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('[Analytics] Error sending event:', error);
    }
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}

export const analytics = new Analytics();

export function trackEvent(name: string, properties?: Record<string, any>) {
  analytics.track(name, properties);
}

export function trackPageView(pageName: string, properties?: Record<string, any>) {
  analytics.page(pageName, properties);
}

export const AnalyticsEvents = {
  USER_REGISTERED: 'user_registered',
  USER_LOGIN: 'user_login',
  POST_CREATED: 'post_created',
  POST_LIKED: 'post_liked',
  POST_SHARED: 'post_shared',
  COMMENT_CREATED: 'comment_created',
  MESSAGE_SENT: 'message_sent',
  PROFILE_UPDATED: 'profile_updated',
  PROFILE_VIEWED: 'profile_viewed',
  SEARCH_PERFORMED: 'search_performed',
  GROUP_CREATED: 'group_created',
  GROUP_JOINED: 'group_joined',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  ERROR_OCCURRED: 'error_occurred',
} as const;
