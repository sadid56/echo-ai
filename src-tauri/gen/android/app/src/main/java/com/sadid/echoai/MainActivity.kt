package com.sadid.echoai

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    val contentView = window.decorView.findViewById<android.view.View>(android.R.id.content)
    ViewCompat.setOnApplyWindowInsetsListener(contentView) { view, windowInsets ->
      val imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime())
      view.setPadding(0, 0, 0, imeInsets.bottom)
      windowInsets
    }
  }
}
