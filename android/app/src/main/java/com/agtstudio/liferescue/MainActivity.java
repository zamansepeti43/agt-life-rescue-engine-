package com.agtstudio.liferescue;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final int NOTIFICATION_PERMISSION_REQUEST = 7001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestNotificationPermission();

        WebView webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        webView.addJavascriptInterface(new LocalNotificationBridge(), "AndroidLocalNotifications");
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
    }

    private void requestNotificationPermission() {
        if (android.os.Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_REQUEST);
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
                    data.optString("url", "/izci")
                );
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void cancelNotification(String id) {
            NotificationScheduler.cancel(MainActivity.this, id);
        }
    }
}
