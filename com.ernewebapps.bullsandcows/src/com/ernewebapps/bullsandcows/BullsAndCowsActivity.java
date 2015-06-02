package com.ernewebapps.bullsandcows;

import java.io.File;
import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebStorage;

public class BullsAndCowsActivity extends Activity {
	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		final WebView wv = new WebView(this);

		// String hello =
		// "<html><body><p>This could be HTML UI.</p></body></html>";
		// wv.loadData(hello, "text/html", "utf-8");
		File sharedDir = this.getApplicationContext().getDir("android_asset",
				Context.MODE_PRIVATE);

		wv.loadUrl("file:///android_asset/index.html");
		wv.getSettings().setJavaScriptEnabled(true);
		wv.getSettings().setDatabaseEnabled(true);
		wv.getSettings().setDatabasePath(sharedDir.getPath());
		wv.getSettings().setDomStorageEnabled(true);
		wv.getSettings().setAllowFileAccess(true); 
		wv.setWebChromeClient(new WebChromeClient() {
			@Override
			public void onExceededDatabaseQuota(String url,
					String databaseIdentifier, long currentQuota,
					long estimatedSize, long totalUsedQuota,
					WebStorage.QuotaUpdater quotaUpdater) {
				quotaUpdater.updateQuota(estimatedSize * 2);
			}
		});
		setContentView(wv);
	}
}