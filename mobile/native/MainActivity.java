package com.rangritii.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

/**
 * Rangritii runs the live website (https://rangritii.vercel.app) inside the app,
 * so every website update reaches the app instantly — no new APK needed.
 *
 * Capacitor already opens WhatsApp, phone (tel:), UPI (upi://) and other
 * outside links in the right app. Here we add the Android back button:
 * it goes back one page inside the app, and only closes the app on the first page.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }
}
