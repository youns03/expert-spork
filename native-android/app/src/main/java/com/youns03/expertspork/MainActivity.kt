package com.youns03.expertspork

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    NativeHomeScreen()
                }
            }
        }
    }
}

@androidx.compose.runtime.Composable
private fun NativeHomeScreen() {
    val scope = rememberCoroutineScope()
    val backend = remember { BackendClient() }
    var status by remember { mutableStateOf("جاهز للعمل") }
    var loading by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Expert Spork", style = MaterialTheme.typography.headlineMedium)
        Text("نسخة Android أصلية بدون WebView")
        Text("Gemini يعمل عبر Backend الشخصي، ولا يوجد مفتاح داخل التطبيق.")
        Button(
            modifier = Modifier.fillMaxWidth(),
            enabled = !loading,
            onClick = {
                loading = true
                status = "جارٍ فحص الخادم..."
                scope.launch {
                    backend.health()
                        .onSuccess { status = "الخادم متصل: $it" }
                        .onFailure { status = "تعذر الاتصال: ${it.message}" }
                    loading = false
                }
            }
        ) {
            Text(if (loading) "جارٍ الفحص" else "فحص اتصال Backend")
        }
        Text(status)
    }
}
