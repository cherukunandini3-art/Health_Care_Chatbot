package com.healthcare.util;

/**
 * Utility for calculating distance between two GPS coordinates using the
 * Haversine formula.
 */
public class HaversineUtil {

    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Returns the distance in kilometres between two lat/lon points.
     */
    public static double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    /**
     * Formats a km distance to a human-readable string ("2.4 km").
     */
    public static String format(double km) {
        return String.format("%.1f km", km);
    }

    private HaversineUtil() {
    }
}
