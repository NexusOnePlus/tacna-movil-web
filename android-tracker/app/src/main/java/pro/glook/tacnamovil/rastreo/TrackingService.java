package pro.glook.tacnamovil.rastreo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import javax.net.ssl.HttpsURLConnection;

public final class TrackingService extends Service implements LocationListener {
    private static final String CHANNEL = "rastreo";
    private static final String STOP = "pro.glook.tacnamovil.rastreo.STOP";
    static boolean active;

    private LocationManager locationManager;
    private SharedPreferences vehicle;
    private ScheduledExecutorService sender;
    private volatile Location latest;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (sender != null) return START_NOT_STICKY;

        startForeground(1, createNotification());
        vehicle = getSharedPreferences("vehicle", MODE_PRIVATE);
        locationManager = getSystemService(LocationManager.class);
        String provider = LocationManager.GPS_PROVIDER;
        if (Build.VERSION.SDK_INT >= 31
                && locationManager.isProviderEnabled(LocationManager.FUSED_PROVIDER)) {
            provider = LocationManager.FUSED_PROVIDER;
        } else if (!locationManager.isProviderEnabled(provider)) {
            provider = LocationManager.NETWORK_PROVIDER;
        }
        try {
            locationManager.requestLocationUpdates(provider, 2_000, 0, this);
        } catch (IllegalArgumentException | SecurityException unavailable) {
            stopSelf();
            return START_NOT_STICKY;
        }

        active = true;
        sender = Executors.newSingleThreadScheduledExecutor();
        sender.scheduleWithFixedDelay(this::sendLatest, 0, 5, TimeUnit.SECONDS);
        return START_NOT_STICKY;
    }

    private Notification createNotification() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(new NotificationChannel(
                CHANNEL, getString(R.string.app_name), NotificationManager.IMPORTANCE_LOW));
        PendingIntent open = PendingIntent.getActivity(this, 0,
                new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        PendingIntent stop = PendingIntent.getService(this, 1,
                new Intent(this, TrackingService.class).setAction(STOP), PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setContentTitle(getString(R.string.transmitiendo))
                .setContentIntent(open)
                .setOngoing(true)
                .addAction(new Notification.Action.Builder(
                        null, getString(R.string.detener), stop).build())
                .build();
    }

    @Override
    public void onLocationChanged(Location location) {
        latest = location;
    }

    private void sendLatest() {
        Location fix = latest;
        if (fix == null || SystemClock.elapsedRealtimeNanos() - fix.getElapsedRealtimeNanos()
                > TimeUnit.SECONDS.toNanos(20)) return;

        Map<String, ?> fields = vehicle.getAll();
        String route = fields.get("route") instanceof String ? ((String) fields.get("route")).trim() : "";
        String plate = fields.get("plate_or_name") instanceof String
                ? ((String) fields.get("plate_or_name")).trim() : "";
        if (!route.matches("[0-9]{1,6}") || plate.isEmpty()) return;

        HttpsURLConnection connection = null;
        try {
            byte[] body = new JSONObject()
                    .put("ruta", route)
                    .put("placa_o_nombre", plate)
                    .put("lat", fix.getLatitude())
                    .put("lng", fix.getLongitude())
                    .toString().getBytes(StandardCharsets.UTF_8);
            connection = (HttpsURLConnection) new URL(BuildConfig.RASTREO_ENDPOINT).openConnection();
            connection.setConnectTimeout(4_000);
            connection.setReadTimeout(5_000);
            connection.setInstanceFollowRedirects(false);
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setFixedLengthStreamingMode(body.length);
            connection.setDoOutput(true);
            try (OutputStream output = connection.getOutputStream()) {
                output.write(body);
            }
            connection.getResponseCode();
        } catch (IOException | JSONException unavailable) {
            // La siguiente ejecución toma la última lectura disponible.
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    @Override
    public void onDestroy() {
        active = false;
        if (locationManager != null) locationManager.removeUpdates(this);
        if (sender != null) sender.shutdownNow();
        stopForeground(STOP_FOREGROUND_REMOVE);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
