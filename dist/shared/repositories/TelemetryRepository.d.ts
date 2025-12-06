/**
 * Telemetry Repository
 * Handles telemetry event logging in MongoDB
 */
export type TelemetryEventType = 'FEATURE_ACTIVATED' | 'FEATURE_DEACTIVATED' | 'FEATURE_USED' | 'ERROR' | 'STATE_CHANGE';
export interface TelemetryEvent {
    vehicleId: string;
    eventType: TelemetryEventType;
    featureId?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export declare class TelemetryRepository {
    private getCollection;
    /**
     * Log a telemetry event
     */
    logEvent(event: TelemetryEvent): Promise<void>;
    /**
     * Log feature activation
     */
    logActivation(vehicleId: string, featureId: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log feature deactivation
     */
    logDeactivation(vehicleId: string, featureId: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log feature usage
     */
    logUsage(vehicleId: string, featureId: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log error event
     */
    logError(vehicleId: string, featureId: string, error: any): Promise<void>;
    /**
     * Find events by vehicle
     */
    findByVehicle(vehicleId: string, limit?: number): Promise<TelemetryEvent[]>;
    /**
     * Find events by type
     */
    findByEventType(eventType: TelemetryEventType, limit?: number): Promise<TelemetryEvent[]>;
    /**
     * Find events by vehicle and feature
     */
    findByVehicleAndFeature(vehicleId: string, featureId: string, limit?: number): Promise<TelemetryEvent[]>;
    /**
     * Find events in time range
     */
    findByTimeRange(startDate: Date, endDate: Date, limit?: number): Promise<TelemetryEvent[]>;
    /**
     * Get event count by type
     */
    getEventCountByType(vehicleId: string): Promise<Record<string, number>>;
    /**
     * Delete old telemetry events (manual cleanup if TTL not working)
     */
    deleteOldEvents(daysOld: number): Promise<number>;
}
//# sourceMappingURL=TelemetryRepository.d.ts.map