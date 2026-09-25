package com.youns03.expertspork

import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject

class BackendClient(
    private val baseUrl: String = BuildConfig.BACKEND_BASE_URL,
    private val client: OkHttpClient = OkHttpClient()
) {
    private val jsonType = "application/json; charset=utf-8".toMediaType()

    suspend fun health(): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val response = executeGet("/api/health")
            response
        }
    }

    suspend fun transcribeAudio(
        audioBytes: ByteArray,
        mimeType: String,
        durationSeconds: Double? = null,
        languageHint: String? = null
    ): Result<TranscriptionResult> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject().apply {
                put("audioBase64", Base64.encodeToString(audioBytes, Base64.NO_WRAP))
                put("mimeType", mimeType)
                durationSeconds?.let { put("duration", it) }
                languageHint?.let { put("languageHint", it) }
            }
            val body = post("/api/transcribe-audio", payload)
            parseTranscription(body.getJSONObject("data"))
        }
    }

    suspend fun translate(text: String, from: String = "fr", to: String = "ar"): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val body = post("/api/translate", JSONObject().apply {
                put("text", text)
                put("from", from)
                put("to", to)
            })
            body.optString("translation", text)
        }
    }

    suspend fun synthesize(text: String, voice: String = "fr-FR-RemyMultilingualNeural"): Result<ByteArray> = withContext(Dispatchers.IO) {
        runCatching {
            val body = post("/api/tts", JSONObject().apply {
                put("text", text)
                put("voice", voice)
            })
            val dataUrl = body.getString("audioBase64")
            val encoded = dataUrl.substringAfter(",", dataUrl)
            Base64.decode(encoded, Base64.DEFAULT)
        }
    }

    private fun executeGet(path: String): String {
        val request = Request.Builder().url(url(path)).get().build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) error("Backend HTTP ${response.code}")
            return response.body?.string().orEmpty()
        }
    }

    private fun post(path: String, payload: JSONObject): JSONObject {
        val request = Request.Builder()
            .url(url(path))
            .post(payload.toString().toRequestBody(jsonType))
            .build()
        client.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty()
            if (!response.isSuccessful) error("Backend HTTP ${response.code}: $text")
            return JSONObject(text)
        }
    }

    private fun url(path: String): String = baseUrl.trimEnd('/') + path

    private fun parseTranscription(data: JSONObject): TranscriptionResult {
        val sentenceArray = data.optJSONArray("sentences") ?: JSONArray()
        val sentences = buildList {
            for (i in 0 until sentenceArray.length()) {
                val sentence = sentenceArray.getJSONObject(i)
                val wordArray = sentence.optJSONArray("words") ?: JSONArray()
                val words = buildList {
                    for (j in 0 until wordArray.length()) {
                        val word = wordArray.getJSONObject(j)
                        add(WordTiming(
                            id = word.optString("id", "w-$i-$j"),
                            text = word.optString("text"),
                            start = word.optDouble("start", 0.0),
                            end = word.optDouble("end", 0.0)
                        ))
                    }
                }
                add(SentenceItem(
                    id = sentence.optString("id", "s-$i"),
                    text = sentence.optString("text"),
                    start = sentence.optDouble("start", 0.0),
                    end = sentence.optDouble("end", 0.0),
                    words = words
                ))
            }
        }
        return TranscriptionResult(
            title = data.optString("title", "Transcription"),
            language = data.optString("language", "auto"),
            direction = data.optString("direction", "ltr"),
            duration = data.optDouble("duration", 0.0),
            sentences = sentences
        )
    }
}
