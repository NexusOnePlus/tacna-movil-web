package pro.glook.tacnamovil.rastreo;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.text.InputFilter;
import android.text.InputType;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public final class MainActivity extends Activity {
    private static final int LOCATION_PERMISSION = 1;
    private static final int LOCATION_SETTINGS = 2;
    private static final int NOTIFICATION_PERMISSION = 3;

    private TextView status;
    private Button setup;
    private SharedPreferences vehicle;
    private EditText routeField;
    private EditText plateField;
    private boolean autoStart;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        int padding = Math.round(16 * getResources().getDisplayMetrics().density);
        layout.setPadding(padding, padding, padding, padding);

        vehicle = getSharedPreferences("vehicle", MODE_PRIVATE);
        routeField = addVehicleField(layout, R.string.ruta, "route");
        plateField = addVehicleField(layout, R.string.placa_o_nombre, "plate_or_name");

        status = new TextView(this);
        setup = new Button(this);
        setup.setText(R.string.preparar);
        setup.setOnClickListener(view -> {
            if (TrackingService.active) {
                stopService(new Intent(this, TrackingService.class));
                TrackingService.active = false;
                updateStatus();
            } else {
                if (!saveVehicle()) return;
                autoStart = true;
                prepareLocation();
            }
        });

        layout.addView(status);
        Button save = new Button(this);
        save.setText(R.string.guardar);
        save.setOnClickListener(view -> {
            if (saveVehicle()) status.setText(R.string.guardado);
        });
        layout.addView(save);
        layout.addView(setup);
        ScrollView scroll = new ScrollView(this);
        scroll.setFitsSystemWindows(true);
        scroll.addView(layout);
        setContentView(scroll);
        getWindow().setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN);

        autoStart = savedInstanceState == null || savedInstanceState.getBoolean("autoStart");
        if (savedInstanceState == null && !TrackingService.active) {
            prepareLocation();
        } else {
            updateStatus();
        }
    }

    private EditText addVehicleField(LinearLayout layout, int label, String key) {
        EditText field = new EditText(this);
        field.setId(android.view.View.generateViewId());
        field.setSingleLine(true);
        boolean routeField = label == R.string.ruta;
        field.setInputType(routeField ? InputType.TYPE_CLASS_NUMBER : InputType.TYPE_CLASS_TEXT);
        field.setFilters(new InputFilter[]{new InputFilter.LengthFilter(routeField ? 6 : 64)});
        field.setText(vehicle.getString(key, ""));

        TextView caption = new TextView(this);
        caption.setText(label);
        caption.setLabelFor(field.getId());
        layout.addView(caption);
        layout.addView(field);

        return field;
    }

    private boolean saveVehicle() {
        String route = routeField.getText().toString().trim();
        String plate = plateField.getText().toString().trim();
        if (!route.matches("[0-9]{1,6}")) {
            routeField.setError(getString(R.string.ruta_invalida));
            return false;
        }
        if (plate.isEmpty() || plate.matches("(?s).*[\\p{C}].*")) {
            plateField.setError(getString(R.string.placa_invalida));
            return false;
        }
        vehicle.edit().putString("route", route).putString("plate_or_name", plate).apply();
        return true;
    }

    private void prepareLocation() {
        updateStatus();
        if (hasPreciseLocation()) {
            if (!isLocationEnabled()) {
                startActivityForResult(
                        new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS), LOCATION_SETTINGS);
            } else if (autoStart) {
                startTracking();
            }
            return;
        }

        if (shouldShowRequestPermissionRationale(Manifest.permission.ACCESS_FINE_LOCATION)
                || !getPreferences(MODE_PRIVATE).getBoolean("location_requested", false)) {
            getPreferences(MODE_PRIVATE).edit().putBoolean("location_requested", true).apply();
            requestPermissions(new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
            }, LOCATION_PERMISSION);
        } else {
            Intent settings = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    android.net.Uri.fromParts("package", getPackageName(), null));
            startActivityForResult(settings, LOCATION_SETTINGS);
        }
    }

    private void startTracking() {
        if (TrackingService.active) return;
        if (!vehicle.getString("route", "").matches("[0-9]{1,6}")
                || vehicle.getString("plate_or_name", "").isEmpty()) return;
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED
                && !getPreferences(MODE_PRIVATE).getBoolean("notification_requested", false)) {
            getPreferences(MODE_PRIVATE).edit().putBoolean("notification_requested", true).apply();
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION);
            return;
        }
        autoStart = false;
        startForegroundService(new Intent(this, TrackingService.class));
        moveTaskToBack(true);
    }

    private boolean hasPreciseLocation() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
    }

    private boolean isLocationEnabled() {
        LocationManager location = getSystemService(LocationManager.class);
        if (Build.VERSION.SDK_INT >= 28) {
            return location.isLocationEnabled();
        }
        return location.isProviderEnabled(LocationManager.GPS_PROVIDER)
                || location.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
    }

    private void updateStatus() {
        if (TrackingService.active) {
            status.setText(R.string.transmitiendo);
            setup.setText(R.string.detener);
            return;
        }
        if (!hasPreciseLocation()) {
            status.setText(R.string.permiso);
        } else if (!isLocationEnabled()) {
            status.setText(R.string.habilitar);
        } else {
            status.setText(R.string.listo);
        }
        setup.setText(hasPreciseLocation() && isLocationEnabled() ? R.string.iniciar : R.string.preparar);
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateStatus();
    }

    @Override
    protected void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        state.putBoolean("autoStart", autoStart);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == LOCATION_PERMISSION) {
            if (hasPreciseLocation()) {
                prepareLocation();
            } else {
                updateStatus();
            }
        } else if (requestCode == NOTIFICATION_PERMISSION && hasPreciseLocation() && isLocationEnabled()) {
            startTracking();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == LOCATION_SETTINGS) {
            updateStatus();
            if (hasPreciseLocation() && isLocationEnabled() && autoStart) startTracking();
        }
    }
}
