package com.youns03.expertspork

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

class NativeProjectStore(context: Context) {
    private val preferences = context.getSharedPreferences("expert_spork_native", Context.MODE_PRIVATE)
    private val key = "last_transcription"

    fun save(result: TranscriptionResult) {
        preferences.edit().putString(key, encode(result).toString()).apply()
    }

    fun load(): TranscriptionResult? = runCatching {
        val raw = preferences.getString(key, null) ?: return null
        decode(JSONObject(raw))
    }.getOrNull()

    private fun encode(result: TranscriptionResult) = JSONObject().apply {
        put("title", result.title)
        put("language", result.language)
        put("direction", result.direction)
        put("duration", result.duration)
        put("sentences", JSONArray().also { array ->
            result.sentences.forEach { sentence ->
                array.put(JSONObject().apply {
                    put("id", sentence.id)
                    put("text", sentence.text)
                    put("start", sentence.start)
                    put("end", sentence.end)
                    put("words", JSONArray().also { words ->
                        sentence.words.forEach { word ->
                            words.put(JSONObject().apply {
                                put("id", word.id)
                                put("text", word.text)
                                put("start", word.start)
                                put("end", word.end)
                            })
                        }
                    })
                })
            }
        })
    }

    private fun decode(data: JSONObject): TranscriptionResult {
        val sentenceArray = data.optJSONArray("sentences") ?: JSONArray()
        val sentences = buildList {
            for (i in 0 until sentenceArray.length()) {
                val sentence = sentenceArray.getJSONObject(i)
                val wordsArray = sentence.optJSONArray("words") ?: JSONArray()
                val words = buildList {
                    for (j in 0 until wordsArray.length()) {
                        val word = wordsArray.getJSONObject(j)
                        add(WordTiming(
                            word.optString("id", "w-$i-$j"),
                            word.optString("text"),
                            word.optDouble("start"),
                            word.optDouble("end")
                        ))
                    }
                }
                add(SentenceItem(
                    sentence.optString("id", "s-$i"),
                    sentence.optString("text"),
                    sentence.optDouble("start"),
                    sentence.optDouble("end"),
                    words
                ))
            }
        }
        return TranscriptionResult(
            data.optString("title", "Transcription"),
            data.optString("language", "auto"),
            data.optString("direction", "ltr"),
            data.optDouble("duration"),
            sentences
        )
    }
}
