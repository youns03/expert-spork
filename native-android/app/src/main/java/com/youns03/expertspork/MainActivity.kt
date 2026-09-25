package com.youns03.expertspork

import android.content.Context
import android.media.MediaPlayer
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
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

@Composable
private fun NativeHomeScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val backend = remember { BackendClient() }
    val store = remember { NativeProjectStore(context) }
    val audioPlayer = remember { NativeAudioPlayer(context) }
    var selectedUri by remember { mutableStateOf<Uri?>(null) }
    var selectedMime by remember { mutableStateOf("audio/mp3") }
    var transcription by remember { mutableStateOf<TranscriptionResult?>(null) }
    var status by remember { mutableStateOf("اختر ملفًا صوتيًا للبدء") }
    var loading by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        store.load()?.let {
            transcription = it
            status = "تمت استعادة آخر تفريغ محليًا"
        }
    }

    DisposableEffect(audioPlayer) {
        onDispose { audioPlayer.release() }
    }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            selectedUri = uri
            selectedMime = context.contentResolver.getType(uri) ?: "audio/mp3"
            transcription = null
            status = "تم اختيار الملف. اضغط تفريغ الصوت."
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("Expert Spork", style = MaterialTheme.typography.headlineMedium)
        Text("Android Native — بدون WebView")
        Text("Gemini يعمل عبر Backend الشخصي، ولا يوجد مفتاح داخل التطبيق.")

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Button(onClick = { picker.launch(arrayOf("audio/*")) }) {
                Text("اختيار صوت")
            }
            Button(
                enabled = selectedUri != null && !loading,
                onClick = {
                    val uri = selectedUri ?: return@Button
                    loading = true
                    status = "جارٍ رفع الصوت إلى Backend..."
                    scope.launch {
                        val result = runCatching {
                            val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                                ?: error("تعذر قراءة الملف")
                            backend.transcribeAudio(bytes, selectedMime).getOrThrow()
                        }
                        result.onSuccess {
                            transcription = it
                            store.save(it)
                            status = "اكتمل التفريغ: ${it.sentences.size} جمل"
                        }.onFailure {
                            status = "فشل التفريغ: ${it.message}"
                        }
                        loading = false
                    }
                }
            ) {
                Text("تفريغ الصوت")
            }
        }

        if (loading) CircularProgressIndicator()
        Text(status)

        transcription?.let { result ->
            Text(result.title, style = MaterialTheme.typography.titleLarge)
            Text("اللغة: ${result.language} • المدة: ${"%.1f".format(result.duration)} ث")
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(result.sentences, key = { it.id }) { sentence ->
                    SentenceCard(sentence, backend, audioPlayer, scope)
                }
            }
        }
    }
}

@Composable
private fun SentenceCard(
    sentence: SentenceItem,
    backend: BackendClient,
    audioPlayer: NativeAudioPlayer,
    scope: kotlinx.coroutines.CoroutineScope
) {
    var playing by remember { mutableStateOf(false) }
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(sentence.text, style = MaterialTheme.typography.bodyLarge)
            Text("${sentence.start}s → ${sentence.end}s", style = MaterialTheme.typography.labelMedium)
            Button(onClick = {
                playing = true
                scope.launch {
                    backend.synthesize(sentence.text)
                        .onSuccess { bytes -> audioPlayer.play(bytes) }
                    playing = false
                }
            }) {
                Text(if (playing) "جارٍ التوليد..." else "تشغيل الجملة")
            }
        }
    }
}

private class NativeAudioPlayer(private val context: Context) {
    private var player: MediaPlayer? = null

    fun play(bytes: ByteArray) {
        val file = java.io.File.createTempFile("expert-spork-", ".mp3", context.cacheDir)
        file.writeBytes(bytes)
        player?.release()
        player = MediaPlayer().apply {
            setDataSource(file.absolutePath)
            setOnCompletionListener { file.delete() }
            prepare()
            start()
        }
    }

    fun release() {
        player?.release()
        player = null
    }
}
