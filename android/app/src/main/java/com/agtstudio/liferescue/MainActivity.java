package com.agtstudio.liferescue;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final int NOTIFICATION_PERMISSION_REQUEST = 7001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openExternalUrl(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openExternalUrl(Uri.parse(url));
            }

            private boolean openExternalUrl(Uri uri) {
                String scheme = uri.getScheme();
                if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                    return false;
                }

                // Web links such as "Diğer Ürünler" must open outside the APK WebView.
                // This keeps the app on its current screen so Android's back button
                // returns to AGT LIFE instead of closing the app.
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(Intent.createChooser(intent, "Tarayıcı ile aç"));
                    return true;
                } catch (Exception ignored) {
                    return false;
                }
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(
                WebView view,
                WebResourceRequest request
            ) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(
                WebView view,
                String url
            ) {
                return assetLoader.shouldInterceptRequest(Uri.parse(url));
            }
        });

        webView.addJavascriptInterface(new LocalNotificationBridge(), "AndroidLocalNotifications");
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
        setContentView(webView);
        requestNotificationPermission();
        requestExactAlarmPermission();
        NotificationScheduler.restoreAll(this);
    }
    private void requestExactAlarmPermission() {
        if (android.os.Build.VERSION.SDK_INT >= 31) {
            AlarmManager alarms = (AlarmManager) getSystemService(ALARM_SERVICE);
            if (alarms != null && !alarms.canScheduleExactAlarms()) {
                try {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                } catch (Exception ignored) {}
            }
        }
    }

    private void requestNotificationPermission() {
        if (android.os.Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                NOTIFICATION_PERMISSION_REQUEST
            );
        }
    }

    public class LocalNotificationBridge {
        @JavascriptInterface
        public void scheduleNotification(String payload) {
            try {
                JSONObject data = new JSONObject(payload);
                NotificationScheduler.schedule(
                    MainActivity.this,
                    data.getString("id"),
                    data.getString("title"),
                    data.getString("body"),
                    java.time.Instant.parse(data.getString("scheduledAt")).toEpochMilli(),
                    data.optString("url", "/izci"),
                    data.optString("recurrence", "")
                );
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void cancelNotification(String id) {
            NotificationScheduler.cancel(MainActivity.this, id);
        }
    }
}
